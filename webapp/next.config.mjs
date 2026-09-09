/** @type {import('next').NextConfig} */
const nextConfig = {
  // El adaptador de Neon usa `ws` (con su addon nativo `bufferutil`). Si webpack
  // lo empaqueta, el addon nativo se rompe en runtime ("bufferUtil.mask is not a
  // function"). Dejarlos como externos hace que Next los cargue con require().
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/adapter-neon",
      "@neondatabase/serverless",
      "ws",
    ],
  },
};

export default nextConfig;
