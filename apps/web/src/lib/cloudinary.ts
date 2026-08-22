import { api } from './api-client';

// The browser sends the ACTUAL file (multipart/form-data) to OUR backend, which
// uploads it to Cloudinary server-side. No Cloudinary keys/secret live in the
// frontend bundle. Returns the hosted secure URL.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function uploadImage(file: File, folder = 'campusbytes'): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 5 MB).');
  }

  const form = new FormData();
  form.append('file', file);

  const { url } = await api.upload<{ url: string }>(
    `/uploads/image?folder=${encodeURIComponent(folder)}`,
    form,
  );
  return url;
}
