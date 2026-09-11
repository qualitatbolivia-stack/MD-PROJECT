/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { MarkdownViewer } from './components/MarkdownViewer';
import { FileConversionItem, SampleDoc } from './types';
import {
  detectFileCategory,
  readFileAsBase64,
  downloadMarkdownFile,
} from './utils/fileHelpers';
import { Upload, Sparkles, AlertTriangle } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<FileConversionItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean | null>(null);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasServerApiKey(data.hasApiKey);
      })
      .catch((err) => {
        console.warn('Backend health check error:', err);
      });
  }, []);

  // Process a file through the backend
  const processFile = async (item: FileConversionItem, fileObject?: File) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'converting', error: undefined } : f
        )
      );

      let base64 = item.rawBase64;
      if (!base64 && fileObject) {
        base64 = await readFileAsBase64(fileObject);
      }

      if (!base64) {
        throw new Error('Could not read file data');
      }

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: item.name,
          mimeType: item.type,
          base64Data: base64,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        let msg = result.error || `Conversion failed with status ${response.status}`;
        try {
          const parsed = typeof msg === 'string' ? JSON.parse(msg) : msg;
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch (_) {}
        throw new Error(msg);
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'completed',
                markdown: result.markdown,
                metadata: result.metadata,
                rawBase64: base64,
              }
            : f
        )
      );
    } catch (err: any) {
      console.error('File conversion failed:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'error',
                error: err.message || 'Failed to convert file',
              }
            : f
        )
      );
    }
  };

  // Handle newly selected files
  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setShowAddModal(false);

    const newItems: { item: FileConversionItem; file: File }[] = [];

    for (const file of selectedFiles) {
      const id = 'file-' + Math.random().toString(36).substring(2, 9);
      const category = detectFileCategory(file.name, file.type);

      const newItem: FileConversionItem = {
        id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category,
        status: 'queued',
        progress: 0,
        markdown: '',
        createdAt: Date.now(),
      };

      newItems.push({ item: newItem, file });
    }

    setFiles((prev) => [...newItems.map((n) => n.item), ...prev]);
    setActiveFileId(newItems[0].item.id);

    // Concurrently or sequentially process files
    for (const { item, file } of newItems) {
      processFile(item, file);
    }
  }, []);

  // Handle sample document selection (instant test)
  const handleSampleSelected = (sample: SampleDoc) => {
    const id = 'sample-' + sample.id + '-' + Math.random().toString(36).substring(2, 6);
    const words = sample.mockMarkdown.trim().split(/\s+/).filter(Boolean).length;
    const chars = sample.mockMarkdown.length;
    const headings = (sample.mockMarkdown.match(/^#{1,6}\s+/gm) || []).length;
    const tables = (sample.mockMarkdown.match(/\|[\s-:]+\|/g) || []).length;

    const sampleItem: FileConversionItem = {
      id,
      name: sample.name,
      size: 45000,
      type: 'text/markdown',
      category: sample.category,
      status: 'completed',
      progress: 100,
      markdown: sample.mockMarkdown,
      metadata: {
        charCount: chars,
        wordCount: words,
        headingsCount: headings,
        tablesCount: tables,
        processingTimeMs: 420,
      },
      createdAt: Date.now(),
    };

    setFiles((prev) => [sampleItem, ...prev]);
    setActiveFileId(id);
    setShowAddModal(false);
  };

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
  };

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const handleRetryFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = files.find((f) => f.id === id);
    if (target) {
      processFile(target);
    }
  };

  const handleUpdateMarkdown = (id: string, newMarkdown: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const words = newMarkdown.trim().split(/\s+/).filter(Boolean).length;
        const chars = newMarkdown.length;
        const headings = (newMarkdown.match(/^#{1,6}\s+/gm) || []).length;
        const tables = (newMarkdown.match(/\|[\s-:]+\|/g) || []).length;

        return {
          ...f,
          markdown: newMarkdown,
          metadata: f.metadata
            ? {
                ...f.metadata,
                wordCount: words,
                charCount: chars,
                headingsCount: headings,
                tablesCount: tables,
              }
            : undefined,
        };
      })
    );
  };

  const handleClearAll = () => {
    setFiles([]);
    setActiveFileId(null);
  };

  const handleDownloadAll = () => {
    const completed = files.filter((f) => f.status === 'completed' && f.markdown);
    completed.forEach((file, index) => {
      // Stagger downloads to avoid browser blocking multiple simultaneous downloads
      setTimeout(() => {
        downloadMarkdownFile(file.name, file.markdown);
      }, index * 250);
    });
  };

  const activeFile = files.find((f) => f.id === activeFileId) || null;
  const completedCount = files.filter((f) => f.status === 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 selection:bg-amber-200">
      <Header
        filesCount={files.length}
        completedCount={completedCount}
        onClearAll={handleClearAll}
        onDownloadAll={handleDownloadAll}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {files.length === 0 ? (
          /* Empty / Initial state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <DropZone
              onFilesSelected={handleFilesSelected}
              onSampleSelected={handleSampleSelected}
            />
          </div>
        ) : (
          /* Workspace with sidebar and active viewer */
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
            <FileList
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onRemoveFile={handleRemoveFile}
              onRetryFile={handleRetryFile}
              onAddNewClick={() => setShowAddModal(true)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              <MarkdownViewer
                file={activeFile}
                onUpdateMarkdown={handleUpdateMarkdown}
                onRetry={handleRetryFile}
              />
            </div>
          </div>
        )}
      </main>

      {/* Add More Files Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-xl border border-stone-200 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">
                Add More Documents
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <DropZone
              onFilesSelected={handleFilesSelected}
              onSampleSelected={handleSampleSelected}
            />
          </div>
        </div>
      )}
    </div>
  );
}
