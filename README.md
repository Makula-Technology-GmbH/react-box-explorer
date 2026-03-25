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

MIT
