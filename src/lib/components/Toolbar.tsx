import { useRef, useState } from 'react';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { UploadProgressModal, type UploadItem } from './UploadProgressModal';
import styles from '../styles/explorer.module.css';

export function Toolbar() {
  const {
    uploadFiles,
    uploadFolders,
    createFolder,
    readOnly,
    refresh,
    isLoading,
    canUpload,
    canCreateFolder: canCreate,
    allowGridView,
    viewMode,
    setViewMode,
  } = useBoxExplorer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  const showUploadBtn = !readOnly && canUpload;
  const showCreateFolder = !readOnly && canCreate;
  const isUploading = uploadItems.some((item) => item.status === 'uploading');
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
    setShowUploadMenu(false);
  };

  const handleFolderUploadClick = () => {
    folderInputRef.current?.click();
    setShowUploadMenu(false);
  };

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
  };

  const failUpload = (errorMsg: string) => {
    setUploadItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading'
          ? { ...item, status: 'error' as const, error: errorMsg }
          : item,
      ),
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, 10);
    const items = createUploadItems(files);
    setUploadItems(items);
    setShowProgress(true);

    try {
      await uploadFiles(files, handleProgress);
      completeUpload();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      failUpload(errorMsg);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const items = createUploadItems(files);
    setUploadItems(items);
    setShowProgress(true);

    try {
      await uploadFolders(files, handleProgress);
      completeUpload();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      failUpload(errorMsg);
    }

    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleCreateFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createFolder(name);
      setFolderName('');
      setShowNewFolder(false);
    } catch {
      // handled in provider
    } finally {
      setCreating(false);
    }
  };

  const handleFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setShowNewFolder(false);
      setFolderName('');
    }
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    setUploadItems([]);
  };

  return (
    <div className={styles.toolbar}>
      {showCreateFolder && (
        <button className={styles.toolbarBtn} onClick={() => setShowNewFolder(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 6h-2V4h-2v2H8v2h2v2h2V8h2V6z" opacity="0.9" />
            <path d="M1 2h5l2 2h6v2h-1V5H7.5L5.5 3H2v10h6v1H1V2z" />
          </svg>
          New Folder
        </button>
      )}
      {showUploadBtn && (
        <>
          <div style={{ position: 'relative' }}>
            <button
              className={styles.toolbarBtn}
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              disabled={isUploading}
            >
              {isUploading ? (
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
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {showUploadMenu && (
              <div className={styles.uploadMenu}>
                <button className={styles.uploadMenuItem} onClick={handleFileUploadClick}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1L4 5.5h2.5V10h3V5.5H12L8 1z" />
                    <path d="M2 12v2h12v-2H2z" />
                  </svg>
                  Upload Files
                </button>
                <button className={styles.uploadMenuItem} onClick={handleFolderUploadClick}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 2h5l2 2h6v2h-1V5H7.5L5.5 3H2v10h6v1H1V2z" />
                  </svg>
                  Upload Folder
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFolderChange}
            {...({ webkitdirectory: '' } as any)}
          />
        </>
      )}

      {/* View mode toggle */}
      {allowGridView && (
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3h14v2H1zm0 4h14v2H1zm0 4h14v2H1z" />
            </svg>
          </button>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z" />
            </svg>
          </button>
        </div>
      )}

      <button
        className={styles.toolbarBtn}
        onClick={refresh}
        disabled={isLoading}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={isLoading ? styles.spinning : ''}
        >
          <path d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 .01 3.58.01 8S3.58 16 8 16c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 018 14 6 6 0 012 8a6 6 0 016-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" />
        </svg>
        {isLoading ? '' : 'Refresh'}
      </button>

      {/* New folder inline dialog */}
      {showNewFolder && (
        <div className={styles.newFolderPopover}>
          <div className={styles.newFolderContent}>
            <span className={styles.newFolderLabel}>New Folder</span>
            <input
              className={styles.newFolderInput}
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleFolderKeyDown}
              autoFocus
              disabled={creating}
            />
            <div className={styles.newFolderActions}>
              <button
                className={styles.newFolderCancel}
                onClick={() => {
                  setShowNewFolder(false);
                  setFolderName('');
                }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className={styles.newFolderCreate}
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress modal */}
      {showProgress && (
        <UploadProgressModal items={uploadItems} onClose={handleCloseProgress} />
      )}
    </div>
  );
}
