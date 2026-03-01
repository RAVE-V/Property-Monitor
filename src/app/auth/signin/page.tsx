import { Suspense } from 'react';
import SignInContent from './SignInContent';

export const metadata = {
    title: 'Sign In | Property Monitor',
    description: 'Sign in to access property investment intelligence.',
};

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
