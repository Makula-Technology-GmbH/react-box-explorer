import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { BoxNode } from '../types';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { FileListItem } from './FileListItem';
import { GridItem } from './GridItem';
import { ConfirmModal } from './ConfirmModal';
import { RenameModal } from './RenameModal';
import styles from '../styles/explorer.module.css';

export function FileList() {
  const {
    items,
    isLoading,
    deleteItem,
    renameItem,
    previewFile,
    readOnly,
    getTokenForItem,
    getPermissionsForItem,
    viewMode,
  } = useBoxExplorer();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: BoxNode;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState<BoxNode | null>(null);
  const [renamingItem, setRenamingItem] = useState<BoxNode | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleShowMenu = useCallback(
    (e: React.MouseEvent, item: BoxNode) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, item });
    },
    [],
  );

  // Reposition menu: always open to the left, and clamp vertically
  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const x = contextMenu.x - rect.width;
    let y = contextMenu.y;
    if (y + rect.height > window.innerHeight) {
      y = Math.max(0, window.innerHeight - rect.height - 8);
    }
    menu.style.left = `${Math.max(0, x)}px`;
    menu.style.top = `${y}px`;
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  const handlePreview = () => {
    if (!contextMenu) return;
    previewFile(contextMenu.item);
    setContextMenu(null);
  };

  const handleRenameClick = () => {
    if (!contextMenu) return;
    setRenamingItem(contextMenu.item);
    setContextMenu(null);
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!renamingItem) return;
    setActionLoading(true);
    try {
      await renameItem(renamingItem, newName);
      setRenamingItem(null);
    } catch {
      // handled in provider
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!contextMenu) return;
    setDeletingItem(contextMenu.item);
    setContextMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setActionLoading(true);
    try {
      await deleteItem(deletingItem);
      setDeletingItem(null);
    } catch {
      // handled in provider
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    if (!contextMenu) return;
    const item = contextMenu.item;
    if (item.type !== 'file') return;
    const token = getTokenForItem(item.id);
    if (!token) return;
    setContextMenu(null);

    fetch(`https://api.box.com/2.0/files/${item.id}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Download error:', err));
  };

  if (isLoading && items.length === 0) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
          <path d="M6 8h14l4 4H42v28H6z" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p>This folder is empty</p>
      </div>
    );
  }

  return (
    <div className={styles.fileList}>
      {viewMode === 'list' ? (
        <>
          <div className={styles.fileListHeader}>
            <span className={styles.headerName}>Name</span>
            <span className={styles.headerDate}>Modified</span>
            <span className={styles.headerSize}>Size</span>
            <span className={styles.headerActions} />
          </div>
          {items.map((item) => (
            <FileListItem key={item.id} item={item} onShowMenu={handleShowMenu} />
          ))}
        </>
      ) : (
        <div className={styles.gridView}>
          {items.map((item) => (
            <GridItem key={item.id} item={item} onShowMenu={handleShowMenu} />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (() => {
        const perms = getPermissionsForItem(contextMenu.item.id);
        const isFile = contextMenu.item.type === 'file';
        const showPreview = isFile && perms.canPreview;
        const showDownload = isFile && perms.canDownload;
        const showDelete = !readOnly && perms.canDelete;
        const showRename = !readOnly && perms.canRename;
        const showFileDivider = (showPreview || showDownload) && (showRename || showDelete);
        const showDeleteDivider = showRename && showDelete;

        return (
          <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {showPreview && (
              <button className={styles.contextMenuItem} onClick={handlePreview}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3C3 3 0.5 8 0.5 8s2.5 5 7.5 5 7.5-5 7.5-5S13 3 8 3zm0 8.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-5.5a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Preview
              </button>
            )}
            {showDownload && (
              <button className={styles.contextMenuItem} onClick={handleDownload}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1v8.5M8 9.5L4.5 6M8 9.5L11.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                Download
              </button>
            )}
            {showFileDivider && <div className={styles.contextMenuDivider} />}
            {showRename && (
              <button className={styles.contextMenuItem} onClick={handleRenameClick}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.15 1.85a2 2 0 00-2.83 0L2 9.17V13h3.83l7.32-7.32a2 2 0 000-2.83zM5.17 12H3v-2.17l6.32-6.32 2.17 2.17L5.17 12z" />
                </svg>
                Rename
              </button>
            )}
            {showDeleteDivider && <div className={styles.contextMenuDivider} />}
            {showDelete && (
              <button
                className={`${styles.contextMenuItem} ${styles.contextMenuDanger}`}
                onClick={handleDeleteClick}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 0.5v1h-4v2h13v-2h-4v-1h-5zM2.5 5l1 10h9l1-10h-11zm3.5 1.5h1v7h-1v-7zm3 0h1v7h-1v-7z" />
                </svg>
                Delete
              </button>
            )}
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {deletingItem && (
        <ConfirmModal
          title={`Delete ${deletingItem.type === 'folder' ? 'Folder' : 'File'}`}
          message={`Are you sure you want to delete "${deletingItem.name}"? ${deletingItem.type === 'folder' ? 'All contents inside this folder will also be deleted.' : 'This action cannot be undone.'}`}
          confirmLabel="Delete"
          danger
          loading={actionLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingItem(null)}
        />
      )}

      {/* Rename modal */}
      {renamingItem && (
        <RenameModal
          currentName={renamingItem.name}
          itemType={renamingItem.type}
          loading={actionLoading}
          onSubmit={handleRenameSubmit}
          onCancel={() => setRenamingItem(null)}
        />
      )}
    </div>
  );
}
