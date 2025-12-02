import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // Thêm trailing slash
    trailingSlash: true,

    // Cấu hình headers cho static files
    async headers() {
        return [
            {
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable"
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*"
                    }
                ]
            },
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN"
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff"
                    }
                ]
            }
        ];
    }
};

export default nextConfig;
