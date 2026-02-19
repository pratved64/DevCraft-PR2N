// @ts-check
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  exclude: [
    ({ asset }) => {
      return asset.name.startsWith("public/") || asset.name.startsWith("server/");
    }
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
};

export default withSerwist(nextConfig);
// export default nextConfig;
