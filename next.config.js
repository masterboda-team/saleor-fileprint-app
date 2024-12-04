/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
		NEXT_MEDIA_DIR: process.env.NEXT_MEDIA_DIR,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
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
  basePath: process.env.NEXT_BASE_PATH || "",
  // used in the Dockerfile
	output:
    process.env.NEXT_OUTPUT === "standalone"
      ? "standalone"
      : undefined,
};
