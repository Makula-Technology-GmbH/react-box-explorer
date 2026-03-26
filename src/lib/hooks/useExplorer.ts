import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  FolderConfig,
  BoxNode,
  BoxItem,
  NavigationState,
  BreadcrumbEntry,
  ItemPermissions,
} from '../types';
import * as boxClient from '../api/boxClient';

function boxItemToNode(item: BoxItem): BoxNode {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    modifiedAt: item.modified_at,
    modifiedBy: item.modified_by?.name,
    extension: item.extension,
  };
}

function sortNodes(nodes: BoxNode[]): BoxNode[] {
  return nodes.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

export function useExplorer(
  folders: FolderConfig[],
  onError?: (error: Error) => void,
) {
  const [navigation, setNavigation] = useState<NavigationState | null>(null);
  const [items, setItems] = useState<BoxNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Map item IDs to their root folder config, so we know which token to use
  // when navigating into subfolders
  const itemTokenMapRef = useRef<Map<string, FolderConfig>>(new Map());

  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  const loadFolderContents = useCallback(
    async (token: string, folderId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const entries = await boxClient.listAllFolderItems(token, folderId);
        if (!controller.signal.aborted) {
          const nodes = sortNodes(entries.map(boxItemToNode));
          // Map all child items to the same token config
          const config = itemTokenMapRef.current.get(folderId);
          if (config) {
            for (const node of nodes) {
              itemTokenMapRef.current.set(node.id, config);
            }
          }
          setItems(nodes);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          handleError(err as Error);
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [handleError],
  );

  // Load all folders' contents merged on mount
  const loadAllRoots = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setNavigation(null);

    try {
      const allNodes: BoxNode[] = [];
      for (const config of folders) {
        const entries = await boxClient.listAllFolderItems(config.token, config.folderId);
        if (controller.signal.aborted) return;
        const nodes = entries.map(boxItemToNode);
        // Map each item to its root config for token lookup
        for (const node of nodes) {
          itemTokenMapRef.current.set(node.id, config);
        }
        // Also map the root folder itself
        itemTokenMapRef.current.set(config.folderId, config);
        allNodes.push(...nodes);
      }
      if (!controller.signal.aborted) {
        setItems(sortNodes(allNodes));
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        handleError(err as Error);
        setItems([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [folders, handleError]);

  // Auto-load all folder contents on mount
  useEffect(() => {
    if (folders.length > 0) {
      loadAllRoots();
    }
  }, [loadAllRoots]);

  const enterRoot = useCallback(
    async (config: FolderConfig) => {
      const folder = await boxClient
        .getFolder(config.token, config.folderId)
        .catch(() => ({ id: config.folderId, name: config.label || 'Root', type: 'folder' as const }));

      const rootBreadcrumb: BreadcrumbEntry = {
        id: folder.id,
        name: config.label || folder.name,
      };

      setNavigation({
        rootConfig: config,
        currentFolderId: config.folderId,
        breadcrumbs: [rootBreadcrumb],
      });

      loadFolderContents(config.token, config.folderId);
    },
    [loadFolderContents],
  );

  const openFolder = useCallback(
    (folderId: string, folderName: string) => {
      // Look up which token config owns this folder
      const config = itemTokenMapRef.current.get(folderId);
      if (!config) return;

      // Map the folder itself so its children inherit the token
      itemTokenMapRef.current.set(folderId, config);

      setNavigation((prev) => {
        if (!prev) {
          // Navigating from root (all-folders) view into a subfolder
          return {
            rootConfig: config,
            currentFolderId: folderId,
            breadcrumbs: [
              { id: 'root', name: 'All Files' },
              { id: folderId, name: folderName },
            ],
          };
        }
        return {
          ...prev,
          rootConfig: config,
          currentFolderId: folderId,
          breadcrumbs: [...prev.breadcrumbs, { id: folderId, name: folderName }],
        };
      });

      loadFolderContents(config.token, folderId);
    },
    [loadFolderContents],
  );

  const navigateTo = useCallback(
    (breadcrumbIndex: number) => {
      setNavigation((prev) => {
        if (!prev) return prev;
        const crumb = prev.breadcrumbs[breadcrumbIndex];
        if (!crumb) return prev;

        // If navigating back to "All Files" root
        if (crumb.id === 'root') {
          // Will trigger loadAllRoots via goHome
          return null;
        }

        return {
          ...prev,
          currentFolderId: crumb.id,
          breadcrumbs: prev.breadcrumbs.slice(0, breadcrumbIndex + 1),
        };
      });

      // Check if going back to root
      const nav = navigation;
      if (nav) {
        const crumb = nav.breadcrumbs[breadcrumbIndex];
        if (crumb && crumb.id === 'root') {
          loadAllRoots();
          return;
        }
        if (crumb) {
          const config = itemTokenMapRef.current.get(crumb.id) || nav.rootConfig;
          loadFolderContents(config.token, crumb.id);
        }
      }
    },
    [navigation, loadFolderContents, loadAllRoots],
  );

  const goHome = useCallback(() => {
    setNavigation(null);
    loadAllRoots();
  }, [loadAllRoots]);

  const getToken = useCallback(() => {
    return navigation?.rootConfig.token ?? folders[0]?.token ?? null;
  }, [navigation, folders]);

  // Get the token for a specific item
  const getTokenForItem = useCallback(
    (itemId: string) => {
      const config = itemTokenMapRef.current.get(itemId);
      return config?.token ?? navigation?.rootConfig.token ?? folders[0]?.token ?? null;
    },
    [navigation, folders],
  );

  const getPermissionsForItem = useCallback(
    (itemId: string): ItemPermissions => {
      const config = itemTokenMapRef.current.get(itemId);
      return {
        canUpload: config?.canUpload ?? true,
        canCreateFolder: config?.canCreateFolder ?? true,
        canPreview: config?.canPreview ?? true,
        canDownload: config?.canDownload ?? true,
        canRename: config?.canRename ?? true,
        canDelete: config?.canDelete ?? true,
      };
    },
    [],
  );

  const refresh = useCallback(() => {
    if (navigation?.rootConfig) {
      loadFolderContents(navigation.rootConfig.token, navigation.currentFolderId);
    } else {
      loadAllRoots();
    }
  }, [navigation, loadFolderContents, loadAllRoots]);

  const renameItem = useCallback(
    async (item: BoxNode, newName: string) => {
      const token = getTokenForItem(item.id);
      if (!token) return;
      try {
        if (item.type === 'file') {
          await boxClient.renameFile(token, item.id, newName);
        } else {
          await boxClient.renameFolder(token, item.id, newName);
        }
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, name: newName } : i)),
        );
      } catch (err) {
        handleError(err as Error);
        throw err;
      }
    },
    [getTokenForItem, handleError],
  );

  const deleteItem = useCallback(
    async (item: BoxNode) => {
      const token = getTokenForItem(item.id);
      if (!token) return;
      try {
        if (item.type === 'file') {
          await boxClient.deleteFile(token, item.id);
        } else {
          await boxClient.deleteFolder(token, item.id);
        }
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err) {
        handleError(err as Error);
        throw err;
      }
    },
    [getTokenForItem, handleError],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      let folderId: string | undefined;
      let token: string | null = null;
      if (navigation) {
        folderId = navigation.currentFolderId;
        token = getTokenForItem(folderId);
      } else {
        const uploadFolder = folders.find((f) => f.canUpload !== false);
        if (uploadFolder) {
          folderId = uploadFolder.folderId;
          token = uploadFolder.token;
        }
      }
      if (!token || !folderId) return;
      try {
        for (const file of files) {
          await boxClient.uploadFile(token, folderId, file);
        }
        if (navigation) {
          await loadFolderContents(token, folderId);
        } else {
          await loadAllRoots();
        }
      } catch (err) {
        handleError(err as Error);
        throw err;
      }
    },
    [navigation, getTokenForItem, folders, loadFolderContents, loadAllRoots, handleError],
  );

  const createFolder = useCallback(
    async (name: string) => {
      let folderId: string | undefined;
      let token: string | null = null;
      if (navigation) {
        folderId = navigation.currentFolderId;
        token = getTokenForItem(folderId);
      } else {
        const createFolderConfig = folders.find((f) => f.canCreateFolder !== false);
        if (createFolderConfig) {
          folderId = createFolderConfig.folderId;
          token = createFolderConfig.token;
        }
      }
      if (!token || !folderId) return;
      try {
        const newFolder = await boxClient.createFolder(token, folderId, name);
        // Map the new folder to the same token config
        const config = itemTokenMapRef.current.get(folderId);
        if (config) {
          itemTokenMapRef.current.set(newFolder.id, config);
        }
        // Add to items list at the top (folders first)
        const newNode: BoxNode = {
          id: newFolder.id,
          name: newFolder.name,
          type: 'folder',
        };
        setItems((prev) => {
          const folders = prev.filter((i) => i.type === 'folder');
          const files = prev.filter((i) => i.type !== 'folder');
          return [...folders, newNode, ...files].sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
          });
        });
      } catch (err) {
        handleError(err as Error);
        throw err;
      }
    },
    [navigation, getTokenForItem, folders, handleError],
  );

  return {
    navigation,
    items,
    isLoading,
    error,
    enterRoot,
    openFolder,
    navigateTo,
    goHome,
    getToken,
    getTokenForItem,
    getPermissionsForItem,
    renameItem,
    deleteItem,
    uploadFiles,
    createFolder,
    refresh,
  };
}
