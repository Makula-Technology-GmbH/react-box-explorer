import type { BoxFolderItemsResponse, BoxFolder } from '../types';

const BASE_URL = 'https://api.box.com/2.0';
const UPLOAD_URL = 'https://upload.box.com/api/2.0';

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

export async function getFolder(
  token: string,
  folderId: string,
): Promise<BoxFolder> {
  return request<BoxFolder>(
    token,
    `/folders/${folderId}?fields=id,name,type,path_collection`,
  );
}

export async function listFolderItems(
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

export async function listAllFolderItems(
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

export async function renameFile(
  token: string,
  fileId: string,
  newName: string,
): Promise<void> {
  await request(token, `/files/${fileId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
}

export async function renameFolder(
  token: string,
  folderId: string,
  newName: string,
): Promise<void> {
  await request(token, `/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
}

export async function deleteFile(
  token: string,
  fileId: string,
): Promise<void> {
  await request(token, `/files/${fileId}`, { method: 'DELETE' });
}

export async function deleteFolder(
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

export async function createFolder(
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

export async function uploadFile(
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
