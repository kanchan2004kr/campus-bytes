/** @type {import('next').NextConfig} */
// Deployment trigger: touch apps/web so Vercel's affected-project detection
// rebuilds Production from the latest main commit (carries corrected lockfile).
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
