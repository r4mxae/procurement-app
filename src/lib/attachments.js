// Supabase Storage layer for task/tender attachments.
//
// Files live in the private `attachments` bucket, keyed by
//   <userId>/<kind>/<itemId>/<fileId>-<safeFilename>
// — the leading <userId> segment is what the storage RLS policies match
// against, so a user can never read or write another user's blobs even
// if they guess the path. Metadata for each file (id, name, size,
// mimeType, path, uploadedAt) is stored as JSONB on the parent task or
// tender row; this module only owns the blob side.

import { supabase } from './supabase';

const BUCKET = 'attachments';

// Hard cap to keep a single upload from blowing through a free-tier quota.
// Bump this if you upgrade the Supabase plan and want to allow larger files.
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

const newId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })
);

// Make a filename safe for use as part of a storage key. Keep the
// extension so downloads land with a sensible default name.
const sanitizeName = (name) => {
  const safe = (name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe || 'file';
};

const buildPath = (userId, kind, itemId, fileId, name) =>
  `${userId}/${kind}/${itemId}/${fileId}-${sanitizeName(name)}`;

// Upload a File/Blob and return the metadata entry to append to the
// parent row's attachments[]. Throws on validation or storage failure.
export async function uploadAttachment({ userId, kind, itemId, file }) {
  if (!file) throw new Error('No file selected');
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File is too large (max ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB)`);
  }
  const id = newId();
  const path = buildPath(userId, kind, itemId, id, file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  if (error) throw error;
  return {
    id,
    name: file.name || 'file',
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    path,
    uploadedAt: new Date().toISOString(),
  };
}

// Short-lived signed URL — used for both viewing and downloading. We
// re-issue every time so links can't leak permanently.
export async function getAttachmentUrl(path, { download = false } = {}) {
  const { data, error } = await supabase.storage.from(BUCKET)
    .createSignedUrl(path, 60 * 5, download ? { download: true } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeAttachmentFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
