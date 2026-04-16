import { useCallback, useEffect, useState } from 'react';
import type { BoxNode } from '../types';
import { useBoxExplorer } from '../BoxExplorerProvider';
import { FileIcon } from './FileIcon';
import styles from '../styles/explorer.module.css';

interface GridItemProps {
  item: BoxNode;
  onShowMenu: (e: React.MouseEvent, item: BoxNode) => void;
}

export function GridItem({ item, onShowMenu }: GridItemProps) {
  const { openFolder, previewFile, getPermissionsForItem, getTokenForItem, readOnly } =
    useBoxExplorer();

  const perms = getPermissionsForItem(item.id);
  const isFile = item.type === 'file';
  const hasAnyAction = isFile
    ? perms.canPreview || perms.canDownload || (!readOnly && perms.canRename) || (!readOnly && perms.canDelete)
    : (!readOnly && perms.canRename) || (!readOnly && perms.canDelete);

  const handleClick = useCallback(() => {
    if (item.type === 'folder') {
      openFolder(item.id, item.name);
    } else if (item.type === 'file' && perms.canPreview) {
      previewFile(item);
    }
  }, [item, openFolder, previewFile, perms.canPreview]);

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowMenu(e, item);
  };

  return (
    <div className={styles.gridItem} onClick={handleClick} data-type={item.type}>
      <div className={styles.gridThumbnail}>
        {isFile ? (
          <FileThumbnail fileId={item.id} token={getTokenForItem(item.id)} item={item} />
        ) : (
          <div className={styles.gridFolderIcon}>
            <FileIcon item={item} size={48} />
          </div>
        )}
      </div>
      <div className={styles.gridItemFooter}>
        <span className={styles.gridItemName} title={item.name}>
          {item.name}
        </span>
        {hasAnyAction ? (
          <button
            className={styles.gridDotsBtn}
            onClick={handleDotsClick}
            title="Actions"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        ) : (
          <span className={styles.gridDotsBtn} style={{ visibility: 'hidden' }} />
        )}
      </div>
    </div>
  );
}

function FileThumbnail({
  fileId,
  token,
  item,
}: {
  fileId: string;
  token: string | null;
  item: BoxNode;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) { setFailed(true); return; }

    let cancelled = false;

    async function fetchRepresentation(retries = 4, delayMs = 2000): Promise<void> {
      const res = await fetch(
        `https://api.box.com/2.0/files/${fileId}?fields=representations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-rep-hints': '[jpg?dimensions=1024x1024]',
          },
        },
      );
      if (!res.ok) throw new Error('request failed');
      const data = await res.json();
      if (cancelled) return;

      const entry = data?.representations?.entries?.[0];
      if (!entry) throw new Error('no entry');

      const state: string = entry.status?.state ?? 'none';

      if (state === 'success') {
        const urlTemplate: string = entry.content?.url_template ?? '';
        if (!urlTemplate) throw new Error('no url_template');
        const contentUrl = urlTemplate.replace('{+asset_path}', '') + `?access_token=${encodeURIComponent(token!)}`;
        setSrc(contentUrl);
        return;
      }

      if (state === 'error') throw new Error('representation error');

      // state is 'none' or 'pending' — trigger generation by hitting info.url, then retry
      if (state === 'none' && entry.info?.url) {
        await fetch(entry.info.url, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      if (retries <= 0) throw new Error('timed out waiting for representation');

      await new Promise((r) => setTimeout(r, delayMs));
      if (!cancelled) return fetchRepresentation(retries - 1, delayMs);
    }

    fetchRepresentation().catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => { cancelled = true; };
  }, [fileId, token]);

  if (failed) {
    return (
      <div className={styles.gridFileIcon}>
        <FileIcon item={item} size={40} />
      </div>
    );
  }

  if (!src) {
    return (
      <div className={styles.gridFileIcon}>
        <div className={styles.gridThumbSkeleton} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={item.name}
      className={styles.gridThumbImg}
      onError={() => setFailed(true)}
    />
  );
}
