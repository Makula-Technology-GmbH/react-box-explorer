import { useState, useEffect, useRef, useMemo } from 'react';
import styles from '../styles/explorer.module.css';

interface RenameModalProps {
  currentName: string;
  itemType: 'file' | 'folder' | 'web_link';
  loading?: boolean;
  onSubmit: (newName: string) => void;
  onCancel: () => void;
}

export function RenameModal({
  currentName,
  itemType,
  loading = false,
  onSubmit,
  onCancel,
}: RenameModalProps) {
  const { baseName, extension } = useMemo(() => {
    const dotIndex = currentName.lastIndexOf('.');
    if (itemType === 'file' && dotIndex > 0) {
      return {
        baseName: currentName.slice(0, dotIndex),
        extension: currentName.slice(dotIndex),
      };
    }
    return { baseName: currentName, extension: '' };
  }, [currentName, itemType]);

  const [value, setValue] = useState(baseName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const fullName = trimmed + extension;
    if (fullName !== currentName) {
      onSubmit(fullName);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          Rename {itemType === 'folder' ? 'Folder' : 'File'}
        </div>
        <div className={styles.renameInputRow}>
          <input
            ref={inputRef}
            className={styles.modalInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Enter new name"
          />
          {extension && (
            <span className={styles.renameExtension}>{extension}</span>
          )}
        </div>
        <div className={styles.modalActions}>
          <button
            className={styles.modalCancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.modalConfirmBtn}
            onClick={handleSubmit}
            disabled={!value.trim() || (value.trim() + extension) === currentName || loading}
          >
            {loading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );
}
