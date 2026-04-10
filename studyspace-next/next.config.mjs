import { fileURLToPath } from "node:url";
import bundleAnalyzer from "@next/bundle-analyzer";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: "/downloads/studyshare-android.apk",
        destination: "https://file.mystudyspace.me/downloads/studyshare-android.apk",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "studyshare.in" },
      { hostname: "file.studyshare.in" },
      { hostname: "*.r2.dev" },
      { hostname: "res.cloudinary.com" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
