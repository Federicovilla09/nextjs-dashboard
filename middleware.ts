import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Aplica el middleware a todas las rutas excepto las estáticas/API
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
