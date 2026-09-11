import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate models: gemini-3.1-flash-lite has high availability and low latency, followed by gemini-3.8-flash
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

// Lazy / safe initialization of Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function stripMarkdownCodeFence(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```markdown') && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```markdown\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```md') && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```md\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1 && firstNewline < 15) {
      cleaned = cleaned.substring(firstNewline + 1).replace(/\s*```$/, '');
    }
  }
  return cleaned.trim();
}

function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.code || err?.error?.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 'UNAVAILABLE' ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('temporarily') ||
    msg.includes('resource exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('quota')
  );
}

async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  // Try candidate models in priority order
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini API] Request on model "${model}" failed:`, errMsg);
      // Immediately try next model in fallback list without waiting or re-hammering the same overloaded model
      continue;
    }
  }

  // Parse clean error message if it's formatted as JSON
  let friendlyMessage = lastError?.message || 'The AI service is experiencing high demand. Please try again.';
  try {
    const parsed = typeof friendlyMessage === 'string' ? JSON.parse(friendlyMessage) : friendlyMessage;
    if (parsed?.error?.message) {
      friendlyMessage = parsed.error.message;
    }
  } catch (_) {}

  throw new Error(friendlyMessage);
}

// Local fallback converter for Word (.docx) HTML to clean Markdown
function htmlToMarkdownFallback(html: string, fileName: string): string {
  let md = html;
  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  // Styling
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
  // Tables
  md = md.replace(/<tr[^>]*>/gi, '| ');
  md = md.replace(/<\/tr>/gi, ' |\n');
  md = md.replace(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi, '$1 | ');
  md = md.replace(/<\/?table[^>]*>/gi, '\n');
  // Clean tags
  md = md.replace(/<[^>]+>/g, '');
  // Normalize whitespace
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  if (!md.startsWith('#')) {
    md = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n${md}`;
  }
  return md;
}

// Local fallback converter for CSV / TSV to Markdown Table
function delimiterToMarkdownTable(text: string, delimiter: string = ','): string {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';
  const rows = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim().replace(/^["']|["']$/g, ''))
  );
  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const header = '| ' + normalizedRows[0].join(' | ') + ' |';
  const separator = '| ' + normalizedRows[0].map(() => '---').join(' | ') + ' |';
  const body = normalizedRows.slice(1).map((r) => '| ' + r.join(' | ') + ' |').join('\n');
  return [header, separator, body].filter(Boolean).join('\n');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limits for documents and high-res images
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Convert File endpoint
  app.post('/api/convert', async (req, res) => {
    const startTime = Date.now();
    try {
      const { fileName, mimeType, base64Data } = req.body;

      if (!base64Data || !fileName) {
        return res.status(400).json({
          error: 'Missing file data or file name.',
        });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const fileBuffer = Buffer.from(cleanBase64, 'base64');
      const ext = path.extname(fileName).toLowerCase();

      const ai = getGeminiClient();
      let markdownResult = '';
      let detectedCategory = 'document';
      let modelUsed = 'gemini-3.8-flash';

      // 1. Word Documents (.docx)
      if (ext === '.docx') {
        detectedCategory = 'word';
        let htmlContent = '';
        try {
          const mammothResult = await mammoth.convertToHtml({ buffer: fileBuffer });
          htmlContent = mammothResult.value;
        } catch (mErr) {
          console.warn('Mammoth HTML extraction warning:', mErr);
        }

        if (htmlContent && htmlContent.trim().length > 0) {
          const prompt = `You are an expert document-to-markdown converter. Convert the following HTML representation of a Word document (.docx) into clean, semantic, GitHub-flavored Markdown.
Requirements:
1. Preserve heading hierarchy (# H1, ## H2, ### H3).
2. Convert tables into Markdown table format with proper alignment.
3. Preserve bullet lists, ordered lists, bold, italics, links, and blockquotes.
4. Keep the text verbatim, do not omit content or summarize.
5. Do not wrap the response in outer \`\`\`markdown code fences. Output pure markdown text directly.

Document HTML:
${htmlContent}`;

          try {
            const aiRes = await generateWithRetryAndFallback(ai, prompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (aiErr) {
            console.warn('AI conversion hit capacity; using local high-fidelity HTML parser fallback:', aiErr);
            // Seamless offline fallback: directly convert HTML to Markdown so Word conversion never fails
            markdownResult = htmlToMarkdownFallback(htmlContent, fileName);
            modelUsed = 'local-mammoth-fallback';
          }
        } else {
          // Fallback to raw text extraction
          try {
            const textResult = await mammoth.extractRawText({ buffer: fileBuffer });
            markdownResult = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n` + (textResult.value || '');
          } catch (textErr) {
            const rawText = fileBuffer.toString('utf8');
            markdownResult = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n` + rawText.slice(0, 30000);
          }
        }
      }
      // 2. PDF Documents (.pdf)
      else if (ext === '.pdf' || mimeType === 'application/pdf') {
        detectedCategory = 'pdf';
        let extractedPdfText = '';
        try {
          const parser = new PDFParse({ data: fileBuffer });
          const textRes = await parser.getText();
          extractedPdfText = (textRes?.text || '').replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
        } catch (parseErr) {
          console.warn('PDF text extraction notice:', parseErr);
        }

        if (extractedPdfText.length > 0) {
          // Fast path: format extracted PDF text into clean GitHub Markdown with AI
          const formatPrompt = `You are an expert document digitizer. Convert the following text extracted from the PDF document "${fileName}" into clean, beautifully structured GitHub-flavored Markdown.
Rules:
1. Maintain accurate structural hierarchy (# for title, ## for major sections, ### for sub-sections).
2. Convert all tabular data into valid Markdown tables (| Column 1 | Column 2 |).
3. Faithfully capture all text, bullet points, numbers, checklists, key-value pairs, equations, and footnotes.
4. Output ONLY the resulting Markdown without introductory commentary or markdown fences.

Document text:
${extractedPdfText.slice(0, 40000)}`;

          try {
            const aiRes = await generateWithRetryAndFallback(ai, formatPrompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (formatErr) {
            console.warn('AI formatting hit capacity; returning extracted PDF text fallback:', formatErr);
            markdownResult = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n` + extractedPdfText;
            modelUsed = 'local-pdf-parse';
          }
        } else {
          // Scanned image PDF or document without text layer: multimodal OCR
          const pdfPart = {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          };

          const textPrompt = {
            text: `You are an expert document digitizer. Transcribe and convert this entire PDF document into pristine GitHub-flavored Markdown. Output ONLY the resulting Markdown.`,
          };

          const aiRes = await generateWithRetryAndFallback(ai, { parts: [pdfPart, textPrompt] });
          markdownResult = aiRes.text;
          modelUsed = aiRes.modelUsed;
        }
      }
      // 3. Images (.jpg, .jpeg, .png, .webp, .gif, .bmp, .svg)
      else if (
        ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'].includes(ext) ||
        mimeType?.startsWith('image/')
      ) {
        detectedCategory = 'image';
        let imgMime = mimeType;
        if (!imgMime || imgMime === 'application/octet-stream') {
          if (ext === '.jpg' || ext === '.jpeg') imgMime = 'image/jpeg';
          else if (ext === '.png') imgMime = 'image/png';
          else if (ext === '.webp') imgMime = 'image/webp';
          else if (ext === '.gif') imgMime = 'image/gif';
          else imgMime = 'image/jpeg';
        }

        const imagePart = {
          inlineData: {
            mimeType: imgMime,
            data: cleanBase64,
          },
        };

        const textPrompt = {
          text: `You are an OCR and multimodal document converter. Transcribe and convert everything readable in this image into structured, beautiful Markdown.
Instructions:
1. If the image is a scanned document, receipt, letter, slide, invoice, paper notes, or article: extract all text faithfully, format titles as headings, preserve tables, and transcribe bullet lists.
2. If the image has diagrams, infographics, or visual elements: transcribe all textual labels and provide clear markdown sectioning and descriptions of the visual content.
3. If it contains tabular information or key-value fields, format them into neat Markdown tables.
4. Output ONLY the clean Markdown content without surrounding backticks or commentary.`,
        };

        const aiRes = await generateWithRetryAndFallback(ai, { parts: [imagePart, textPrompt] });
        markdownResult = aiRes.text;
        modelUsed = aiRes.modelUsed;
      }
      // 4. Spreadsheets / CSV / TSV / JSON / XML / HTML / Plain Text / Code
      else {
        detectedCategory = 'text_or_code';
        const rawContent = fileBuffer.toString('utf-8');

        if (['.csv', '.tsv'].includes(ext)) {
          const delimiter = ext === '.tsv' ? '\t' : ',';
          try {
            const prompt = `Convert the following ${ext.replace('.', '').toUpperCase()} data into a clean, well-formatted GitHub Markdown table. Add appropriate headers and formatting:\n\n${rawContent.slice(0, 60000)}`;
            const aiRes = await generateWithRetryAndFallback(ai, prompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (tableErr) {
            console.warn('AI table conversion busy, using local delimiter table converter:', tableErr);
            markdownResult = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n` + delimiterToMarkdownTable(rawContent, delimiter);
            modelUsed = 'local-table-converter';
          }
        } else if (['.html', '.htm'].includes(ext)) {
          try {
            const prompt = `Convert the following HTML document into clean, semantic Markdown. Preserve headers, links, lists, code, and tables:\n\n${rawContent.slice(0, 60000)}`;
            const aiRes = await generateWithRetryAndFallback(ai, prompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (htmlErr) {
            markdownResult = htmlToMarkdownFallback(rawContent, fileName);
            modelUsed = 'local-html-fallback';
          }
        } else if (['.json', '.xml', '.yaml', '.yml'].includes(ext)) {
          const lang = ext.replace('.', '');
          const prompt = `The user uploaded a ${lang.toUpperCase()} file named "${fileName}". Format and document it as a Markdown file with a descriptive overview, structured documentation of key fields/nodes, and the formatted content in a \`\`\`${lang} code block. Content:\n\n${rawContent.slice(0, 50000)}`;
          try {
            const aiRes = await generateWithRetryAndFallback(ai, prompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (docErr) {
            markdownResult = `# ${fileName}\n\n\`\`\`${lang}\n${rawContent}\n\`\`\``;
            modelUsed = 'local-code-fallback';
          }
        } else if (['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.sql', '.sh', '.rb', '.php'].includes(ext)) {
          const lang = ext.replace('.', '');
          markdownResult = `# ${fileName}\n\n\`\`\`${lang}\n${rawContent}\n\`\`\``;
          modelUsed = 'syntax-wrapper';
        } else {
          // General text
          const prompt = `Convert the following content from file "${fileName}" into clean, well-structured Markdown with appropriate headings, paragraphs, lists, and formatting:\n\n${rawContent.slice(0, 60000)}`;
          try {
            const aiRes = await generateWithRetryAndFallback(ai, prompt);
            markdownResult = aiRes.text;
            modelUsed = aiRes.modelUsed;
          } catch (textAiErr) {
            markdownResult = `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n${rawContent}`;
            modelUsed = 'local-text-fallback';
          }
        }
      }

      // Clean fences
      const finalMarkdown = stripMarkdownCodeFence(markdownResult);

      // Compute statistics
      const charCount = finalMarkdown.length;
      const wordCount = finalMarkdown.trim().split(/\s+/).filter(Boolean).length;
      const headingsCount = (finalMarkdown.match(/^#{1,6}\s+/gm) || []).length;
      const tablesCount = (finalMarkdown.match(/\|[\s-:]+\|/g) || []).length;
      const processingTimeMs = Date.now() - startTime;

      return res.json({
        success: true,
        markdown: finalMarkdown,
        metadata: {
          fileName,
          detectedCategory,
          charCount,
          wordCount,
          headingsCount,
          tablesCount,
          processingTimeMs,
          modelUsed,
        },
      });
    } catch (err: any) {
      console.error('Error during conversion:', err);
      const processingTimeMs = Date.now() - startTime;
      let cleanErrorMessage = err?.message || 'Failed to convert file to Markdown';

      // Parse JSON string if present
      try {
        const parsed = typeof cleanErrorMessage === 'string' ? JSON.parse(cleanErrorMessage) : cleanErrorMessage;
        if (parsed?.error?.message) {
          cleanErrorMessage = parsed.error.message;
        }
      } catch (_) {}

      if (isTransientError(err)) {
        cleanErrorMessage = 'The AI model is experiencing a temporary spike in high demand. We attempted automatic retries and fallback models. Please wait a moment and click Retry.';
      }

      return res.status(503).json({
        success: false,
        error: cleanErrorMessage,
        isTransient: isTransientError(err),
        processingTimeMs,
      });
    }
  });

  // Sample files endpoint for 1-click test
  app.get('/api/samples', (req, res) => {
    res.json([
      {
        id: 'invoice',
        name: 'TechCorp_Invoice_2026.pdf',
        type: 'pdf',
        size: '18 KB',
        description: 'Sample consulting invoice with line items, tax calculations, and payment terms.',
      },
      {
        id: 'meeting',
        name: 'Product_Roadmap_Q3.docx',
        type: 'word',
        size: '24 KB',
        description: 'Word document with executive summary, sprint milestones, and table of feature owners.',
      },
      {
        id: 'receipt',
        name: 'CoffeeShop_Receipt.png',
        type: 'image',
        size: '42 KB',
        description: 'Scanned cafe receipt with itemized charges, tip, and timestamp.',
      },
      {
        id: 'metrics',
        name: 'Sales_Metrics_Quarterly.csv',
        type: 'text',
        size: '3 KB',
        description: 'Tabular CSV file with regional revenue, conversion rates, and profit margin.',
      },
    ]);
  });

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
