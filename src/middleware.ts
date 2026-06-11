export { default } from 'next-auth/middleware';

// Protège les pages applicatives : les utilisateurs non authentifiés sont
// redirigés vers /connexion. Les routes /api/auth et la page de connexion
// restent publiques (non couvertes par le matcher).
export const config = {
  matcher: ['/', '/actions/:path*', '/analyses/:path*', '/copil/:path*', '/parametres/:path*'],
};
