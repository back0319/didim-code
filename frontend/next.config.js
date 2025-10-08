/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Monaco Editor를 위한 설정
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });

    // node.js 모듈을 브라우저에서 사용할 수 있도록 fallback 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      path: false,
    };

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://backend:8000/:path*' 
          : 'http://localhost:8000/:path*'
      }
    ]
  }
}

module.exports = nextConfig