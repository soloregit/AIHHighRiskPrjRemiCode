import type { NextConfig } from "next";

const prod = process.env.NODE_ENV === 'production' ? true : false;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: prod ? '/remibot' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
