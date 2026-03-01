// Type-safe auth exports for next-auth v5 beta
// We use 'any' casts here to work around Turbopack's strict type inference
// which cannot resolve node_modules internal types at build time.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './database/db';
import { users, accounts, sessions, verificationTokens } from './database/schema';
import { eq } from 'drizzle-orm';

const config = {
    secret: process.env.AUTH_SECRET || 'dbe111a5642406b75541ea1d02c1696dbad7be83bb992fba159ab2e5f7dc6074',
    adapter: DrizzleAdapter(db, {
        usersTable: users as any,
        accountsTable: accounts as any,
        sessionsTable: sessions as any,
        verificationTokensTable: verificationTokens as any,
    }),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID || 'dummy_client_id',
            clientSecret: process.env.AUTH_GOOGLE_SECRET || 'dummy_client_secret',
        }),
        Credentials({
            name: 'Development Mode',
            credentials: {},
            async authorize() {
                return { id: 'dev-admin', name: 'Admin', email: 'admin@propertyintel.com' };
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    callbacks: {
        async signIn({ user, profile, account, email, credentials }) {
            // Update last IP address on sign in if we have a user ID and can find the IP
            if (user?.id) {
                try {
                    // In Next.js middleware/server actions, we'd normally use headers()
                    // Auth.js doesn't pass the raw request here, so we rely on the adapter 
                    // or a separate middleware hit to populate this if possible.
                    // However, we can use a trick to try and find the request via the environment in Node.
                    const { headers } = await import('next/headers');
                    const headerList = await headers();
                    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

                    await db.update(users as any)
                        .set({ lastIp: ip })
                        .where(eq(users.id, user.id));
                } catch (e) {
                    console.error('Failed to update user IP:', e);
                }
            }
            return true;
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    trustHost: true,
} satisfies NextAuthConfig;

const result = NextAuth(config);

export const handlers: typeof result.handlers = result.handlers;
export const auth: typeof result.auth = result.auth;
export const signIn: typeof result.signIn = result.signIn;
export const signOut: typeof result.signOut = result.signOut;
