import { useRef, useState } from 'react';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { UploadProgressModal, type UploadItem } from './UploadProgressModal';
import styles from '../styles/explorer.module.css';

/**
 * Unified Box uploader that combines files and folders into a single upload button.
 * Uses the built-in upload functionality with a simplified UI.
 */
export function BoxUploader() {
  const {
    uploadFiles,
    uploadFolders,
    readOnly,
    canUpload,
    isLoading,
    refresh,
  } = useBoxExplorer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (readOnly || !canUpload) {
    return null;
  }

  const createUploadItems = (files: File[]): UploadItem[] => {
    return files.map((file, index) => ({
      id: `${file.name}-${index}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
  };

  const handleProgress = (fileIndex: number, progress: number) => {
    setUploadItems((prev) => {
      const updated = [...prev];
      if (updated[fileIndex]) {
        updated[fileIndex] = { ...updated[fileIndex], progress };
      }
      return updated;
    });
  };

  const completeUpload = () => {
    setUploadItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading'
          ? { ...item, status: 'completed' as const, progress: 100 }
          : item,
      ),
    );
    setIsUploading(false);
  };

  const failUpload = (errorMsg: string) => {
    setUploadItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading'
          ? { ...item, status: 'error' as const, error: errorMsg }
          : item,
      ),
    );
    setIsUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    // Detect if this is a folder upload (webkitRelativePath present)
    const isFolderUpload = files.some(
      (f) => (f as any).webkitRelativePath && (f as any).webkitRelativePath.length > 0
    );

    const items = createUploadItems(files);
    setUploadItems(items);
    setShowProgress(true);
    setIsUploading(true);

    try {
      if (isFolderUpload) {
        await uploadFolders(files, handleProgress);
      } else {
        await uploadFiles(files, handleProgress);
      }
      completeUpload();
      refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      failUpload(errorMsg);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenUploader = () => {
    fileInputRef.current?.click();
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    setUploadItems([]);
  };

  return (
    <>
      <button
        className={styles.toolbarBtn}
        onClick={handleOpenUploader}
        disabled={isLoading || isUploading}
        title="Upload files or folders"
      >
        {isLoading || isUploading ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={styles.spinning}
          >
            <path d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 .01 3.58.01 8S3.58 16 8 16c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 018 14 6 6 0 012 8a6 6 0 016-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L4 5.5h2.5V10h3V5.5H12L8 1z" />
            <path d="M2 12v2h12v-2H2z" />
          </svg>
        )}
        {isLoading || isUploading ? 'Uploading...' : 'Upload'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        {...({ webkitdirectory: '', mozdirectory: '' } as any)}
      />

      {showProgress && (
        <UploadProgressModal items={uploadItems} onClose={handleCloseProgress} />
      )}
    </>
  );
}
