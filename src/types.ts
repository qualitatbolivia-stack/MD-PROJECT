export type FileCategory = 'word' | 'pdf' | 'image' | 'sheet' | 'code' | 'text' | 'other';

export interface FileConversionItem {
  id: string;
  name: string;
  size: number;
  type: string;
  category: FileCategory;
  status: 'queued' | 'converting' | 'completed' | 'error';
  progress: number;
  markdown: string;
  error?: string;
  rawBase64?: string;
  previewUrl?: string;
  metadata?: {
    charCount: number;
    wordCount: number;
    headingsCount: number;
    tablesCount: number;
    processingTimeMs: number;
    detectedCategory?: string;
  };
  createdAt: number;
}

export type ViewMode = 'rendered' | 'raw' | 'split';

export interface SampleDoc {
  id: string;
  name: string;
  type: 'word' | 'pdf' | 'image' | 'text';
  category: FileCategory;
  size: string;
  description: string;
  mockMarkdown: string;
}
