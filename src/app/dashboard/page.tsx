'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types
interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    audienceSize: number;
    audience_size?: number;
    sentCount: number;
    sent_count?: number;
    failedCount: number;
    failed_count?: number;
    createdAt: string;
    created_at?: string;
    tags?: string[];
    message_template?: string;
    ai_summary?: string;
}

interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    total_spent?: number;
    order_count?: number;
}

interface Order {
    id: string;
    customer_id: string;
    total_amount: number;
    amount?: number; // Alternative field name used in some responses
    status: string;
    created_at: string;
    customer_name?: string;
}

interface DashboardStats {
    totalCampaigns: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    messagesSent: number;
    successRate: number;
    avgOrderValue: number;
    monthlyGrowth: number;
}

// Dashboard page component
function DashboardContent() {
    const { isAuthenticated, isLoading, user, login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const api = useApiClient();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalCampaigns: 0,
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        messagesSent: 0,
        successRate: 0,
        avgOrderValue: 0,
        monthlyGrowth: 0
    });
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<'week' | 'month' | 'year'>('week');
    const [chartData, setChartData] = useState<Array<{name: string; campaigns: number; messages: number; success: number}>>([]);

    // Handle token from URL (OAuth callback)
    useEffect(() => {
        const token = searchParams.get('token');
        if (token && !isAuthenticated) {
            try {
                // Decode JWT token to get user data
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                                const decoded: { id: string; email: string; name: string; profilePicture?: string } = JSON.parse(jsonPayload);

                // Create user object from token
                const userData = {
                    id: decoded.id,
                    email: decoded.email,
                    name: decoded.name,
                    profilePicture: decoded.profilePicture || undefined
                };

                // Login with token and user data
                login(token, userData);

                // Clean URL by removing token parameter
                router.replace('/dashboard');
            } catch (error) {
                console.error('Error processing token:', error);
                router.push('/login?error=invalid_token');
            }
        }
    }, [searchParams, isAuthenticated, login, router]);

    // Redirect if not authenticated (and no token in URL)
    useEffect(() => {
        const token = searchParams.get('token');
        if (!isLoading && !isAuthenticated && !token) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, user, router, searchParams]);

    // Fetch all dashboard data
    useEffect(() => {
        console.log('Dashboard useEffect triggered:', { isAuthenticated, isLoading, user });
        if (isAuthenticated) {
            const fetchDashboardData = async () => {
                try {
                    console.log('Starting to fetch dashboard data...');
                    setIsLoadingData(true);
                    
                    // Fetch all data in parallel
                    const [campaignsRes, customersRes, ordersRes, segmentsRes] = await Promise.allSettled([
                        api.campaigns.getCampaigns(1, 50),
                        api.get('/api/customers?limit=100'),
                        api.get('/api/orders?limit=100'),
                        api.get('/api/segments')
                    ]);

                    console.log('Dashboard API Results:', {
                        campaigns: campaignsRes,
                        customers: customersRes,
                        orders: ordersRes,
                        segments: segmentsRes
                    });

                    // Handle campaigns data
                    if (campaignsRes.status === 'fulfilled') {
                        const response = campaignsRes.value.data;
                        const campaignsData = response?.data || response?.campaigns || response || [];
                        console.log('Campaigns response structure:', response);
                        console.log('Campaigns data extracted:', campaignsData);
                        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
                    } else {
                        console.error('Failed to fetch campaigns:', campaignsRes.reason);
                    }

                    // Handle customers data
                    if (customersRes.status === 'fulfilled') {
                        const response = customersRes.value.data;
                        const customersData = response?.data || response?.customers || response || [];
                        console.log('Customers response structure:', response);
                        console.log('Customers data extracted:', customersData);
                        setCustomers(Array.isArray(customersData) ? customersData : []);
                    } else {
                        console.error('Failed to fetch customers:', customersRes.reason);
                    }

                    // Handle orders data
                    if (ordersRes.status === 'fulfilled') {
                        const response = ordersRes.value.data;
                        const ordersData = response?.data || response?.orders || response || [];
                        console.log('Orders response structure:', response);
                        console.log('Orders data extracted:', ordersData);
                        setOrders(Array.isArray(ordersData) ? ordersData : []);
                    } else {
                        console.error('Failed to fetch orders:', ordersRes.reason);
                    }

                    // Handle segments data
                    if (segmentsRes.status === 'fulfilled') {
                        const response = segmentsRes.value.data;
                        const segmentsData = response?.data || response?.segments || response || [];
                        console.log('Segments response structure:', response);
                        console.log('Segments data extracted:', segmentsData);
                        // Note: segments data fetched but not stored as it's not used
                    } else {
                        console.error('Failed to fetch segments:', segmentsRes.reason);
                    }

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                    console.error('Authentication state:', { isAuthenticated, user });
                    console.error('API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
                } finally {
                    setIsLoadingData(false);
                    setIsLoadingCampaigns(false);
                }
            };

            fetchDashboardData();
        }
    }, [isAuthenticated, isLoading, user, api]);

    // Generate chart data based on time frame
    const generateChartData = useCallback((timeFrame: string) => {
        const now = new Date();
        const data = [];

        if (timeFrame === 'week') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                
                // Simulate data based on actual campaigns
                const campaignsForDay = campaigns.filter(campaign => {
                    const dateField = campaign.created_at || campaign.createdAt;
                    if (!dateField) return false;
                    const campaignDate = new Date(dateField);
                    return campaignDate.toDateString() === date.toDateString();
                }).length;

                data.push({
                    name: dayName,
                    campaigns: Math.max(campaignsForDay, Math.floor(Math.random() * 3)),
                    messages: Math.floor(Math.random() * 50) + 10,
                    success: Math.floor(Math.random() * 80) + 20
                });
            }
        } else if (timeFrame === 'month') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const startDate = new Date(now);
                startDate.setDate(startDate.getDate() - (i + 1) * 7);
                const weekName = `Week ${4 - i}`;
                
                data.push({
                    name: weekName,
                    campaigns: Math.floor(Math.random() * 5) + 1,
                    messages: Math.floor(Math.random() * 200) + 50,
                    success: Math.floor(Math.random() * 90) + 10
                });
            }
        } else if (timeFrame === 'year') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                const monthName = date.toLocaleDateString('en', { month: 'short' });
                
                data.push({
                    name: monthName,
                    campaigns: Math.floor(Math.random() * 10) + 2,
                    messages: Math.floor(Math.random() * 500) + 100,
                    success: Math.floor(Math.random() * 95) + 5
                });
            }
        }

        return data;
    }, [campaigns]);

    // Update chart data when time frame changes
    useEffect(() => {
        setChartData(generateChartData(selectedTimeFrame));
    }, [selectedTimeFrame, generateChartData]);

    // Calculate dashboard stats
    useEffect(() => {
        const calculateStats = () => {
            console.log('Calculating stats with data:', {
                campaigns: campaigns.length,
                customers: customers.length,
                orders: orders.length,
                campaignsData: campaigns,
                customersData: customers,
                ordersData: orders
            });

            const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || order.amount || 0), 0);
            const messagesSent = campaigns.reduce((sum, campaign) => 
                sum + (campaign.sent_count || campaign.sentCount || 0), 0
            );
            const totalMessages = campaigns.reduce((sum, campaign) => 
                sum + (campaign.sent_count || campaign.sentCount || 0) + (campaign.failed_count || campaign.failedCount || 0), 0
            );
            const successRate = totalMessages > 0 ? (messagesSent / totalMessages) * 100 : 0;
            const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

            const newStats = {
                totalCampaigns: campaigns.length,
                totalCustomers: customers.length,
                totalOrders: orders.length,
                totalRevenue,
                messagesSent,
                successRate,
                avgOrderValue,
                monthlyGrowth: 12.5 // Mock data for now
            };

            console.log('New dashboard stats:', newStats);
            setDashboardStats(newStats);
        };

        // If no data loaded, show some sample data for demonstration
        if (!isLoadingData && campaigns.length === 0 && customers.length === 0 && orders.length === 0) {
            
        } else if (!isLoadingData) {
            calculateStats();
        }
    }, [campaigns, customers, orders, isLoadingData]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Navigation */}
            <div className="w-64 hidden md:block">
                <Navigation />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg z-10">
                    <div className="px-6 lg:px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        Dashboard
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}! Here&apos;s your CRM overview</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/campaigns/new"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    New Campaign
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {/* Summary cards - Only essential metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalCampaigns}</p>
                                   
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Campaigns</h3>
                            <p className="text-xs text-gray-500 mt-2">Active campaigns in your CRM</p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.messagesSent.toLocaleString()}</p>
                                   
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Messages Sent</h3>
                            <p className="text-xs text-gray-500 mt-2">Total outbound messages</p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalOrders}</p>
                                  
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Orders</h3>
                            <p className="text-xs text-gray-500 mt-2">Orders processed</p>
                        </div>

                        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalCustomers}</p>
                                  
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Customers</h3>
                            <p className="text-xs text-gray-500 mt-2">Registered customers</p>
                        </div>
                    </div>

                    {/* Campaign Analytics Chart */}
                    <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-8 mb-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Campaign Analytics</h2>
                                <p className="text-sm text-gray-500 mt-1">Performance trends over time</p>
                            </div>
                            <div className="flex space-x-2">
                                {(['week', 'month', 'year'] as const).map((timeFrame) => (
                                    <button
                                        key={timeFrame}
                                        onClick={() => setSelectedTimeFrame(timeFrame)}
                                        className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                                            selectedTimeFrame === timeFrame
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#666" 
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#666" 
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="campaigns" 
                                        stroke="#3B82F6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                                        activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                                        name="Campaigns"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="messages" 
                                        stroke="#8B5CF6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                                        activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                                        name="Messages"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="success" 
                                        stroke="#10B981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                                        activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                                        name="Success Rate %"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Campaigns */}
                        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-200/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Recent Campaigns</h2>
                                        <p className="text-sm text-gray-500 mt-1">Latest campaign activities</p>
                                    </div>
                                    <Link
                                        href="/campaigns"
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        View All
                                    </Link>
                                </div>
                            </div>

                            {isLoadingCampaigns ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </div>
                            ) : campaigns.length > 0 ? (
                                <div className="divide-y divide-gray-200/50">
                                    {campaigns.slice(0, 4).map((campaign: Campaign) => (
                                        <div key={campaign.id} className="px-8 py-4 hover:bg-white/40 transition-colors duration-150">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                                                        {campaign.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">{campaign.name}</h3>
                                                        <div className="flex items-center mt-1 space-x-3">
                                                            <span
                                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-lg ${campaign.status === 'completed'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : campaign.status === 'sending'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : campaign.status === 'failed'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                                    }`}
                                                            >
                                                                {campaign.status}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {campaign.sent_count || campaign.sentCount || 0} sent
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/campaigns/${campaign.id}`}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-500">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium">No campaigns yet</p>
                                    <p className="text-sm text-gray-500 mt-1">Create your first campaign to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Main Dashboard component with Suspense boundary
export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
