import { useCallback } from 'react';
import type { BoxNode } from '../types';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { FileIcon } from './FileIcon';
import styles from '../styles/explorer.module.css';

function formatSize(bytes?: number): string {
  if (bytes == null) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface FileListItemProps {
  item: BoxNode;
  onShowMenu: (e: React.MouseEvent, item: BoxNode) => void;
}

export function FileListItem({ item, onShowMenu }: FileListItemProps) {
  const { openFolder, previewFile, getPermissionsForItem } = useBoxExplorer();

  const handleClick = useCallback(() => {
    if (item.type === 'folder') {
      openFolder(item.id, item.name);
    } else if (item.type === 'file') {
      const perms = getPermissionsForItem(item.id);
      if (perms.canPreview) {
        previewFile(item);
      }
    }
  }, [item, openFolder, previewFile, getPermissionsForItem]);

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowMenu(e, item);
  };

  return (
    <div
      className={styles.fileListItem}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onShowMenu(e, item);
      }}
      data-type={item.type}
    >
      <div className={styles.fileListItemName}>
        <FileIcon item={item} size={20} className={styles.itemIcon} />
        <span className={styles.fileName}>{item.name}</span>
      </div>
      <div className={styles.fileListItemMeta}>
        <span className={styles.fileDate}>{formatDate(item.modifiedAt)}</span>
        <span className={styles.fileSize}>
          {item.type === 'file' ? formatSize(item.size) : '--'}
        </span>
        <button
          className={styles.actionDotsBtn}
          onClick={handleDotsClick}
          title="Actions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
