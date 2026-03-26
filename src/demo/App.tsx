import { useState } from "react";
import { BoxExplorer } from "../lib";
import type { FolderConfig } from "../lib/types";

export function App() {
  const [rows, setRows] = useState([
    {
      folderId: "",
      token: "",
      label: "",
      canUpload: true,
      canCreateFolder: true,
      canPreview: true,
      canDownload: true,
      canRename: true,
      canDelete: true,
    },
  ]);
  const [config, setConfig] = useState<FolderConfig[] | null>(null);

  const addRow = () =>
    setRows((r) => [
      ...r,
      {
        folderId: "",
        token: "",
        label: "",
        canUpload: true,
        canCreateFolder: true,
        canPreview: true,
        canDownload: true,
        canRename: true,
      canDelete: true,
      },
    ]);

  const updateRow = (i: number, field: string, val: string | boolean) =>
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)),
    );

  const removeRow = (i: number) =>
    setRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)));

  const handleLoad = () => {
    const folders: FolderConfig[] = rows
      .filter((r) => r.folderId && r.token)
      .map((r) => ({
        folderId: r.folderId,
        token: r.token,
        label: r.label || undefined,
        canUpload: r.canUpload,
        canCreateFolder: r.canCreateFolder,
        canPreview: r.canPreview,
        canDownload: r.canDownload,
        canRename: r.canRename,
        canDelete: r.canDelete,
      }));
    if (folders.length > 0) setConfig(folders);
  };

  return (
    <div
      style={{
        fontFamily: "'Lato', system-ui, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
        Box File Explorer
      </h1>
      <p style={{ color: "#666", marginBottom: 28, fontSize: 14 }}>
        Enter Box folder IDs with their access tokens. Each folder can use a
        different token.
      </p>

      <div
        style={{
          background: "#f9f9f9",
          border: "1px solid #e8e8e8",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
        }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: i < rows.length - 1 ? 12 : 0,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="Folder ID"
              value={row.folderId}
              onChange={(e) => updateRow(i, "folderId", e.target.value)}
              style={{
                width: 120,
                padding: "8px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            <input
              type="password"
              placeholder="Access Token"
              value={row.token}
              onChange={(e) => updateRow(i, "token", e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            <input
              placeholder="Label (optional)"
              value={row.label}
              onChange={(e) => updateRow(i, "label", e.target.value)}
              style={{
                width: 140,
                padding: "8px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            {rows.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid #d0d0d0",
                  background: "#fff",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &times;
              </button>
            )}
            <div style={{ display: "flex", gap: 10, marginLeft: 4, fontSize: 11, color: "#666" }}>
              {(["canUpload", "canCreateFolder", "canPreview", "canDownload", "canRename", "canDelete"] as const).map((perm) => (
                <label key={perm} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={row[perm]}
                    onChange={(e) => updateRow(i, perm, e.target.checked)}
                  />
                  {perm.replace("can", "")}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={addRow}
            style={{
              padding: "8px 16px",
              border: "1px solid #d0d0d0",
              background: "#fff",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            + Add Folder
          </button>
          <button
            onClick={handleLoad}
            style={{
              padding: "8px 24px",
              background: "#0061d5",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Load
          </button>
        </div>
      </div>

      {config ? (
        <BoxExplorer
          folders={config}
          height={600}
          onError={(err) => console.error("BoxExplorer error:", err)}
          onActionComplete={(action, item) =>
            console.log(`Action: ${action}`, item)
          }
          entityName="Machine"
        />
      ) : (
        <div
          style={{
            border: "2px dashed #e0e0e0",
            borderRadius: 8,
            padding: 64,
            textAlign: "center",
            color: "#aaa",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ marginBottom: 12, opacity: 0.3 }}
          >
            <path
              d="M6 8h14l4 4H42v28H6z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <p style={{ margin: "0 0 8px", fontSize: 15 }}>
            Configure folders above and click <strong>Load</strong>
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            Right-click items for actions. Double-click files to preview.
          </p>
        </div>
      )}
    </div>
  );
}
