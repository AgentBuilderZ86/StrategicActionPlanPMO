import type { Role } from '@/lib/constants';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
      perimetrePays?: string | null;
    };
  }
  interface User {
    role?: Role;
    perimetrePays?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    perimetrePays?: string | null;
  }
}
