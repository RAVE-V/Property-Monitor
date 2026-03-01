'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    // Google One Tap — auto-pops the native Google sign-in prompt
    useEffect(() => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!googleClientId) return;

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (!window.google) return;
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async () => {
                    // One Tap triggers standard Google OAuth flow
                    await signIn('google', { callbackUrl });
                },
                auto_select: true,
                cancel_on_tap_outside: false,
            });
            window.google.accounts.id.prompt();
        };
        document.body.appendChild(script);
        return () => {
            try { document.body.removeChild(script); } catch { }
        };
    }, [callbackUrl]);

    return (
        <main className="min-h-screen bg-[#000000] flex items-center justify-center font-mono overflow-hidden relative">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 242, 255, 0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 242, 255, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    animation: 'grid-scroll 20s linear infinite',
                }}
            />
            {/* Glow blobs */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#00f2ff]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-2xl shadow-black/80 p-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#10b981] animate-ping opacity-50" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-black tracking-[0.2em] uppercase text-white">Property Monitor</h1>
                            <p className="text-[10px] text-gray-600 tracking-widest uppercase">Investment Intelligence Platform</p>
                        </div>
                    </div>

                    <div className="border-b border-[#1a1a1a] mb-7" />

                    <h2 className="text-[13px] font-black text-white uppercase tracking-widest mb-1">Access Terminal</h2>
                    <p className="text-[11px] text-gray-500 mb-7">Sign in to access your investment dashboard</p>

                    {/* Google One Tap hint */}
                    <div className="bg-[#111] border border-[#222] px-3 py-2 mb-5 flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 bg-[#10b981] animate-ping rounded-full flex-shrink-0" />
                        <p className="text-[10px] text-gray-400">One-tap sign-in available — check the popup</p>
                    </div>

                    {/* Provider buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => signIn('google', { callbackUrl })}
                            className="group flex items-center gap-3 w-full bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-[#444] px-4 py-3 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-[11px] font-black tracking-widest text-white uppercase">Continue with Google</span>
                            <svg className="w-3 h-3 text-gray-600 ml-auto group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => signIn('credentials', { callbackUrl })}
                            className="group flex items-center gap-3 w-full bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-[#444] px-4 py-3 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 flex-shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="text-[11px] font-black tracking-widest text-[#10b981] uppercase mt-0.5">Development Login (Bypass)</span>
                            <svg className="w-3 h-3 text-gray-600 ml-auto group-hover:text-[#10b981] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                    </div>

                    <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                        <p className="text-[9px] text-gray-600 text-center tracking-wide">
                            By signing in, you agree that this platform is for authorised investment analysis only.
                        </p>
                    </div>
                </div>
                <p className="text-center text-[9px] text-gray-700 mt-3 tracking-widest uppercase">v2.5 // Property Monitor OS</p>
            </div>

            <style jsx global>{`
                @keyframes grid-scroll {
                    0% { background-position: 0 0; }
                    100% { background-position: 60px 60px; }
                }
            `}</style>
        </main>
    );
}
