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
  return request<BoxFolder>(token, '/folders', {
    method: 'POST',
    body: JSON.stringify({
      name,
      parent: { id: parentFolderId },
    }),
  });
}

export async function uploadFile(
  token: string,
  parentFolderId: string,
  file: File,
): Promise<void> {
  const attributes = JSON.stringify({
    name: file.name,
    parent: { id: parentFolderId },
  });

  const formData = new FormData();
  formData.append('attributes', attributes);
  formData.append('file', file);

  const res = await fetch(`${UPLOAD_URL}/files/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Box upload error ${res.status}: ${body}`);
  }
}
