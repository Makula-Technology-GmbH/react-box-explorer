import { useRef, useState } from 'react';
import styles from '../styles/explorer.module.css';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  /** Source File — used to retry the upload if it fails. */
  file?: File;
}

interface UploadFilesModalProps {
  onUpload: (files: File[]) => Promise<void>;
  onClose: () => void;
  isUploading?: boolean;
  uploadItems?: UploadItem[];
  onRetry?: (item: UploadItem) => void;
}

export function UploadFilesModal({
  onUpload,
  onClose,
  isUploading = false,
  uploadItems = [],
  onRetry,
}: UploadFilesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    setIsScanning(true);
    setScannedCount(0);
    // Defer to next tick so the loader paints before the (potentially
    // expensive) Array.from over a large FileList runs synchronously.
    setTimeout(() => {
      const files = Array.from(input.files || []);
      setSelectedFiles((prev) => [...prev, ...files]);
      if (folderInputRef.current) folderInputRef.current.value = '';
      setIsScanning(false);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    // IMPORTANT: Extract all entries synchronously before they become invalid.
    // DataTransferItemList is cleared once the drop handler returns, so
    // calling webkitGetAsEntry() asynchronously only works for the first item.
    const entries: any[] = [];
    const directFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== 'file') continue;
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
      } else {
        const file = item.getAsFile();
        if (file) directFiles.push(file);
      }
    }

    const readAllDirEntries = async (reader: any): Promise<any[]> => {
      const all: any[] = [];
      while (true) {
        const batch = await new Promise<any[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        if (batch.length === 0) break;
        all.push(...batch);
      }
      return all;
    };

    const traverseEntry = async (
      entry: any,
      path: string,
      collected: File[],
    ) => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file(resolve, reject);
        });
        if (path) {
          // Keep file.name as just the filename; expose the full path via
          // webkitRelativePath so uploadFolders can recreate the folder tree
          // and Box stores the file under its real name.
          const fullPath = path + file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: fullPath,
            writable: false,
            configurable: true,
          });
        }
        collected.push(file);
        setScannedCount(collected.length + directFiles.length);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const subEntries = await readAllDirEntries(reader);
        for (const subEntry of subEntries) {
          await traverseEntry(subEntry, path + entry.name + '/', collected);
        }
      }
    };

    setIsScanning(true);
    setScannedCount(directFiles.length);
    (async () => {
      const collectedFiles: File[] = [...directFiles];
      try {
        for (const entry of entries) {
          await traverseEntry(entry, '', collectedFiles);
        }
        setSelectedFiles((prev) => [...prev, ...collectedFiles]);
      } finally {
        setIsScanning(false);
      }
    })();
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
  };

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div
        className={styles.previewModal}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '500px', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}
      >
        <div className={styles.previewHeader}>
          <div className={styles.previewHeaderInfo}>
            <span className={styles.previewFileName}>Upload Files & Folders</span>
          </div>
          <button className={styles.previewCloseBtn} onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.3 4.3L8.6 8l3.7 3.7-1 1L7.6 9l-3.7 3.7-1-1L6.6 8 2.9 4.3l1-1L7.6 7l3.7-3.7z" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {uploadItems.length === 0 ? (
            <>
              {/* Drag & Drop Zone - covers full area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  flex: 1,
                  border: '2px dashed #d0d0d0',
                  borderRadius: '0',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                }}
              >
                {isScanning ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#666',
                    }}
                  >
                    <div className={styles.loadingSpinner} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                      Scanning files...
                    </div>
                    {scannedCount > 0 && (
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {scannedCount.toLocaleString()} file
                        {scannedCount === 1 ? '' : 's'} found
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ marginBottom: '12px', opacity: 0.6 }}
                >
                  <path d="M8 1L4 5.5h2.5V10h3V5.5H12L8 1z" />
                  <path d="M2 12v2h12v-2H2z" />
                </svg>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ fontSize: '15px' }}>Drag and drop files or folders here</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0061d5',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      font: 'inherit',
                      marginRight: '4px',
                    }}
                  >
                    click here to browse
                  </button>
                  <span style={{ fontSize: '13px', color: '#999' }}>
                    (files &{' '}
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0061d5',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit',
                      }}
                    >
                      folders
                    </button>
                    )
                  </span>
                </div>

                {/* Selected Files List - shown within drag zone if files exist */}
                {selectedFiles.length > 0 && !isScanning && (
                  <div style={{ marginTop: '24px', width: '100%', maxWidth: '350px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '8px',
                        color: '#333',
                        textAlign: 'left',
                      }}
                    >
                      Selected ({selectedFiles.length})
                    </div>
                    <div
                      style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '4px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                      }}
                    >
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '12px',
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={(file as any).webkitRelativePath || file.name}
                          >
                            {(file as any).webkitRelativePath || file.name}
                          </span>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#999',
                              cursor: 'pointer',
                              padding: '0 4px',
                              fontSize: '16px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Upload Progress View */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#333',
                  }}
                >
                  {isUploading ? 'Uploading' : 'Upload finished'} ({uploadItems.filter((i) => i.status === 'completed').length}/{uploadItems.length})
                  {uploadItems.some((i) => i.status === 'error') && (
                    <span style={{ color: '#dc3545', marginLeft: '6px', fontWeight: 400 }}>
                      — {uploadItems.filter((i) => i.status === 'error').length} failed
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadItems.map((item) => (
                    <div key={item.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {item.status === 'completed' && (
                          <span style={{ color: '#28a745', marginLeft: '8px' }}>✓</span>
                        )}
                        {item.status === 'error' && (
                          <button
                            onClick={() => onRetry?.(item)}
                            disabled={!onRetry || !item.file}
                            title={item.error ? `Retry — ${item.error}` : 'Retry'}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: onRetry && item.file ? 'pointer' : 'not-allowed',
                              padding: 0,
                              marginLeft: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 .01 3.58.01 8S3.58 16 8 16c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 018 14 6 6 0 012 8a6 6 0 016-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#e8e8e8',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${item.progress}%`,
                            backgroundColor: item.status === 'error' ? '#dc3545' : '#0061d5',
                            transition: 'width 0.2s',
                          }}
                        />
                      </div>
                      {item.status === 'error' && item.error && (
                        <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '2px' }}>
                          {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: '' } as any)}
            onChange={handleFolderInput}
            style={{ display: 'none' }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          {uploadItems.length === 0 ? (
            <>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleClear}
                  style={{
                    padding: '6px 16px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '6px 16px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isScanning}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: selectedFiles.length === 0 || isScanning ? '#ccc' : '#0061d5',
                  color: '#fff',
                  cursor: selectedFiles.length === 0 || isScanning ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Upload
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              disabled={uploadItems.some((i) => i.status === 'uploading')}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '4px',
                background: uploadItems.some((i) => i.status === 'uploading') ? '#ccc' : '#0061d5',
                color: '#fff',
                cursor: uploadItems.some((i) => i.status === 'uploading') ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
