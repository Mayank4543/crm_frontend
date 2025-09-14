'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import NewCampaignModal from '@/components/new-campaign-modal';
import Link from 'next/link';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiUsers, FiSend, FiBarChart, FiCalendar, FiTarget } from 'react-icons/fi';

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
    created_by?: string;
    segment_id?: string;
    ai_summary?: string;
}

// Campaigns list page
export default function CampaignsList() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const apiClient = useApiClient();
        const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);

    const fetchCampaigns = useCallback(async () => {
        try {
            setIsLoadingCampaigns(true);
            setError(null);
            const response = await apiClient.campaigns.getCampaigns(1, 50);
            console.log('Campaigns response:', response);

            // Handle the API response structure
            if (response.success && response.data) {
                setCampaigns(response.data || []);
            } else if (response.data) {
                setCampaigns(response.data || []);
            } else {
                setCampaigns([]);
            }
        } catch (err: unknown) {
            console.error('Error fetching campaigns:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
            setError(errorMessage);
            setCampaigns([]);
        } finally {
            setIsLoadingCampaigns(false);
        }
    }, [apiClient.campaigns]);

    // Handle creating lookalike audience (commented out as unused)
    // const handleCreateLookalike = async (campaignId: string) => {
    //     try {
    //         const response = await apiClient.ai.getLookalikeAudience(campaignId);

    //         if (response.data?.rules) {
    //             // Navigate to create campaign page with lookalike data
    //             router.push(`/campaigns/new?lookalike=${campaignId}`);
    //         } else {
    //             alert('Unable to generate lookalike audience for this campaign');
    //         }
    //     } catch (error) {
    //         console.error('Error creating lookalike audience:', error);
    //         alert('Failed to create lookalike audience');
    //     }
    // };

    const handleEditCampaign = (campaign: Campaign) => {
        router.push(`/campaigns/${campaign.id}/edit`);
    };

    const handleDeleteCampaign = async (campaign: Campaign) => {
        if (!confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) return;

        try {
            await apiClient.campaigns.deleteCampaign(campaign.id);
            
            // Show success message
            alert('Campaign deleted successfully');
            
            // Refresh the campaigns list
            await fetchCampaigns();
        } catch (error: unknown) {
            console.error('Error deleting campaign:', error);
            
            // Show specific error message
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
            if (errorMessage.includes('Cannot delete campaign while')) {
                alert('Cannot delete campaign while it\'s being processed. Please wait for it to complete.');
            } else {
                alert(errorMessage);
            }
        }
    };

    // Execute campaign
    const handleExecuteCampaign = async (campaign: Campaign) => {
        const actionText = campaign.status === 'completed' ? 're-send' : 'send';
        const confirmMessage = `Are you sure you want to ${actionText} emails for "${campaign.name}"? This will ${actionText} personalized emails to all customers in the target segment.`;
        
        if (!confirm(confirmMessage)) return;

        try {
            setIsLoadingCampaigns(true);
            const response = await apiClient.campaigns.executeCampaign(campaign.id);
            
            if (response.success) {
                alert(`Emails ${actionText === 're-send' ? 're-sent' : 'sent'} successfully!\nSent: ${response.data.sent}\nFailed: ${response.data.failed}\nTotal: ${response.data.total}`);
                // Refresh campaigns to update status
                await fetchCampaigns();
            }
        } catch (error: unknown) {
            console.error('Error executing campaign:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send emails';
            alert(errorMessage);
        } finally {
            setIsLoadingCampaigns(false);
        }
    };



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'processing':
            case 'sending':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'failed':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'pending':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const getAudienceSize = (campaign: Campaign) => {
        return campaign.audienceSize || campaign.audience_size || 0;
    };

    const getSentCount = (campaign: Campaign) => {
        return campaign.sentCount || campaign.sent_count || 0;
    };

    const getFailedCount = (campaign: Campaign) => {
        return campaign.failedCount || campaign.failed_count || 0;
    };

    const getCreatedDate = (campaign: Campaign) => {
        return campaign.createdAt || campaign.created_at || '';
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch campaigns
    useEffect(() => {
        if (isAuthenticated) {
            fetchCampaigns();
        }
    }, [isAuthenticated, fetchCampaigns]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
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
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Campaigns
                            </h1>
                            <p className="text-gray-400 mt-2">Create and manage your marketing campaigns</p>
                        </div>
                        <button
                            onClick={() => setShowNewCampaignModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl"
                        >
                            <FiPlus size={20} />
                            <span>Create Campaign</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FiTarget className="text-white" size={24} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                            <p className="text-sm text-gray-400">Total Campaigns</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FiUsers className="text-white" size={24} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {campaigns.reduce((sum, campaign) => sum + getAudienceSize(campaign), 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400">Total Reach</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FiSend className="text-white" size={24} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {campaigns.reduce((sum, campaign) => sum + getSentCount(campaign), 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400">Messages Sent</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FiBarChart className="text-white" size={24} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {campaigns.length > 0
                                    ? Math.round(
                                        (campaigns.reduce((sum, campaign) => sum + getSentCount(campaign), 0) /
                                            campaigns.reduce(
                                                (sum, campaign) =>
                                                    sum + getSentCount(campaign) + getFailedCount(campaign),
                                                0
                                            )) *
                                        100
                                    ) || 0
                                    : 0}
                                %
                            </p>
                            <p className="text-sm text-gray-400">Success Rate</p>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoadingCampaigns ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                            <p className="text-red-400 mb-4">Error loading campaigns</p>
                            <p className="text-gray-400 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchCampaigns}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-xl">
                            <FiTarget size={64} className="mx-auto text-gray-500 mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">No campaigns found</h2>
                            <p className="text-gray-400 mb-6">Create your first campaign to get started</p>
                            <Link
                                href="/campaigns/new"
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 mx-auto transition-all duration-200"
                            >
                                <FiPlus size={20} />
                                <span>Create First Campaign</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-white/10 border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Campaign
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Audience
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Performance
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {campaigns.map((campaign: Campaign) => (
                                            <tr key={campaign.id} className="hover:bg-white/5 transition-colors duration-150">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                                                            {campaign.name?.charAt(0)?.toUpperCase() || 'C'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-white">
                                                                {campaign.name}
                                                            </div>
                                                            {campaign.tags && campaign.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {campaign.tags.slice(0, 2).map((tag: string, i: number) => (
                                                                        <span
                                                                            key={i}
                                                                            className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                    {campaign.tags.length > 2 && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                                                            +{campaign.tags.length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {campaign.ai_summary && (
                                                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                                                    {campaign.ai_summary}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(campaign.status)}`}>
                                                        {campaign.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center space-x-2">
                                                        <FiUsers size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-300">
                                                            {getAudienceSize(campaign).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-gray-300">
                                                            <span className="text-green-400">{getSentCount(campaign)} sent</span>
                                                            {getFailedCount(campaign) > 0 && (
                                                                <span className="text-red-400 ml-2">/ {getFailedCount(campaign)} failed</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {Math.round(
                                                                (getSentCount(campaign) / (getSentCount(campaign) + getFailedCount(campaign) || 1)) * 100
                                                            )}% success rate
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center space-x-2">
                                                        <FiCalendar size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-300">
                                                            {getCreatedDate(campaign) ? formatDate(getCreatedDate(campaign)) : 'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end space-x-2">
                                        {/* Execute/Retry button - show for all campaigns except processing/sending */}
                                        {!['processing', 'sending'].includes(campaign.status) && (
                                            <button
                                                onClick={() => handleExecuteCampaign(campaign)}
                                                className={`inline-flex items-center px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors duration-150 ${
                                                    campaign.status === 'failed' 
                                                        ? 'bg-orange-500 hover:bg-orange-600' 
                                                        : campaign.status === 'completed'
                                                        ? 'bg-blue-500 hover:bg-blue-600'
                                                        : 'bg-green-500 hover:bg-green-600'
                                                }`}
                                                title={
                                                    campaign.status === 'failed' 
                                                        ? 'Retry campaign execution' 
                                                        : campaign.status === 'completed'
                                                        ? 'Re-execute campaign'
                                                        : 'Execute campaign and send emails'
                                                }
                                            >
                                                <FiSend className="w-4 h-4 mr-1" />
                                                {campaign.status === 'failed' ? 'Retry' : campaign.status === 'completed' ? 'Re-Execute' : 'Execute'}
                                            </button>
                                        )}
                                                        
                                                        <Link
                                                            href={`/campaigns/${campaign.id}`}
                                                            className="inline-flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors duration-150"
                                                        >
                                                            <FiEye className="w-4 h-4 mr-1" />
                                                            View
                                                        </Link>
                                                        
                                        {/* Edit button - allow editing all campaigns */}
                                        <button
                                            className="inline-flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors duration-150"
                                            onClick={() => handleEditCampaign(campaign)}
                                            title={campaign.status !== 'draft' ? 'Edit executed campaign (limited options)' : 'Edit campaign'}
                                        >
                                            <FiEdit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                        
                                        {/* Delete button - allow deletion for all campaigns except processing */}
                                        <button
                                            className="inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleDeleteCampaign(campaign)}
                                            title={campaign.status === 'processing' ? 'Cannot delete running campaign' : 'Delete campaign'}
                                            disabled={campaign.status === 'processing'}
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Campaign Modal */}
                <NewCampaignModal
                    isOpen={showNewCampaignModal}
                    onClose={() => setShowNewCampaignModal(false)}
                    onSuccess={() => {
                        setShowNewCampaignModal(false);
                        fetchCampaigns(); // Refresh the campaigns list
                    }}
                />
            </div>
        </div>
    );
}
