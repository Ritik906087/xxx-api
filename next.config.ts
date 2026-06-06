import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/xxapi/:path*',
        destination: '/api/xxapi/:path*',
      },
      {
        source: '/app/:path*',
        destination: '/api/app/:path*',
      },
      {
        source: '/init',
        destination: '/api/init',
      },
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/config',
        destination: '/api/config',
      },
      {
        source: '/settings',
        destination: '/api/settings',
      },
      {
        source: '/user/:path*',
        destination: '/api/user/:path*',
      }
    ];
  },
};

export default nextConfig;
