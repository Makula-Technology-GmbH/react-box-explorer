# react-box-explorer

A zero-dependency React component for browsing, managing, and previewing files stored in [Box](https://www.box.com/). Supports multiple folder sources with independent access tokens and per-folder permissions.

## Features

- Browse and navigate Box folders with breadcrumb navigation
- File preview using Box Content Preview SDK
- Upload files (multi-select, up to 10 at once)
- Create folders
- Rename files and folders
- Delete files and folders
- Download files
- Per-folder access tokens
- Per-folder permissions (`canUpload`, `canCreateFolder`, `canPreview`, `canDownload`, `canDelete`)
- Customizable root label via `entityName`
- Read-only mode
- Zero runtime dependencies (only peer deps: `react`, `react-dom`)

## Installation

```bash
npm install react-box-explorer
# or
yarn add react-box-explorer
```

## Quick Start

```tsx
import { BoxExplorer } from 'react-box-explorer';
import 'react-box-explorer/style.css';

function App() {
  return (
    <BoxExplorer
      folders={[
        {
          folderId: '123456',
          token: 'YOUR_BOX_ACCESS_TOKEN',
          label: 'Project Files',
          canUpload: true,
          canCreateFolder: true,
          canPreview: true,
          canDownload: true,
          canDelete: false,
        },
      ]}
      entityName="My Documents"
      height={600}
      onError={(err) => console.error(err)}
    />
  );
}
```

## Props

### `BoxExplorerProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `folders` | `FolderConfig[]` | *required* | Array of Box folder configurations |
| `baseUrl` | `string` | `"https://api.box.com/2.0"` | Base URL for all Box API calls (point it at a proxy if you don't call Box directly) |
| `uploadBaseUrl` | `string` | `"https://upload.box.com/api/2.0"` | Base URL for uploads. Falls back to `baseUrl` when `baseUrl` is customized |
| `entityName` | `string` | `"All Files"` | Display name for the root breadcrumb |
| `height` | `number \| string` | `500` | Height of the explorer container |
| `readOnly` | `boolean` | `false` | Disable all write operations (upload, rename, delete, create folder) |
| `onError` | `(error: Error) => void` | — | Called when a Box API error occurs |
| `onActionComplete` | `(action, item) => void` | — | Called after a successful rename, delete, or upload |
| `className` | `string` | — | Additional CSS class for the container |
| `style` | `React.CSSProperties` | — | Inline styles for the container |

### `FolderConfig`

Each entry in the `folders` array represents a Box folder with its own token and permissions.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `folderId` | `string` | *required* | Box folder ID |
| `token` | `string` | *required* | Box access token for this folder |
| `label` | `string` | — | Optional display label |
| `canUpload` | `boolean` | `true` | Allow uploading files into this folder and its subfolders |
| `canCreateFolder` | `boolean` | `true` | Allow creating folders inside this folder and its subfolders |
| `canPreview` | `boolean` | `true` | Allow previewing files in this folder and its subfolders |
| `canDownload` | `boolean` | `true` | Allow downloading files from this folder and its subfolders |
| `canRename` | `boolean` | `true` | Allow renaming items in this folder and its subfolders |
| `canDelete` | `boolean` | `true` | Allow deleting items in this folder and its subfolders |

## Permissions

Permissions are set per root folder and inherited by all items within that folder tree.

**At the root (merged) view:**
- Upload targets the first folder config where `canUpload` is `true`
- Create Folder targets the first folder config where `canCreateFolder` is `true`
- Toolbar buttons are hidden if no folder has the corresponding permission

**Inside a folder:**
- All items inherit the permissions of their root folder config
- The context menu adapts per item — only permitted actions are shown
- Single-click preview only works when `canPreview` is `true`

## Multiple Folders

You can display contents from multiple Box folders merged into a single view. Each folder uses its own access token:

```tsx
<BoxExplorer
  folders={[
    {
      folderId: '111',
      token: 'TOKEN_A',
      label: 'Engineering',
      canDelete: false,
    },
    {
      folderId: '222',
      token: 'TOKEN_B',
      label: 'Marketing',
      canUpload: false,
      canCreateFolder: false,
    },
  ]}
  entityName="All Teams"
/>
```

## Custom base URL

By default every request goes straight to Box (`https://api.box.com/2.0`, and
`https://upload.box.com/api/2.0` for uploads). Pass `baseUrl` to route requests
through your own backend/proxy instead:

```tsx
<BoxExplorer
  folders={[{ folderId: '123', token: 'PROXY_TOKEN' }]}
  baseUrl="https://api.example.com/box/2.0"
/>
```

Notes:

- Paths are appended verbatim to `baseUrl` (`/folders/:id/items`, `/files/:id`,
  `/files/:id/content`, …), so the proxy must mirror Box's API shape.
- When `baseUrl` is customized, uploads go to the same host unless you also
  pass `uploadBaseUrl`. Set both explicitly to split them:

  ```tsx
  <BoxExplorer
    folders={folders}
    baseUrl="https://api.example.com/box/2.0"
    uploadBaseUrl="https://upload.example.com/box/2.0"
  />
  ```
- `baseUrl` is also forwarded to the Box Content Preview SDK as its `apiHost`
  (with the trailing `/2.0` stripped). The SDK bundle itself is still loaded
  from `cdn01.boxcdn.net`, and thumbnail/representation content URLs are used as
  returned by the API.
- The defaults are exported if you need them:

  ```ts
  import {
    DEFAULT_BOX_BASE_URL,
    DEFAULT_BOX_UPLOAD_BASE_URL,
  } from 'react-box-explorer';
  ```

## Exported Types

```ts
import type {
  BoxExplorerProps,
  FolderConfig,
  BoxNode,
  ItemPermissions,
} from 'react-box-explorer';
```

## Development

```bash
# Install dependencies
yarn install

# Start demo dev server on localhost:3000
yarn dev

# Build the library
yarn build

# Type check
yarn typecheck
```

## License

MIT — [GitHub](https://github.com/Makula-Technology-GmbH/react-box-explorer)
