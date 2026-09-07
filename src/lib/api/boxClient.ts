import type { BoxFolderItemsResponse, BoxFolder } from '../types';

/** Box's public API host (used when no `baseUrl` is supplied) */
export const DEFAULT_BASE_URL = 'https://api.box.com/2.0';
/** Box's public upload host (used when no `uploadBaseUrl` is supplied) */
export const DEFAULT_UPLOAD_BASE_URL = 'https://upload.box.com/api/2.0';

export interface BoxClientConfig {
  /** Base URL for Box API calls. Defaults to `https://api.box.com/2.0`. */
  baseUrl?: string;
  /**
   * Base URL for file uploads. Defaults to `https://upload.box.com/api/2.0`
   * when `baseUrl` is not customised, otherwise it defaults to `baseUrl`
   * (a custom base is assumed to be a proxy that serves both).
   */
  uploadBaseUrl?: string;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Resolve the API/upload bases from a partial config */
export function resolveBaseUrls(config: BoxClientConfig = {}) {
  const baseUrl = stripTrailingSlash(config.baseUrl?.trim() || DEFAULT_BASE_URL);
  const uploadFallback =
    baseUrl === DEFAULT_BASE_URL ? DEFAULT_UPLOAD_BASE_URL : baseUrl;
  const uploadBaseUrl = stripTrailingSlash(
    config.uploadBaseUrl?.trim() || uploadFallback,
  );
  return { baseUrl, uploadBaseUrl };
}

export function createBoxClient(config: BoxClientConfig = {}) {
  const { baseUrl: BASE_URL, uploadBaseUrl: UPLOAD_URL } = resolveBaseUrls(config);

  async function request<T>(
    token: string,
    path: string,
    options: RequestInit = {},
    baseUrl = BASE_URL,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Box API error ${res.status}: ${body}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async function getFolder(token: string, folderId: string): Promise<BoxFolder> {
    return request<BoxFolder>(
      token,
      `/folders/${folderId}?fields=id,name,type,path_collection`,
    );
  }

  async function listFolderItems(
    token: string,
    folderId: string,
    offset = 0,
    limit = 1000,
  ): Promise<BoxFolderItemsResponse> {
    return request<BoxFolderItemsResponse>(
      token,
      `/folders/${folderId}/items?fields=id,type,name,size,modified_at,modified_by,extension&offset=${offset}&limit=${limit}`,
    );
  }

  async function listAllFolderItems(
    token: string,
    folderId: string,
  ): Promise<BoxFolderItemsResponse['entries']> {
    const entries: BoxFolderItemsResponse['entries'] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const res = await listFolderItems(token, folderId, offset, limit);
      entries.push(...res.entries);
      if (entries.length >= res.total_count) break;
      offset += limit;
    }

    return entries;
  }

  async function renameFile(
    token: string,
    fileId: string,
    newName: string,
  ): Promise<void> {
    await request(token, `/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
  }

  async function renameFolder(
    token: string,
    folderId: string,
    newName: string,
  ): Promise<void> {
    await request(token, `/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
  }

  async function deleteFile(token: string, fileId: string): Promise<void> {
    await request(token, `/files/${fileId}`, { method: 'DELETE' });
  }

  async function deleteFolder(
    token: string,
    folderId: string,
    recursive = true,
  ): Promise<void> {
    await request(
      token,
      `/folders/${folderId}?recursive=${recursive}`,
      { method: 'DELETE' },
    );
  }

  async function createFolder(
    token: string,
    parentFolderId: string,
    name: string,
  ): Promise<BoxFolder> {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parent: { id: parentFolderId } }),
    });

    if (res.ok) return res.json();

    // 409 = name conflict. Reuse the existing folder so retries (and concurrent
    // uploads into the same nested path) don't fail.
    if (res.status === 409) {
      const body = await res.json().catch(() => null);
      const existingId = body?.context_info?.conflicts?.[0]?.id;
      if (existingId) {
        return { id: existingId, name, type: 'folder' } as BoxFolder;
      }
    }

    const text = await res.text();
    throw new Error(`Box API error ${res.status}: ${text}`);
  }

  async function uploadFile(
    token: string,
    parentFolderId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const attributes = JSON.stringify({
      name: file.name,
      parent: { id: parentFolderId },
    });

    const formData = new FormData();
    formData.append('attributes', attributes);
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress?.(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          reject(new Error(`Box upload error ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${UPLOAD_URL}/files/content`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /** Download a file's contents as a Blob */
  async function downloadFile(token: string, fileId: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/files/${fileId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  }

  /** Fetch a file's representations (used for grid thumbnails) */
  async function getRepresentations(
    token: string,
    fileId: string,
    repHints: string,
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/files/${fileId}?fields=representations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-rep-hints': repHints,
      },
    });
    if (!res.ok) throw new Error('request failed');
    return res.json();
  }

  return {
    baseUrl: BASE_URL,
    uploadBaseUrl: UPLOAD_URL,
    getFolder,
    listFolderItems,
    listAllFolderItems,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    createFolder,
    uploadFile,
    downloadFile,
    getRepresentations,
  };
}

export type BoxClient = ReturnType<typeof createBoxClient>;
