/** A root folder entry with its own Box access token */
export interface FolderConfig {
  folderId: string;
  token: string;
  label?: string;
  canUpload?: boolean;
  canCreateFolder?: boolean;
  canPreview?: boolean;
  canDownload?: boolean;
  canRename?: boolean;
  canDelete?: boolean;
}

/** Resolved permissions for an item based on its parent folder config */
export interface ItemPermissions {
  canUpload: boolean;
  canCreateFolder: boolean;
  canPreview: boolean;
  canDownload: boolean;
  canRename: boolean;
  canDelete: boolean;
}

/** An item in the current folder view */
export interface BoxNode {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'web_link';
  size?: number;
  modifiedAt?: string;
  modifiedBy?: string;
  extension?: string;
}

/** A breadcrumb entry for folder navigation */
export interface BreadcrumbEntry {
  id: string;
  name: string;
}

/** Navigation state for the explorer */
export interface NavigationState {
  /** Which root folder config we're inside */
  rootConfig: FolderConfig;
  /** Current folder ID being viewed */
  currentFolderId: string;
  /** Breadcrumb trail from root to current */
  breadcrumbs: BreadcrumbEntry[];
}

/** Props for the main exported component */
export interface BoxExplorerProps {
  folders: FolderConfig[];
  /** Display name for the root breadcrumb (defaults to "All Files") */
  entityName?: string;
  /** If true, the file preview modal fills the entire viewport */
  fullScreenPreview?: boolean;
  height?: number | string;
  onError?: (error: Error) => void;
  onFilePreview?: (fileId: string, token: string) => void;
  onActionComplete?: (action: 'rename' | 'delete' | 'upload', item: BoxNode) => void;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Box API response types */
export interface BoxItem {
  id: string;
  type: 'file' | 'folder' | 'web_link';
  name: string;
  size?: number;
  modified_at?: string;
  modified_by?: { name: string; login: string };
  extension?: string;
}

export interface BoxFolderItemsResponse {
  total_count: number;
  entries: BoxItem[];
  offset: number;
  limit: number;
}

export interface BoxFolder {
  id: string;
  type: 'folder';
  name: string;
  path_collection?: {
    total_count: number;
    entries: Array<{ id: string; name: string }>;
  };
}

/** Internal context shape */
export interface BoxExplorerContextValue {
  /** All root folder configs */
  folders: FolderConfig[];
  /** Current navigation state (null = showing root selector) */
  navigation: NavigationState | null;
  /** Items in the current folder view */
  items: BoxNode[];
  /** Loading state */
  isLoading: boolean;
  /** Error */
  error: Error | null;
  /** Navigate into a folder */
  openFolder: (folderId: string, folderName: string) => void;
  /** Navigate to a breadcrumb */
  navigateTo: (breadcrumbIndex: number) => void;
  /** Go back to root folder list */
  goHome: () => void;
  /** Enter a root folder */
  enterRoot: (config: FolderConfig) => void;
  /** Get current access token */
  getToken: () => string | null;
  /** Get access token for a specific item */
  getTokenForItem: (itemId: string) => string | null;
  /** Get permissions for a specific item based on its parent folder config */
  getPermissionsForItem: (itemId: string) => ItemPermissions;
  /** Whether upload is allowed in the current view */
  canUpload: boolean;
  /** Whether creating folders is allowed in the current view */
  canCreateFolder: boolean;
  /** Rename an item */
  renameItem: (item: BoxNode, newName: string) => Promise<void>;
  /** Delete an item */
  deleteItem: (item: BoxNode) => Promise<void>;
  /** Upload files to current folder */
  uploadFiles: (files: File[]) => Promise<void>;
  /** Create a new folder in current folder */
  createFolder: (name: string) => Promise<void>;
  /** Preview a file */
  previewFile: (file: BoxNode) => void;
  /** Currently previewing file */
  previewingFile: BoxNode | null;
  /** Close preview */
  closePreview: () => void;
  /** Display name for the root breadcrumb */
  entityName: string;
  /** If true, the file preview modal fills the entire viewport */
  fullScreenPreview: boolean;
  /** Read only mode */
  readOnly: boolean;
  /** Refresh current folder */
  refresh: () => void;
}
