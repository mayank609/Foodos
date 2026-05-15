/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media-assets.swiggy.com' },
      { protocol: 'https', hostname: 'b.zmtcdn.com' },
      { protocol: 'https', hostname: 'cdn.zomato.com' },
    ],
  },
};

module.exports = nextConfig;
