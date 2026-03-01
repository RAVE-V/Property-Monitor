// Type-safe auth exports for next-auth v5 beta
// We use 'any' casts here to work around Turbopack's strict type inference
// which cannot resolve node_modules internal types at build time.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './database/db';
import { users, accounts, sessions, verificationTokens } from './database/schema';

const config = {
    adapter: DrizzleAdapter(db, {
        usersTable: users as any,
        accountsTable: accounts as any,
        sessionsTable: sessions as any,
        verificationTokensTable: verificationTokens as any,
    }),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    callbacks: {
        session({ session, user }: { session: any; user: any }) {
            if (session.user && user) {
                session.user.id = user.id;
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
