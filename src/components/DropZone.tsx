import React, { useRef, useState } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, Code2, Sparkles } from 'lucide-react';
import { SAMPLE_DOCS } from '../data/samples';
import { SampleDoc } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onSampleSelected: (sample: SampleDoc) => void;
  isCompact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onSampleSelected,
  isCompact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  if (isCompact) {
    return (
      <div
        id="compact-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
            : 'border-stone-300 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.csv,.tsv,.xlsx,.xls,.txt,.rtf,.html,.htm,.json,.xml,.yaml,.yml,.md"
        />
        <div className="flex items-center justify-center gap-2 text-stone-700">
          <Upload className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold">Drop more files or browse</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div
        id="main-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        className={`w-full max-w-3xl border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/70 shadow-lg scale-[1.005]'
            : 'border-stone-300 hover:border-amber-600 bg-white hover:bg-stone-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.csv,.tsv,.xlsx,.xls,.txt,.rtf,.html,.htm,.json,.xml,.yaml,.yml,.md"
        />

        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
          Drop files to transform into Markdown
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto mb-6">
          Just drag and drop Word documents, PDFs, images, receipts, or data sheets here. We extract headings, tables, formatting, and text automatically.
        </p>

        <button
          type="button"
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
        >
          Select Files from Computer
        </button>

        {/* Supported formats showcase */}
        <div className="mt-8 pt-6 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-100">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-800">Word (.docx)</div>
              <div className="text-[11px] text-stone-500">Full formatting & tables</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-100">
            <div className="p-1.5 rounded-md bg-red-100 text-red-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-800">PDF Documents</div>
              <div className="text-[11px] text-stone-500">Multi-page OCR & layout</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-100">
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-800">JPG, PNG, WebP</div>
              <div className="text-[11px] text-stone-500">Photos, receipts, scans</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50 border border-stone-100">
            <div className="p-1.5 rounded-md bg-purple-100 text-purple-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-800">CSV & Sheets</div>
              <div className="text-[11px] text-stone-500">Converted to MD tables</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick sample documents bar */}
      <div className="mt-6 w-full max-w-3xl">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-stone-600 uppercase tracking-wider">
            Or test immediately with a sample document
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_DOCS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSampleSelected(sample)}
              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    sample.type === 'pdf'
                      ? 'bg-red-100 text-red-700'
                      : sample.type === 'word'
                      ? 'bg-blue-100 text-blue-700'
                      : sample.type === 'image'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sample.type.toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-stone-900 group-hover:text-amber-900 truncate">
                    {sample.name}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">{sample.description}</div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-stone-400 shrink-0 ml-2">
                {sample.size}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
