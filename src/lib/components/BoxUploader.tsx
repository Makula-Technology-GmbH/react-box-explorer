import { useRef, useState } from 'react';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { UploadProgressModal, type UploadItem } from './UploadProgressModal';
import styles from '../styles/explorer.module.css';

/**
 * Box uploader component that opens Box's native content uploader.
 * This component leverages Box's uploader UI for a seamless experience.
 */
export function BoxUploader() {
  const { refresh, readOnly, canUpload, isLoading } = useBoxExplorer();
  const uploadRef = useRef<HTMLDivElement>(null);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  if (readOnly || !canUpload) {
    return null;
  }

  const handleOpenUploader = async () => {
    // Load Box Content Uploader dynamically if available
    try {
      // Check if Box uploader is available in the window object
      if ((window as any).BoxUploader) {
        const uploader = new (window as any).BoxUploader({
          token: '', // Token will be provided by the parent context
          folderId: '', // Folder ID will be provided by the parent context
          onSuccess: () => {
            refresh();
            // Update progress to show completion
            setUploadItems((prev) =>
              prev.map((item) => ({
                ...item,
                status: 'completed' as const,
                progress: 100,
              }))
            );
          },
          onError: (err: Error) => {
            setUploadItems((prev) =>
              prev.map((item) => ({
                ...item,
                status: 'error' as const,
                error: err.message,
              }))
            );
          },
        });
        uploader.show();
      } else {
        // Fallback: show an error if Box uploader is not available
        console.warn('Box Content Uploader is not available. Please load the Box SDK.');
      }
    } catch (err) {
      console.error('Failed to open Box uploader:', err);
    }
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    setUploadItems([]);
  };

  return (
    <>
      <div ref={uploadRef}>
        <button
          className={styles.toolbarBtn}
          onClick={handleOpenUploader}
          disabled={isLoading}
          title="Upload files and folders using Box uploader"
        >
          {isLoading ? (
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
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {showProgress && (
        <UploadProgressModal items={uploadItems} onClose={handleCloseProgress} />
      )}
    </>
  );
}
