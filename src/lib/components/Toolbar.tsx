import { useRef, useState } from 'react';
import { useBoxExplorer } from '../BoxExplorerProvider';
import styles from '../styles/explorer.module.css';

export function Toolbar() {
  const {
    uploadFiles,
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const showUpload = !readOnly && canUpload;
  const showCreateFolder = !readOnly && canCreate;

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 10);
    setUploading(true);
    try {
      await uploadFiles(files);
    } catch {
      // handled in provider
    } finally {
      setUploading(false);
    }
    if (fileRef.current) fileRef.current.value = '';
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
      {showUpload && (
        <>
          <button
            className={styles.toolbarBtn}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
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
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}
      {/* View mode toggle */}
      {allowGridView && <div className={styles.viewToggle}>
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
      </div>}

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
    </div>
  );
}
