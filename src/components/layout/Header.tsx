import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Filters from '../Filters';
import { useAppStore } from '../../store';

export default function Header() {
    const isListViewOpen = useAppStore(state => state.isListViewOpen);
    const toggleListView = useAppStore(state => state.toggleListView);
    const setFilters = useAppStore(state => state.setFilters);
    const { data: session } = useSession();

    return (
        <header className="h-12 bg-[#000000] border-b border-[#222222] flex items-center justify-between px-4 z-50 relative text-white shrink-0">
            <div className="flex items-center gap-4">
                {/* Brand: blinking dot + name */}
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-wm-green shadow-[0_0_8px_#10b981]" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-wm-green animate-ping opacity-60" />
                    </div>
                    <h1 className="text-[15px] font-black tracking-[0.15em] uppercase">
                        Property Monitor
                    </h1>
                    <span className="text-gray-600 font-mono text-[9px] tracking-normal lowercase">v2.5.20</span>
                </div>

                {/* Region selector */}
                <div className="bg-[#111] border border-[#333] px-3 py-1 flex items-center min-w-[80px] justify-between cursor-pointer hover:bg-[#1a1a1a]">
                    <span className="text-[11px] text-gray-300">UK</span>
                    <span className="text-[8px] text-gray-500 ml-2">▼</span>
                </div>
            </div>

            <div className="flex-1 flex justify-center border-l border-r border-[#222222] mx-4">
                <Filters onFilterChange={setFilters} />
            </div>

            <div className="flex items-center gap-3">
                <nav className="flex items-center gap-3">
                    <button
                        onClick={toggleListView}
                        className={`text-[9px] font-black transition-colors uppercase tracking-widest px-3 py-1 border ${isListViewOpen ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-[#111] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'}`}
                    >
                        {isListViewOpen ? 'Close Telemetry' : 'Open Telemetry'}
                    </button>
                    <Link href="/pipeline" className="text-[9px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest bg-[#111] border border-[#333] px-3 py-1 hover:border-gray-500">
                        Satellite Dashboard
                    </Link>
                </nav>

                {/* User Avatar + Sign Out */}
                {session?.user && (
                    <div className="flex items-center gap-2 pl-3 border-l border-[#222]">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                className="w-6 h-6 rounded-full border border-[#333] object-cover"
                                title={session.user.name || session.user.email || ''}
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[9px] font-black text-gray-400">
                                {(session.user.name?.[0] || session.user.email?.[0] || '?').toUpperCase()}
                            </div>
                        )}
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                            className="text-[9px] font-black text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                            title="Sign out"
                        >
                            Exit
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
