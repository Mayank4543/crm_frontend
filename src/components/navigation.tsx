'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';


interface NavItem {
    name: string;
    href: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}

// Navigation component
export default function Navigation() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Navigation items
    const navigation: NavItem[] = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                </svg>
            ),
        },
        {
            name: 'Customers',
            href: '/customers',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                </svg>
            ),
        },
        {
            name: 'Orders',
            href: '/orders',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.119-1.243l1.263-12C4.466 8.475 5.019 8 5.693 8h12.614c.674 0 1.227.475 1.299 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm8.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                </svg>
            ),
        },
        {
            name: 'Segments',
            href: '/segments',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                    />
                </svg>
            ),
        },
        {
            name: 'Campaigns',
            href: '/campaigns',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                    />
                </svg>
            ),
        },
        {
            name: 'Campaign History',
            href: '/campaigns/history',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    {...props}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                </svg>
            ),
        }
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl fixed w-64 inset-y-0 left-0 z-50">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-700/50">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        CRM Platform
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex flex-col flex-grow overflow-y-auto">
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navigation.map((item) => {
                        // More precise path matching to handle sub-routes correctly
                        const isActive = item.href === '/campaigns/history' 
                            ? pathname === '/campaigns/history'
                            : item.href === '/campaigns'
                            ? pathname === '/campaigns' || (pathname.startsWith('/campaigns') && pathname !== '/campaigns/history')
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:transform hover:scale-[1.01]'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 blur-xl"></div>
                                )}
                                <item.icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 ${isActive
                                        ? 'text-white drop-shadow-sm'
                                        : 'text-slate-400 group-hover:text-slate-200'
                                        }`}
                                    aria-hidden="true"
                                />
                                <span className="relative z-10">{item.name}</span>
                                {isActive && (
                                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Premium Feature Highlight */}
                <div className="mx-4 mb-6 p-4 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Premium CRM</h3>
                            <p className="text-xs text-slate-400">AI-powered insights</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User profile */}
            {user && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                {user.profilePicture ? (
                                    <Image
                                        src={user.profilePicture}
                                        alt={user.name}
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-xl object-cover"
                                    />
                                ) : (
                                    <span className="text-sm">{user.name.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email || 'Premium User'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex-shrink-0 p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200"
                            title="Sign out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
