// Direct, unsigned image upload to Cloudinary from the browser. No API secret is
// ever exposed — the (public) cloud name + unsigned upload preset gate uploads,
// and the preset enforces allowed formats / size in the Cloudinary console.
// Only the resulting secure_url is stored in our DB via the authenticated APIs.

export const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
export const CLOUDINARY_READY = Boolean(CLOUDINARY_CLOUD && CLOUDINARY_PRESET);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadImage(file: File): Promise<string> {
  if (!CLOUDINARY_READY) {
    throw new Error('Image upload is not configured yet. Add your Cloudinary keys in Vercel.');
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 5 MB).');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
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
