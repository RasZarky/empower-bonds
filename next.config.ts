import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The deployed site is the demo UI only: everything is prerendered into
  // `out/` and served as static files by Firebase Hosting.
  output: "export",
  trailingSlash: true,
  images: {
    // The default loader needs a server; export uses the raw images instead.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
