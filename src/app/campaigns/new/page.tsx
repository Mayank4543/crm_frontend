'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import RuleBuilder, { Rule } from '@/components/rule-builder';

// Campaign creation page
export default function CreateCampaign() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const api = useApiClient();

    // Form state
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [naturalLanguage, setNaturalLanguage] = useState('');
    const [rules, setRules] = useState<Rule>({
        id: 'root',
        operator: 'AND',
        conditions: [
            {
                id: '1',
                field: 'total_spend',
                operation: 'greaterThan',
                value: 0,
            },
        ],
    });
    const [audienceSize, setAudienceSize] = useState<number | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState('');
    const [objective, setObjective] = useState('');
    const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [lookalikeLoading, setLookalikeLoading] = useState(false);
    const [lookalikeData, setLookalikeData] = useState<{rules: unknown; insights?: {avgSpend?: number; avgVisits?: number; recommendation?: string}} | null>(null);
    const [segmentId, setSegmentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [existingSegments, setExistingSegments] = useState<Array<{id: string; name: string; description?: string; audience_size?: number}>>([]);
    const [useExistingSegment, setUseExistingSegment] = useState(false);
    const [selectedExistingSegment, setSelectedExistingSegment] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch existing segments
    useEffect(() => {
        const fetchSegments = async () => {
            try {
                if (isAuthenticated) {
                    const response = await api.segments.getSegments(1, 50);
                    if (response.success && response.data) {
                        setExistingSegments(response.data);
                    }
                }
            } catch (error: unknown) {
                console.error('Error fetching segments:', error);
            }
        };
        fetchSegments();
    }, [isAuthenticated, api.segments]);

    // Handle natural language processing
    const handleNaturalLanguageProcess = async () => {
        if (!naturalLanguage.trim()) return;

        try {
            setPreviewLoading(true);
            setError('');
            const response = await api.ai.naturalLanguageToRules(naturalLanguage);

            if (response.data) {
                setRules(response.data);
                handlePreviewAudience(response.data);
            }
        } catch (error: unknown) {
            console.error('Error processing natural language:', error);
            setError('Failed to process natural language query. Please try again or build rules manually.');
        } finally {
            setPreviewLoading(false);
        }
    };

    // Handle audience preview
    const handlePreviewAudience = async (previewRules?: Rule) => {
        const rulesToPreview = previewRules || rules;

        try {
            setPreviewLoading(true);
            const response = await api.campaigns.previewCampaignAudience(rulesToPreview);

            setAudienceSize(response.data?.audienceSize || 0);
        } catch (error: unknown) {
            console.error('Error previewing audience:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Handle generating lookalike audience
    const handleGenerateLookalike = async () => {
        if (!segmentId) {
            alert('Please save your segment first to generate lookalike audience');
            return;
        }

        try {
            setLookalikeLoading(true);
            setError('');
            const response = await api.ai.getLookalikeAudience(segmentId);
            
            if (response.data) {
                setLookalikeData(response.data);
                // Optional: Update rules with lookalike suggestions
                if (response.data.rules) {
                    setRules(response.data.rules);
                    handlePreviewAudience(response.data.rules);
                }
            }
        } catch (error: unknown) {
            console.error('Error generating lookalike audience:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate lookalike audience';
            setError(errorMessage);
        } finally {
            setLookalikeLoading(false);
        }
    };

    // Handle message suggestions
    const handleGetMessageSuggestions = async () => {
        if (!objective.trim()) return;

        try {
            setSuggestionsLoading(true);
            setError('');
            const response = await api.ai.getMessageSuggestions(objective, {
                rules,
                audienceSize: audienceSize ?? undefined,
            });

            if (response.data) {
                setMessageSuggestions(response.data);
            }
        } catch (error: unknown) {
            console.error('Error getting message suggestions:', error);
            setError('Failed to generate message suggestions. Please try again or write your own message.');
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Handle selecting a message suggestion
    const handleSelectSuggestion = (suggestion: string) => {
        setMessageTemplate(suggestion);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (step === 1) {
                let finalSegmentId = '';
                
                if (useExistingSegment && selectedExistingSegment) {
                    // Use existing segment
                    finalSegmentId = selectedExistingSegment;
                } else {
                    // Create new segment
                    const segmentResponse = await api.segments.createSegment({
                        name: `${name} Segment`,
                        rules,
                        description: naturalLanguage || undefined,
                    });
                    
                    if (segmentResponse.data?.id) {
                        finalSegmentId = segmentResponse.data.id;
                    }
                }
                
                if (finalSegmentId) {
                    setSegmentId(finalSegmentId);
                    setStep(2);
                }
            } else if (step === 2) {
                // Create campaign
                setIsSubmitting(true);
                const campaignResponse = await api.campaigns.createCampaign({
                    name,
                    segmentId,
                    messageTemplate,
                    objective: objective || undefined,
                });

                if (campaignResponse.success) {
                    router.push('/campaigns');
                }
            }
        } catch (error: unknown) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isAuthenticated) {
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
                {/* Header */}
                <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-xl">
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Create Campaign
                                </h1>
                                <p className="text-gray-400 mt-1">Design your next successful marketing campaign</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-sm font-medium">AI Powered</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Progress indicator */}
                        <div className="mb-8">
                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                                                step >= 1 
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-110' 
                                                    : 'bg-white/10 text-gray-400 backdrop-blur-sm border border-white/20'
                                            }`}
                                        >
                                            {step > 1 ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className="font-bold">1</span>
                                            )}
                                            {step >= 1 && (
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-25"></div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <p className={`text-sm font-medium ${step >= 1 ? 'text-white' : 'text-gray-400'}`}>
                                                Define Audience
                                            </p>
                                            <p className="text-xs text-gray-500">Target your customers</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`flex-1 h-0.5 mx-8 transition-all duration-500 ${
                                        step >= 2 
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                                            : 'bg-white/20'
                                    }`}>
                                        <div className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ${
                                            step >= 2 ? 'w-full' : 'w-0'
                                        }`}></div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <div
                                            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                                                step >= 2 
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-110' 
                                                    : 'bg-white/10 text-gray-400 backdrop-blur-sm border border-white/20'
                                            }`}
                                        >
                                            {step > 2 ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className="font-bold">2</span>
                                            )}
                                            {step >= 2 && (
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-25"></div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <p className={`text-sm font-medium ${step >= 2 ? 'text-white' : 'text-gray-400'}`}>
                                                Create Message
                                            </p>
                                            <p className="text-xs text-gray-500">Craft your content</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-red-300 font-medium">{error}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setError('')}
                                            className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Define Audience */}
                            {step === 1 && (
                                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center">
                                            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h2 className="text-2xl font-bold text-white">Define Your Audience</h2>
                                                <p className="text-gray-400">Create targeted campaigns with AI-powered audience builder</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-green-400 text-sm font-medium">AI Powered</span>
                                        </div>
                                    </div>

                    {/* Campaign Name */}
                    <div className="mb-8">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-3">
                            Campaign Name
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                                placeholder="Enter campaign name"
                                required
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                        </div>
                    </div>

                    {/* Segment Selection Option */}
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white ml-3">Choose Segment</h3>
                        </div>
                        
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                            <div className="flex space-x-4 mb-4">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="segmentChoice"
                                        checked={!useExistingSegment}
                                        onChange={() => setUseExistingSegment(false)}
                                        className="w-4 h-4 text-blue-500 bg-transparent border-2 border-gray-400 focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="ml-3 text-white font-medium group-hover:text-blue-300 transition-colors">
                                        Create New Segment
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="segmentChoice"
                                        checked={useExistingSegment}
                                        onChange={() => setUseExistingSegment(true)}
                                        className="w-4 h-4 text-blue-500 bg-transparent border-2 border-gray-400 focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="ml-3 text-white font-medium group-hover:text-blue-300 transition-colors">
                                        Use Existing Segment
                                    </span>
                                </label>
                            </div>
                            
                            {useExistingSegment && (
                                <div className="relative group">
                                    <select
                                        value={selectedExistingSegment}
                                        onChange={(e) => setSelectedExistingSegment(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                                        required={useExistingSegment}
                                    >
                                        <option value="" className="bg-gray-800 text-gray-300">Select a segment...</option>
                                        {existingSegments.map((segment) => (
                                            <option key={segment.id} value={segment.id} className="bg-gray-800 text-white">
                                                {segment.name} ({segment.audience_size || 0} customers)
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                                </div>
                            )}
                        </div>
                    </div>                                    {/* AI Natural Language Input */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white ml-3">AI Audience Builder</h3>
                                        </div>
                                        
                                        <label htmlFor="naturalLanguage" className="block text-sm font-medium text-gray-300 mb-3">
                                            Describe Your Target Audience
                                        </label>
                                        <div className="flex space-x-3 mb-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    type="text"
                                                    id="naturalLanguage"
                                                    value={naturalLanguage}
                                                    onChange={(e) => setNaturalLanguage(e.target.value)}
                                                    placeholder="e.g., People who spent over ₹10,000 and haven't visited in 90 days"
                                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleNaturalLanguageProcess}
                                                disabled={previewLoading}
                                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {previewLoading ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                                        </svg>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    'Convert'
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Enter a description of your audience in plain language, and we&apos;ll convert it to precise targeting rules.
                                        </p>
                                    </div>

                                    {/* Advanced Rule Builder */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white ml-3">Advanced Rule Builder</h3>
                                        </div>
                                        
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                            <RuleBuilder
                                                value={rules}
                                                onChange={setRules}
                                                onPreview={handlePreviewAudience}
                                            />
                                        </div>
                                    </div>

                                    {/* Audience preview */}
                                    {audienceSize !== null && (
                                        <div className="mb-8">
                                            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-500/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <h4 className="text-lg font-bold text-white">Audience Preview</h4>
                                                            <p className="text-cyan-300">Real-time audience size</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-bold text-white">
                                                            {audienceSize.toLocaleString()}
                                                        </p>
                                                        <p className="text-cyan-300 text-sm">customers match</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lookalike Audience Section */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-lg font-bold text-white">🎯 AI Lookalike Audience</h4>
                                                <p className="text-gray-400">Generate similar audiences based on successful campaigns</p>
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={handleGenerateLookalike}
                                            disabled={lookalikeLoading || !segmentId}
                                            className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {lookalikeLoading ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                                    </svg>
                                                    Generating Lookalike Audience...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Generate Lookalike Audience
                                                </div>
                                            )}
                                        </button>
                                        
                                        {lookalikeData && (
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                                <h5 className="text-lg font-bold text-white mb-4 flex items-center">
                                                    <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                    Lookalike Insights
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                                        <p className="text-gray-400 mb-1">Average Spend</p>
                                                        <p className="text-xl font-bold text-white">₹{lookalikeData.insights?.avgSpend || 0}</p>
                                                    </div>
                                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                                        <p className="text-gray-400 mb-1">Average Visits</p>
                                                        <p className="text-xl font-bold text-white">{lookalikeData.insights?.avgVisits || 0}</p>
                                                    </div>
                                                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                                        <p className="text-gray-400 mb-1">AI Recommendation</p>
                                                        <p className="text-white font-medium text-sm">{lookalikeData.insights?.recommendation || 'Similar customer profile generated'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="flex justify-end pt-6 border-t border-white/10">
                                        <button
                                            type="submit"
                                            disabled={!name || rules.conditions.length === 0}
                                            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <div className="flex items-center">
                                                <span className="mr-2">Continue to Message</span>
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Create Message */}
                            {step === 2 && (
                                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center">
                                            <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h2 className="text-2xl font-bold text-white">Create Your Message</h2>
                                                <p className="text-gray-400">Craft compelling content with AI assistance</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                                            <span className="text-violet-400 text-sm font-medium">AI Powered</span>
                                        </div>
                                    </div>

                                    {/* AI assistance info */}
                                    <div className="mb-8">
                                        <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl p-6 border border-violet-500/30">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                AI Message Assistant Features
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center text-violet-200">
                                                    <svg className="w-4 h-4 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Smart message suggestions
                                                </div>
                                                <div className="flex items-center text-violet-200">
                                                    <svg className="w-4 h-4 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Optimal send times
                                                </div>
                                                <div className="flex items-center text-violet-200">
                                                    <svg className="w-4 h-4 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Personalized content
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign objective */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white ml-3">Campaign Objective</h3>
                                        </div>

                                        <label htmlFor="objective" className="block text-sm font-medium text-gray-300 mb-3">
                                            Campaign Objective
                                        </label>
                                        <div className="flex space-x-3 mb-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    type="text"
                                                    id="objective"
                                                    value={objective}
                                                    onChange={(e) => setObjective(e.target.value)}
                                                    placeholder="e.g., win back inactive customers, promote new products"
                                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleGetMessageSuggestions}
                                                disabled={suggestionsLoading}
                                                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {suggestionsLoading ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                                        </svg>
                                                        Generating...
                                                    </div>
                                                ) : (
                                                    'Get Suggestions'
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Tell us what you want to achieve with this campaign, and we&apos;ll suggest personalized messages.
                                        </p>
                                    </div>

                                    {/* Message suggestions */}
                                    {messageSuggestions.length > 0 && (
                                        <div className="mb-8">
                                            <div className="flex items-center mb-4">
                                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-white ml-3">AI-Generated Message Suggestions</h3>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {messageSuggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleSelectSuggestion(suggestion)}
                                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                                            messageTemplate === suggestion
                                                                ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg'
                                                                : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                messageTemplate === suggestion 
                                                                    ? 'bg-emerald-500 text-white' 
                                                                    : 'bg-white/20 text-gray-400'
                                                            }`}>
                                                                {messageTemplate === suggestion ? '✓' : index + 1}
                                                            </div>
                                                            <p className="text-white font-medium leading-relaxed">{suggestion}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Message template */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white ml-3">Message Template</h3>
                                        </div>

                                        <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-300 mb-3">
                                            Message Content
                                        </label>
                                        <div className="relative group">
                                            <textarea
                                                id="messageTemplate"
                                                value={messageTemplate}
                                                onChange={(e) => setMessageTemplate(e.target.value)}
                                                rows={4}
                                                placeholder="Hi {firstName}, here's a special offer just for you!"
                                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
                                                required
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-400 flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Use {'{firstName}'}, {'{lastName}'}, and {'{email}'} as placeholders for customer data.
                                        </p>
                                    </div>

                                    {/* Schedule suggestions */}
                                    {segmentId && (
                                        <div className="mb-8">
                                            <div className="flex items-center mb-4">
                                                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-white ml-3">Recommended Send Time</h3>
                                            </div>
                                            
                                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
                                                <div className="flex items-start space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-lg font-bold text-white mb-2">
                                                            Best time to send
                                                        </p>
                                                        <p className="text-gray-300">
                                                            Based on your audience&apos;s activity patterns, we recommend sending on{" "}
                                                            <span className="font-bold text-amber-300">Thursday at 10:00 AM</span>
                                                        </p>
                                                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-400">
                                                            <div className="flex items-center">
                                                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                                                <span>High engagement window</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                                                                <span>AI analyzed</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation buttons */}
                                    <div className="flex justify-between pt-6 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="group px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                                </svg>
                                                Back
                                            </div>
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!messageTemplate || isSubmitting}
                                            className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <div className="flex items-center">
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                                        </svg>
                                                        Creating Campaign...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="mr-2">Create Campaign</span>
                                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
