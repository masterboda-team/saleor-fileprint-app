/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
		NEXT_MEDIA_DIR: process.env.NEXT_MEDIA_DIR,
	},
  async rewrites() {
    return [
      {
        source: '/public/media/:path*',
        destination: '/media/:path*',
      },
    ];
  },
  server: {
    keepAliveTimeout: 5 * 1000, // Set keep-alive timeout to 5 seconds
  },
};
