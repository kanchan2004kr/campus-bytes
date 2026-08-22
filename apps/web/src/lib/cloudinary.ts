import { api } from './api-client';

// Image upload goes through OUR backend for signing (secret stays server-side),
// then the browser POSTs the file straight to Cloudinary with the returned
// signature. No Cloudinary keys live in the frontend bundle.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export async function uploadImage(file: File, folder = 'campusbytes'): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 5 MB).');
  }

  // 1) Ask our backend to sign the upload (auth-scoped to restaurant/admin).
  const sig = await api.post<SignResponse>('/uploads/sign', { folder });

  // 2) POST the file directly to Cloudinary with the signed params.
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(detail?.error?.message ?? 'Upload failed. Please try again.');
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Upload failed. Please try again.');
  return data.secure_url;
}
