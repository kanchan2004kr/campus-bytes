/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Packages are resolved from source via tsconfig `paths` (see tsconfig.json).
  // This keeps the app buildable in environments where workspace symlinks are
  // unavailable (e.g. Windows without Developer Mode).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
