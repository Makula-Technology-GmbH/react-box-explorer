import styles from '../styles/explorer.module.css';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadProgressModalProps {
  items: UploadItem[];
  onClose: () => void;
}

export function UploadProgressModal({ items, onClose }: UploadProgressModalProps) {
  const isComplete = items.every((item) => item.status !== 'uploading');
  const successCount = items.filter((item) => item.status === 'completed').length;
  const errorCount = items.filter((item) => item.status === 'error').length;

  return (
    <div className={styles.modalOverlay} onClick={isComplete ? onClose : undefined}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          {isComplete ? 'Upload Complete' : 'Uploading Files'}
        </div>

        <div className={styles.uploadProgressList}>
          {items.map((item) => (
            <div key={item.id} className={styles.uploadProgressItem}>
              <div className={styles.uploadItemInfo}>
                <span className={styles.uploadItemName}>{item.name}</span>
                <span className={styles.uploadItemStatus}>
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'completed' && '✓ Done'}
                  {item.status === 'error' && `✗ ${item.error || 'Failed'}`}
                </span>
              </div>
              <div className={styles.uploadProgressBar}>
                <div
                  className={`${styles.uploadProgressFill} ${styles[item.status]}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {isComplete && (
          <div className={styles.uploadSummary}>
            <span>
              {successCount} succeeded{errorCount > 0 ? `, ${errorCount} failed` : ''}
            </span>
          </div>
        )}

        {isComplete && (
          <div className={styles.modalActions}>
            <button className={styles.modalConfirmBtn} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
