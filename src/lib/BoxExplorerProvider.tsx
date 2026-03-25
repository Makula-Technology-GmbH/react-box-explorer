import { createContext, useContext, useMemo, useState } from 'react';
import type { BoxExplorerContextValue, BoxExplorerProps, BoxNode } from './types';
import { useExplorer } from './hooks/useExplorer';

const BoxExplorerContext = createContext<BoxExplorerContextValue | null>(null);

export function useBoxExplorer() {
  const ctx = useContext(BoxExplorerContext);
  if (!ctx) {
    throw new Error('useBoxExplorer must be used within BoxExplorerProvider');
  }
  return ctx;
}

interface ProviderProps extends Pick<
  BoxExplorerProps,
  'folders' | 'onError' | 'onActionComplete' | 'readOnly' | 'entityName'
> {
  children: React.ReactNode;
}

export function BoxExplorerProvider({
  folders,
  onError,
  onActionComplete,
  entityName = 'All Files',
  readOnly = false,
  children,
}: ProviderProps) {
  const explorer = useExplorer(folders, onError);
  const [previewingFile, setPreviewingFile] = useState<BoxNode | null>(null);

  const renameItem = async (item: BoxNode, newName: string) => {
    await explorer.renameItem(item, newName);
    onActionComplete?.('rename', { ...item, name: newName });
  };

  const deleteItem = async (item: BoxNode) => {
    await explorer.deleteItem(item);
    onActionComplete?.('delete', item);
  };

  const uploadFiles = async (files: File[]) => {
    await explorer.uploadFiles(files);
    for (const file of files) {
      onActionComplete?.('upload', {
        id: '',
        name: file.name,
        type: 'file',
      });
    }
  };

  const createFolder = async (name: string) => {
    await explorer.createFolder(name);
  };

  const value = useMemo<BoxExplorerContextValue>(
    () => ({
      folders,
      navigation: explorer.navigation,
      items: explorer.items,
      isLoading: explorer.isLoading,
      error: explorer.error,
      openFolder: explorer.openFolder,
      navigateTo: explorer.navigateTo,
      goHome: explorer.goHome,
      enterRoot: explorer.enterRoot,
      getToken: explorer.getToken,
      getTokenForItem: explorer.getTokenForItem,
      getPermissionsForItem: explorer.getPermissionsForItem,
      canUpload: explorer.navigation
        ? explorer.getPermissionsForItem(explorer.navigation.currentFolderId).canUpload
        : folders.some((f) => f.canUpload !== false),
      canCreateFolder: explorer.navigation
        ? explorer.getPermissionsForItem(explorer.navigation.currentFolderId).canCreateFolder
        : folders.some((f) => f.canCreateFolder !== false),
      renameItem,
      deleteItem,
      uploadFiles,
      createFolder,
      previewFile: (file: BoxNode) => setPreviewingFile(file),
      previewingFile,
      closePreview: () => setPreviewingFile(null),
      entityName,
      readOnly,
      refresh: explorer.refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      folders,
      explorer.navigation,
      explorer.items,
      explorer.isLoading,
      explorer.error,
      previewingFile,
      entityName,
      readOnly,
    ],
  );

  return (
    <BoxExplorerContext.Provider value={value}>
      {children}
    </BoxExplorerContext.Provider>
  );
}
