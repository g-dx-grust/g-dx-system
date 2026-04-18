/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@g-dx/ui"],

    // Avoid bundling heavy server-only packages into client bundles
    serverExternalPackages: ['@g-dx/database'],

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
    },

    // Enable compression
    compress: true,

    // Optimize large package imports (tree-shake)
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-slot'],
    },
};

export default nextConfig;
