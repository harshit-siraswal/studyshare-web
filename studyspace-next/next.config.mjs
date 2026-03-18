import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
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

export default nextConfig;
