import React from 'react';
import {
  FileText,
  Image,
  FileSpreadsheet,
  Code2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { FileConversionItem, FileCategory } from '../types';
import { formatFileSize } from '../utils/fileHelpers';

interface FileListProps {
  files: FileConversionItem[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string, e: React.MouseEvent) => void;
  onRetryFile: (id: string, e: React.MouseEvent) => void;
  onAddNewClick: () => void;
}

function getCategoryIcon(category: FileCategory) {
  switch (category) {
    case 'word':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-600" />;
    case 'image':
      return <Image className="w-4 h-4 text-emerald-600" />;
    case 'sheet':
      return <FileSpreadsheet className="w-4 h-4 text-purple-600" />;
    case 'code':
      return <Code2 className="w-4 h-4 text-amber-600" />;
    default:
      return <FileCode className="w-4 h-4 text-stone-500" />;
  }
}

function getCategoryBadgeClass(category: FileCategory) {
  switch (category) {
    case 'word':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'pdf':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'image':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'sheet':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'code':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

export const FileList: React.FC<FileListProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onRetryFile,
  onAddNewClick,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-stone-200 w-full md:w-80 shrink-0">
      <div className="p-3.5 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Files ({files.length})
          </span>
        </div>
        <button
          onClick={onAddNewClick}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More</span>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 relative group ${
                isActive
                  ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                  : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
              }`}
            >
              {/* Category Icon Container */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getCategoryBadgeClass(
                  file.category
                )}`}
              >
                {getCategoryIcon(file.category)}
              </div>

              {/* Title & Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-semibold text-stone-900 truncate">
                    {file.name}
                  </div>
                  {/* Status Indicator */}
                  {file.status === 'converting' && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                  )}
                  {file.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  {file.status === 'converting' && (
                    <span className="text-amber-700 font-medium">Converting...</span>
                  )}
                  {file.status === 'completed' && (
                    <span className="text-emerald-700 font-medium">
                      {file.metadata?.wordCount
                        ? `${file.metadata.wordCount} words`
                        : 'Converted'}
                    </span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-red-600 font-medium">Failed</span>
                  )}
                  {file.status === 'queued' && <span>Queued</span>}
                </div>
              </div>

              {/* Action Buttons (visible on hover / active) */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity self-center">
                {file.status === 'error' && (
                  <button
                    onClick={(e) => onRetryFile(file.id, e)}
                    className="p-1 text-stone-400 hover:text-amber-600 rounded hover:bg-white transition-colors"
                    title="Retry conversion"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => onRemoveFile(file.id, e)}
                  className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-white transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
