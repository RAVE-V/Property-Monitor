// This is NextAuth v5 beta type augmentation
// Required to avoid "inferred type cannot be named" errors in Turbopack builds
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
        } & DefaultSession['user'];
    }
}
