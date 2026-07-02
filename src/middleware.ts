export { default } from 'next-auth/middleware';

// Protège les pages applicatives : les utilisateurs non authentifiés sont
// redirigés vers /connexion. Les routes /api/auth et la page de connexion
// restent publiques (non couvertes par le matcher).
export const config = {
  matcher: ['/', '/actions/:path*', '/planning/:path*', '/agile/:path*', '/analyses/:path*', '/rapports/:path*', '/copil/:path*', '/parametres/:path*'],
};
