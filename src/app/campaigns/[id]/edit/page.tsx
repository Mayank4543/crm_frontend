'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import { FiSave, FiArrowLeft, FiLoader, FiUsers, FiMessageSquare, FiTag } from 'react-icons/fi';

// Segment interface
interface Segment {
    id: string;
    name: string;
    rules: Record<string, unknown>;
    customer_count?: number;
}

// Campaign interface
interface Campaign {
    id: string;
    name: string;
    segment_id: string;
    message_template: string;
    ai_summary?: string;
    tags?: string[];
    status: string;
    audience_size?: number;
}

export default function EditCampaignPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const apiClient = useApiClient();
    const campaignId = params.id as string;

    // Form state
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audienceSize, setAudienceSize] = useState(0);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        segmentId: '',
        messageTemplate: '',
        objective: '',
        status: 'draft',
        tags: [] as string[]
    });

    // Tag input
    const [tagInput, setTagInput] = useState('');

    // Fetch campaign data
    const fetchCampaign = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.campaigns.getCampaignById(campaignId);
            
            if (response.success && response.data) {
                const campaignData = response.data;
                setCampaign(campaignData);
                setFormData({
                    name: campaignData.name || '',
                    segmentId: campaignData.segment_id || '',
                    messageTemplate: campaignData.message_template || '',
                    objective: campaignData.ai_summary || '',
                    status: campaignData.status || 'draft',
                    tags: campaignData.tags || []
                });
                setAudienceSize(campaignData.audience_size || 0);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaign';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [apiClient.campaigns, campaignId]);

    // Fetch segments
    const fetchSegments = useCallback(async () => {
        try {
            const response = await apiClient.segments.getSegments(1, 100);
            if (response.success && response.data) {
                setSegments(response.data);
            }
        } catch (err) {
            console.error('Error fetching segments:', err);
        }
    }, [apiClient.segments]);

    // Generate message suggestions
    const generateSuggestions = useCallback(async () => {
        if (!formData.segmentId || !formData.objective) return;

        try {
            setIsLoadingSuggestions(true);
            const response = await apiClient.campaigns.getCampaignSuggestions(
                formData.segmentId,
                formData.objective
            );

            if (response.success && response.data) {
                setSuggestions(response.data);
            }
        } catch (err) {
            console.error('Error generating suggestions:', err);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [apiClient.campaigns, formData.segmentId, formData.objective]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.segmentId || !formData.messageTemplate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            const response = await apiClient.campaigns.updateCampaign(campaignId, formData);
            
            if (response.success) {
                // Show success message
                alert('Campaign updated successfully!');
                
                // If status was changed, refetch campaign data to reflect changes
                await fetchCampaign();
                
                // Navigate back to campaigns list
                router.push('/campaigns');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle tag addition
    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    // Handle tag removal
    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // Handle suggestion selection
    const selectSuggestion = (suggestion: string) => {
        setFormData(prev => ({
            ...prev,
            messageTemplate: suggestion
        }));
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch data when component mounts
    useEffect(() => {
        if (isAuthenticated && campaignId) {
            fetchCampaign();
            fetchSegments();
        }
    }, [isAuthenticated, campaignId, fetchCampaign, fetchSegments]);

    // Generate suggestions when segment or objective changes
    useEffect(() => {
        if (formData.segmentId && formData.objective) {
            generateSuggestions();
        }
    }, [formData.segmentId, formData.objective, generateSuggestions]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="w-64 hidden md:block">
                    <Navigation />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                </div>
            </div>
        );
    }

    if (error && !campaign) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="w-64 hidden md:block">
                    <Navigation />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md">
                        <p className="text-red-400 mb-4">Error loading campaign</p>
                        <p className="text-gray-400 text-sm mb-4">{error}</p>
                        <button
                            onClick={() => router.push('/campaigns')}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Allow editing all campaigns (just show warning for executed campaigns)
    const canEdit = true;
    const isExecutedCampaign = campaign && !['draft', 'pending'].includes(campaign.status);

    if (!canEdit) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="w-64 hidden md:block">
                    <Navigation />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center max-w-md">
                        <p className="text-yellow-400 mb-4">Cannot Edit Campaign</p>
                        <p className="text-gray-400 text-sm mb-4">
                            Campaign cannot be edited in &apos;{campaign?.status}&apos; status
                        </p>
                        <button
                            onClick={() => router.push('/campaigns')}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
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
                {/* Header */}
                <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-xl">
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => router.push('/campaigns')}
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors duration-200"
                                >
                                    <FiArrowLeft size={20} className="text-gray-400" />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        Edit Campaign
                                    </h1>
                                    <p className="text-gray-400 mt-1">Update your campaign details</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                    <FiUsers size={16} className="text-gray-400" />
                                    <span className="text-gray-300 text-sm">{audienceSize.toLocaleString()} audience</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Warning for executed campaigns */}
                        {isExecutedCampaign && (
                            <div className="mb-6 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-yellow-400">
                                            Executed Campaign
                                        </h3>
                                        <p className="text-yellow-300 mt-1">
                                            This campaign has been executed. Changes will apply for future reference only.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campaign Name */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Campaign Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter campaign name..."
                                    required
                                />
                            </div>

                            {/* Segment Selection */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Target Segment *
                                </label>
                                <select
                                    value={formData.segmentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, segmentId: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a segment...</option>
                                    {segments.map((segment) => (
                                        <option key={segment.id} value={segment.id} className="bg-gray-800">
                                            {segment.name} ({segment.customer_count || 0} customers)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Campaign Objective */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Campaign Objective
                                </label>
                                <input
                                    type="text"
                                    value={formData.objective}
                                    onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Flash Sale, Welcome Offer, Holiday Special..."
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    This helps generate better message suggestions
                                </p>
                            </div>

                            {/* Campaign Status */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Campaign Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="draft" className="bg-gray-800">Draft</option>
                                    <option value="pending" className="bg-gray-800">Pending</option>
                                    <option value="processing" className="bg-gray-800">Processing</option>
                                    <option value="completed" className="bg-gray-800">Completed</option>
                                    <option value="failed" className="bg-gray-800">Failed</option>
                                    <option value="paused" className="bg-gray-800">Paused</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-2">
                                    Control campaign visibility and execution state
                                </p>
                            </div>

                            {/* Message Template */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-300">
                                        Message Template *
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <FiMessageSquare size={16} className="text-gray-400" />
                                        <span className="text-xs text-gray-400">
                                            {formData.messageTemplate.length}/160 characters
                                        </span>
                                    </div>
                                </div>
                                <textarea
                                    value={formData.messageTemplate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, messageTemplate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    maxLength={160}
                                    placeholder="Enter your message template..."
                                    required
                                />

                                {/* AI Suggestions */}
                                {(suggestions.length > 0 || isLoadingSuggestions) && (
                                    <div className="mt-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="text-sm font-medium text-gray-300">AI Suggestions</span>
                                            {isLoadingSuggestions && (
                                                <FiLoader size={14} className="text-blue-400 animate-spin" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {suggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => selectSuggestion(suggestion)}
                                                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors duration-150"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm"
                                        >
                                            <FiTag size={12} className="mr-1" />
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-blue-300 hover:text-blue-100"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add a tag..."
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/campaigns')}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <FiLoader size={20} className="animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiSave size={20} />
                                            <span>Update Campaign</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
