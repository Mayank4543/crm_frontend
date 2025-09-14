'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';

interface CampaignDetails {
    id: string;
    name: string;
    status: string;
    audience_size?: number;
    audienceSize?: number;
    sent_count?: number;
    sentCount?: number;
    failed_count?: number;
    failedCount?: number;
    created_at?: string;
    createdAt?: string;
    tags?: string[];
    message_template?: string;
    segment_id?: string;
    ai_summary?: string;
}

// Helper functions to handle field name variations
const getAudienceSize = (campaign: CampaignDetails) => {
    return campaign.audience_size || campaign.audienceSize || 0;
};

const getSentCount = (campaign: CampaignDetails) => {
    return campaign.sent_count || campaign.sentCount || 0;
};

const getCreatedAt = (campaign: CampaignDetails) => {
    return campaign.created_at || campaign.createdAt || '';
};

export default function CampaignDetails({ params }: { params: { id: string } }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const api = useApiClient();
    const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
    const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);

    // Fetch campaign details
    useEffect(() => {
        if (isAuthenticated) {
            const fetchCampaign = async () => {
                try {
                    setIsLoadingCampaign(true);
                    const response = await api.campaigns.getCampaignById(params.id);

                    if (response.success && response.data) {
                        setCampaign(response.data);
                    } else {
                        router.push('/campaigns');
                    }
                } catch (error) {
                    console.error('Error fetching campaign:', error);
                    router.push('/campaigns');
                } finally {
                    setIsLoadingCampaign(false);
                }
            };

            fetchCampaign();
        }
    }, [isAuthenticated, api, params.id, router]);

    if (isLoading || !isAuthenticated || isLoadingCampaign) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Navigation */}
            <div className="w-64 hidden md:block">
                <Navigation />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm z-10">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-medium text-gray-900">{campaign.name}</h1>
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${campaign.status === 'completed'
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
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* AI Summary */}
                        {campaign.ai_summary && (
                            <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mb-8">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-6 w-6 text-violet-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-violet-900">Campaign Insights</h3>
                                        <p className="mt-1 text-sm text-violet-700">{campaign.ai_summary}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-6 w-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Audience Size</dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {getAudienceSize(campaign).toLocaleString()}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-6 w-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Delivery Success
                                                </dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {getSentCount(campaign)} / {getAudienceSize(campaign)}
                                                    </div>
                                                    <div className="ml-2">
                                                        <span
                                                            className={`text-sm font-medium ${(getSentCount(campaign) / getAudienceSize(campaign)) * 100 >= 90
                                                                ? 'text-green-600'
                                                                : 'text-yellow-600'
                                                                }`}
                                                        >
                                                            (
                                                            {Math.round(
                                                                (getSentCount(campaign) / (getAudienceSize(campaign) || 1)) * 100
                                                            )}
                                                            %)
                                                        </span>
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-6 w-6 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">Created</dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {getCreatedAt(campaign) ? new Date(getCreatedAt(campaign)).toLocaleDateString() : 'Unknown'}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message Preview */}
                        <div className="bg-white shadow rounded-lg p-6 mb-8">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Message Template</h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{campaign.message_template}</p>
                            </div>
                        </div>

                        {/* Tags */}
                        {campaign.tags && campaign.tags.length > 0 && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Tags</h2>
                                <div className="flex flex-wrap gap-2">
                                    {campaign.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-violet-100 text-violet-800"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
