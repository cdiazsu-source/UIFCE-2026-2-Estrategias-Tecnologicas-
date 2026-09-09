/** @type {import('next').NextConfig} */
const nextConfig = {
  // Momento de la compilación (en Vercel = momento del deploy). Se muestra en el
  // pie como "Versión ..."; cambia en cada push. En `next dev` es la hora en que
  // arrancó el servidor.
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
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
