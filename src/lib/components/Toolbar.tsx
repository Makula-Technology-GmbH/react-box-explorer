import { useState } from 'react';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { UploadFilesModal, type UploadItem } from './UploadFilesModal';
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

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const showUploadBtn = !readOnly && canUpload;
  const showCreateFolder = !readOnly && canCreate;
  const isUploading = uploadItems.some((item) => item.status === 'uploading');

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const updateItemById = (id: string, patch: Partial<UploadItem>) => {
    setUploadItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleModalUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Separate files (no path) from folder files (have webkitRelativePath).
    const regularFiles: File[] = [];
    const folderFiles: File[] = [];
    for (const file of files) {
      if ((file as any).webkitRelativePath) folderFiles.push(file);
      else regularFiles.push(file);
    }

    // Build items in upload order so progress indexes line up with item indexes.
    const orderedFiles = [...folderFiles, ...regularFiles];
    const items: UploadItem[] = orderedFiles.map((file, index) => ({
      id: `${file.name}-${index}-${Date.now()}`,
      name: (file as any).webkitRelativePath || file.name,
      progress: 0,
      status: 'uploading',
      file,
    }));
    setUploadItems(items);

    const folderItemIds = items.slice(0, folderFiles.length).map((i) => i.id);
    const fileItemIds = items.slice(folderFiles.length).map((i) => i.id);

    const onProgress = (ids: string[]) => (fileIndex: number, progress: number) => {
      const id = ids[fileIndex];
      if (id) updateItemById(id, { progress });
    };
    const onFileError = (ids: string[]) => (fileIndex: number, err: Error) => {
      const id = ids[fileIndex];
      if (id) updateItemById(id, { status: 'error', error: err.message });
    };

    if (folderFiles.length > 0) {
      await uploadFolders(folderFiles, onProgress(folderItemIds), onFileError(folderItemIds));
    }
    if (regularFiles.length > 0) {
      await uploadFiles(regularFiles, onProgress(fileItemIds), onFileError(fileItemIds));
    }

    // Anything still 'uploading' didn't error → mark completed.
    setUploadItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading'
          ? { ...item, status: 'completed', progress: 100 }
          : item,
      ),
    );
    refresh();
  };

  const handleRetry = async (item: UploadItem) => {
    if (!item.file) return;

    updateItemById(item.id, { status: 'uploading', progress: 0, error: undefined });

    const onProgress = (_idx: number, progress: number) =>
      updateItemById(item.id, { progress });
    const onFileError = (_idx: number, err: Error) =>
      updateItemById(item.id, { status: 'error', error: err.message });

    const isFolderFile = !!(item.file as any).webkitRelativePath;
    if (isFolderFile) {
      await uploadFolders([item.file], onProgress, onFileError);
    } else {
      await uploadFiles([item.file], onProgress, onFileError);
    }

    setUploadItems((prev) =>
      prev.map((i) =>
        i.id === item.id && i.status === 'uploading'
          ? { ...i, status: 'completed', progress: 100 }
          : i,
      ),
    );
    refresh();
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

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
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
        <button
          className={styles.toolbarBtn}
          onClick={handleUploadClick}
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

      {/* Combined upload modal with progress */}
      {showUploadModal && (
        <UploadFilesModal
          onUpload={handleModalUpload}
          onClose={handleCloseUploadModal}
          isUploading={isUploading}
          uploadItems={uploadItems}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
