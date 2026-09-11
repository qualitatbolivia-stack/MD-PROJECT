import { FileCategory } from '../types';

export function detectFileCategory(fileName: string, mimeType?: string): FileCategory {
  const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();

  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return 'word';
  }
  if (['pdf'].includes(ext) || mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'heic', 'heif'].includes(ext) ||
    mimeType?.startsWith('image/')
  ) {
    return 'image';
  }
  if (['csv', 'tsv', 'xlsx', 'xls', 'ods'].includes(ext)) {
    return 'sheet';
  }
  if (
    ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'sh', 'sql', 'json', 'yaml', 'yml', 'xml', 'html', 'css'].includes(ext)
  ) {
    return 'code';
  }
  if (['txt', 'log', 'md', 'markdown'].includes(ext) || mimeType?.startsWith('text/')) {
    return 'text';
  }
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function downloadMarkdownFile(fileName: string, content: string): void {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const mdFileName = `${baseName}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = mdFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve(successful);
  } catch (err) {
    return Promise.resolve(false);
  }
}
