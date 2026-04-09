import { useEffect, useRef, useState } from 'react';
import type { BoxNode } from '../types';
import { FileIcon } from './FileIcon';
import styles from '../styles/explorer.module.css';

interface PreviewModalProps {
  file: BoxNode;
  accessToken: string;
  canDownload?: boolean;
  fullScreen?: boolean;
  onClose: () => void;
}

export function PreviewModal({ file, accessToken, canDownload = true, fullScreen = false, onClose }: PreviewModalProps) {
  const handleDownload = () => {
    // Box API download endpoint — triggers a redirect to a download URL
    const url = `https://api.box.com/2.0/files/${file.id}/content`;
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);

    // Use fetch to get the download URL with auth, then open it
    fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'follow',
    })
      .then((res) => {
        if (res.ok) {
          return res.blob();
        }
        throw new Error('Download failed');
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => console.error('Download error:', err));
  };

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div
        className={styles.previewModal}
        onClick={(e) => e.stopPropagation()}
        style={fullScreen ? { width: '100vw', height: '100vh', maxWidth: '100vw', borderRadius: 0 } : undefined}
      >
        <div className={styles.previewHeader}>
          <div className={styles.previewHeaderInfo}>
            <FileIcon item={file} size={24} />
            <span className={styles.previewFileName}>{file.name}</span>
          </div>
          <div className={styles.previewHeaderActions}>
            {canDownload && (
              <button
                className={styles.previewDownloadBtn}
                onClick={handleDownload}
                title="Download"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1v9.5M8 10.5L4.5 7M8 10.5L11.5 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download
              </button>
            )}
            <button className={styles.previewCloseBtn} onClick={onClose} title="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.3 4.3L8.6 8l3.7 3.7-1 1L7.6 9l-3.7 3.7-1-1L6.6 8 2.9 4.3l1-1L7.6 7l3.7-3.7z" />
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.previewContainer}>
          <BoxPreviewEmbed fileId={file.id} accessToken={accessToken} />
        </div>
      </div>
    </div>
  );
}

/** Loads Box Content Preview via the CDN SDK and renders into a container */
function BoxPreviewEmbed({
  fileId,
  accessToken,
}: {
  fileId: string;
  accessToken: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const previewInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadBoxPreviewSDK();
        if (cancelled || !containerRef.current) return;

        const BoxPreview = (window as any).Box?.Preview;
        if (!BoxPreview) {
          setStatus('error');
          return;
        }

        if (previewInstance.current) {
          try { previewInstance.current.hide(); } catch {}
        }

        const preview = new BoxPreview();
        preview.show(fileId, accessToken, {
          container: containerRef.current,
          showDownload: true,
          showPrint: true,
          header: 'none',
        });
        previewInstance.current = preview;

        preview.addListener('load', () => {
          if (!cancelled) setStatus('ready');
        });
        preview.addListener('error', () => {
          if (!cancelled) setStatus('error');
        });

        setTimeout(() => {
          if (!cancelled && status === 'loading') setStatus('ready');
        }, 2000);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => {
      cancelled = true;
      if (previewInstance.current) {
        try { previewInstance.current.hide(); } catch {}
        previewInstance.current = null;
      }
    };
  }, [fileId, accessToken]);

  return (
    <>
      {status === 'loading' && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading preview...</span>
        </div>
      )}
      {status === 'error' && (
        <div className={styles.loadingState}>
          <svg width="32" height="32" viewBox="0 0 16 16" fill="#d32f2f">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 6h1v1h-1v-1z" />
          </svg>
          <span style={{ color: '#d32f2f' }}>
            Failed to load preview. Check that the access token has preview permissions.
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className={styles.previewContent}
        style={{ display: status === 'loading' ? 'none' : 'block' }}
      />
    </>
  );
}

/* ---- SDK loader (singleton) ---- */

// Use the standalone box-content-preview library (exposes Box.Preview)
// NOT the UI Elements bundle (platform/elements/) which uses a different API
const SDK_VERSION = '3.25.0';
const CSS_URL = `https://cdn01.boxcdn.net/platform/preview/${SDK_VERSION}/en-US/preview.css`;
const JS_URL = `https://cdn01.boxcdn.net/platform/preview/${SDK_VERSION}/en-US/preview.js`;

let sdkPromise: Promise<void> | null = null;

function loadBoxPreviewSDK(): Promise<void> {
  if ((window as any).Box?.Preview) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = JS_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Failed to load Box Preview SDK'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}
