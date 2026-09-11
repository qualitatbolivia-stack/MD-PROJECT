import React from 'react';
import { FileText, Sparkles, Trash2, DownloadCloud } from 'lucide-react';

interface HeaderProps {
  filesCount: number;
  completedCount: number;
  onClearAll: () => void;
  onDownloadAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filesCount,
  completedCount,
  onClearAll,
  onDownloadAll,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold text-stone-900 tracking-tight">
                File to Markdown
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Transform Word, PDF, images, spreadsheets & documents into clean Markdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completedCount > 1 && (
            <button
              id="download-all-btn"
              onClick={onDownloadAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Download all converted files"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Download All ({completedCount})</span>
            </button>
          )}

          {filesCount > 0 && (
            <button
              id="clear-all-btn"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Clear all files from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear List</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
