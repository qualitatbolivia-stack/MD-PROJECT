import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Columns,
  Sparkles,
  Clock,
  FileText,
  Hash,
  Table,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { FileConversionItem, ViewMode } from '../types';
import { copyToClipboard, downloadMarkdownFile, formatFileSize } from '../utils/fileHelpers';

interface MarkdownViewerProps {
  file: FileConversionItem | null;
  onUpdateMarkdown: (id: string, newMarkdown: string) => void;
  onRetry: (id: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  onUpdateMarkdown,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50/50">
        <div className="text-center max-w-sm text-stone-500">
          <FileText className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-medium text-stone-700">No file selected</p>
          <p className="text-xs text-stone-500 mt-1">
            Choose a file from the sidebar or drag in new files to start converting.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!file.markdown) return;
    const success = await copyToClipboard(file.markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!file.markdown) return;
    downloadMarkdownFile(file.name, file.markdown);
  };

  // 1. Converting State
  if (file.status === 'converting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-700">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 mb-1">
          Converting {file.name}
        </h3>
        <p className="text-xs text-stone-500 max-w-sm text-center mb-6">
          Multimodal document analysis is extracting headings, structures, tables, and text into clean Markdown.
        </p>
        <div className="w-48 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-amber-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (file.status === 'error') {
    let cleanError = file.error || 'An unexpected error occurred during document conversion.';
    try {
      const parsed = typeof cleanError === 'string' ? JSON.parse(cleanError) : cleanError;
      if (parsed?.error?.message) {
        cleanError = parsed.error.message;
      }
    } catch (_) {}

    const isHighDemand =
      cleanError.toLowerCase().includes('high demand') ||
      cleanError.toLowerCase().includes('503') ||
      cleanError.toLowerCase().includes('unavailable') ||
      cleanError.toLowerCase().includes('spikes in demand') ||
      cleanError.toLowerCase().includes('temporary');

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isHighDemand
              ? 'bg-amber-50 border border-amber-200 text-amber-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 mb-1">
          {isHighDemand ? 'AI Model Experiencing High Demand' : 'Conversion Failed'}
        </h3>
        <p className="text-xs text-stone-600 max-w-md text-center mb-6 bg-stone-50 p-3.5 rounded-lg border border-stone-200 leading-relaxed">
          {cleanError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRetry(file.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Conversion</span>
          </button>
        </div>
        {isHighDemand && (
          <p className="text-[11px] text-stone-600 mt-3 text-center max-w-xs">
            Spikes in AI model demand are usually brief. Automated fallback models are primed.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white min-w-0">
      {/* Top action bar */}
      <div className="border-b border-stone-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-stone-50/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-stone-900 truncate">
              {file.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-stone-200 text-stone-700">
              {file.category}
            </span>
          </div>

          {/* Quick stats */}
          {file.metadata && (
            <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500 flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-stone-400" />
                {file.metadata.wordCount.toLocaleString()} words
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-stone-400" />
                {file.metadata.charCount.toLocaleString()} chars
              </span>
              {file.metadata.headingsCount > 0 && (
                <>
                  <span>•</span>
                  <span>{file.metadata.headingsCount} headings</span>
                </>
              )}
              {file.metadata.tablesCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Table className="w-3 h-3 text-stone-400" />
                    {file.metadata.tablesCount} tables
                  </span>
                </>
              )}
              {file.metadata.processingTimeMs > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {(file.metadata.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* View mode toggle & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'rendered'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Preview formatted Markdown"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Raw Markdown text"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Raw</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isEditing
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
            title="Toggle direct Markdown editing"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditing ? 'Done Editing' : 'Edit'}</span>
          </button>

          {/* Copy Button */}
          <button
            id="copy-markdown-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Copy Markdown to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            id="download-markdown-btn"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download as .md file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Rendered Mode */}
        {viewMode === 'rendered' && (
          <div className="h-full overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto">
            <article className="prose prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 pb-2 border-b border-stone-200 mt-6 mb-4 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 mt-6 mb-3 pb-1 border-b border-stone-100">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-stone-800 mt-5 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-stone-700 leading-relaxed my-3 text-[15px]">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-3 text-stone-700 text-[15px] pl-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-3 text-stone-700 text-[15px] pl-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-400 bg-amber-50/50 pl-4 py-2 my-4 italic text-stone-700 rounded-r-md">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-5 border border-stone-200 rounded-xl shadow-2xs">
                      <table className="min-w-full divide-y divide-stone-200 text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-stone-50">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left font-semibold text-stone-800 border-b border-stone-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-stone-700 border-b border-stone-100">
                      {children}
                    </td>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className || String(children).includes('\n');
                    if (isBlock) {
                      return (
                        <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto my-4 border border-stone-800">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-stone-100 text-amber-800 font-mono text-xs border border-stone-200">
                        {children}
                      </code>
                    );
                  },
                  hr: () => <hr className="my-6 border-stone-200" />,
                }}
              >
                {file.markdown}
              </ReactMarkdown>
            </article>
          </div>
        )}

        {/* Raw Mode */}
        {viewMode === 'raw' && (
          <div className="h-full flex flex-col">
            {isEditing ? (
              <textarea
                value={file.markdown}
                onChange={(e) => onUpdateMarkdown(file.id, e.target.value)}
                className="w-full h-full p-6 font-mono text-xs leading-relaxed text-stone-800 bg-stone-50 border-none outline-none resize-none focus:ring-0"
                placeholder="Markdown content..."
              />
            ) : (
              <pre className="w-full h-full p-6 overflow-auto font-mono text-xs leading-relaxed text-stone-800 bg-stone-50 whitespace-pre-wrap selection:bg-amber-200">
                {file.markdown}
              </pre>
            )}
          </div>
        )}

        {/* Split View */}
        {viewMode === 'split' && (
          <div className="h-full grid grid-cols-2 divide-x divide-stone-200">
            {/* Left: Raw Code/Editor */}
            <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
              <div className="p-2.5 bg-stone-100 border-b border-stone-200 text-xs font-semibold text-stone-600 flex items-center justify-between">
                <span>Markdown Source</span>
                <span className="text-[10px] text-stone-400">Directly editable</span>
              </div>
              <textarea
                value={file.markdown}
                onChange={(e) => onUpdateMarkdown(file.id, e.target.value)}
                className="flex-1 p-4 font-mono text-xs leading-relaxed text-stone-800 bg-stone-50 border-none outline-none resize-none"
                placeholder="Type or edit markdown..."
              />
            </div>

            {/* Right: Rendered Output */}
            <div className="h-full overflow-y-auto p-6 bg-white">
              <div className="pb-2 mb-4 border-b border-stone-100 text-xs font-semibold text-stone-600">
                Live Preview
              </div>
              <article className="prose prose-stone prose-sm max-w-none">
                <ReactMarkdown>{file.markdown}</ReactMarkdown>
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
