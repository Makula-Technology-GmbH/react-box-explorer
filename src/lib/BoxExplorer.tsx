import type { BoxExplorerProps } from './types';
import { BoxExplorerProvider, useBoxExplorer } from './BoxExplorerProvider';
import { Breadcrumbs } from './components/Breadcrumbs';
import { Toolbar } from './components/Toolbar';
import { FileList } from './components/FileList';
import { PreviewModal } from './components/PreviewModal';
import styles from './styles/explorer.module.css';

function ExplorerInner({
  height,
  className,
  style,
}: Pick<BoxExplorerProps, 'height' | 'className' | 'style'>) {
  const {
    previewingFile,
    closePreview,
    getTokenForItem,
    getPermissionsForItem,
    error,
    isLoading,
  } = useBoxExplorer();

  const previewToken = previewingFile
    ? getTokenForItem(previewingFile.id)
    : null;

  const previewCanDownload = previewingFile
    ? getPermissionsForItem(previewingFile.id).canDownload
    : false;

  return (
    <div
      className={`${styles.explorer} ${className ?? ''}`}
      style={{ height, ...style }}
    >
      {error && (
        <div className={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1V4zm0 6h1v1h-1v-1z" />
          </svg>
          {error.message}
        </div>
      )}

      <div className={styles.headerBar}>
        <Breadcrumbs />
        <Toolbar />
      </div>
      {isLoading && (
        <div className={styles.barLoader}>
          <div className={styles.barLoaderFill} />
        </div>
      )}
      <FileList />

      {previewingFile && previewToken && (
        <PreviewModal
          file={previewingFile}
          accessToken={previewToken}
          canDownload={previewCanDownload}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

export function BoxExplorer({
  folders,
  entityName,
  height = 500,
  onError,
  onFilePreview,
  onActionComplete,
  readOnly,
  className,
  style,
}: BoxExplorerProps) {
  return (
    <BoxExplorerProvider
      folders={folders}
      onError={onError}
      onActionComplete={onActionComplete}
      entityName={entityName}
      readOnly={readOnly}
    >
      <ExplorerInner height={height} className={className} style={style} />
    </BoxExplorerProvider>
  );
}
