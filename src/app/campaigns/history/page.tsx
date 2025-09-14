'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
// Using regular SVG icons instead of react-icons for better compatibility

// Campaign interface
interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed' | 'sending';
    audienceSize?: number;
    audience_size?: number;
    sentCount?: number;
    sent_count?: number;
    failedCount?: number;
    failed_count?: number;
    createdAt?: string;
    created_at?: string;
    tags?: string[];
    message_template?: string;
    ai_summary?: string;
}

// Campaign history page
export default function CampaignHistory() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const api = useApiClient();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch campaigns
    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.campaigns.getCampaigns();
            
            console.log('API Response:', response); // Debug log
            
            // Handle different response structures
            let campaignsData = [];
            if (response.data && response.data.data) {
                campaignsData = response.data.data;
            } else if (response.data && Array.isArray(response.data)) {
                campaignsData = response.data;
            } else if (response.data && response.data.campaigns) {
                campaignsData = response.data.campaigns;
            } else {
                console.error('Unexpected response structure:', response);
                throw new Error('Unexpected API response structure');
            }
            
            // Sort by most recent first
            const sortedCampaigns = campaignsData.sort((a: Campaign, b: Campaign) => {
                const dateA = new Date(a.created_at || a.createdAt || '');
                const dateB = new Date(b.created_at || b.createdAt || '');
                return dateB.getTime() - dateA.getTime();
            });
            
            setCampaigns(sortedCampaigns);
        } catch (error: unknown) {
            console.error('Error fetching campaigns:', error);
            setError('Failed to load campaign history');
        } finally {
            setLoading(false);
        }
    }, [api.campaigns]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCampaigns();
        }
    }, [isAuthenticated, fetchCampaigns]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'processing':
            case 'sending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getAudienceSize = (campaign: Campaign) => {
        return campaign.audience_size || campaign.audienceSize || 0;
    };

    const getSentCount = (campaign: Campaign) => {
        return campaign.sent_count || campaign.sentCount || 0;
    };

    const getFailedCount = (campaign: Campaign) => {
        return campaign.failed_count || campaign.failedCount || 0;
    };

    const getDeliveryRate = (campaign: Campaign) => {
        const audience = getAudienceSize(campaign);
        const sent = getSentCount(campaign);
        return audience > 0 ? Math.round((sent / audience) * 100) : 0;
    };

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
            {/* Navigation */}
            <div className="w-64 hidden md:block">
                <Navigation />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                {/* Header */}
                 <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 mb-8">
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Campaign History</h1>
                                <p className="text-gray-400 mt-2">
                                    Complete history of all your marketing campaigns
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/campaigns/new')}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl"
                            >
                                Create Campaign
                            </button>
                        </div>
                    </div>
                 </header>

                 {/* Content */}
                <div className="px-8">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-md mb-6">
                            {error}
                        </div>
                    )}

                    {campaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-slate-300">No campaign history</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Get started by creating your first campaign.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => router.push('/campaigns/new')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {campaigns.map((campaign) => (
                                <div 
                                    key={campaign.id} 
                                    className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-all duration-200"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {campaign.name}
                                                    </h3>
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(campaign.status)}`}>
                                                        {campaign.status}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm text-slate-400 mt-1">
                                                    Created {formatDate(campaign.created_at || campaign.createdAt || '')}
                                                </p>
                                                
                                                {campaign.ai_summary && (
                                                    <p className="text-sm text-slate-300 mt-2 bg-slate-700/30 p-3 rounded-md">
                                                        {campaign.ai_summary}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <button
                                                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                                className="ml-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary-light"
                                            >
                                                View Details
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="bg-slate-700/30 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                                    <span className="ml-2 text-sm font-medium text-slate-300">
                                                        Audience Size
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-white mt-1">
                                                    {getAudienceSize(campaign).toLocaleString()}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-slate-700/30 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                                    <span className="ml-2 text-sm font-medium text-slate-300">
                                                        Sent
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-green-400 mt-1">
                                                    {getSentCount(campaign).toLocaleString()}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-slate-700/30 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                                    <span className="ml-2 text-sm font-medium text-slate-300">
                                                        Failed
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-red-400 mt-1">
                                                    {getFailedCount(campaign).toLocaleString()}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-slate-700/30 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <span className="ml-2 text-sm font-medium text-slate-300">
                                                        Delivery Rate
                                                    </span>
                                                </div>
                                                <p className={`text-2xl font-bold mt-1 ${
                                                    getDeliveryRate(campaign) >= 90 
                                                        ? 'text-green-400' 
                                                        : getDeliveryRate(campaign) >= 70 
                                                            ? 'text-yellow-400' 
                                                            : 'text-red-400'
                                                }`}>
                                                    {getDeliveryRate(campaign)}%
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {campaign.tags && campaign.tags.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {campaign.tags.map((tag, index) => (
                                                    <span 
                                                        key={index}
                                                        className="px-2 py-1 text-xs font-medium text-slate-300 bg-slate-700/50 rounded-md"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
}
