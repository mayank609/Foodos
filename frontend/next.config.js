/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media-assets.swiggy.com' },
      { protocol: 'https', hostname: 'b.zmtcdn.com' },
      { protocol: 'https', hostname: 'cdn.zomato.com' },
    ],
  },
};

module.exports = nextConfig;
