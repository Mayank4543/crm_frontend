'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '@/utils/api-client';
import RuleBuilder, { Rule } from '@/components/rule-builder';

interface NewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function NewCampaignModal({ isOpen, onClose, onSuccess }: NewCampaignModalProps) {
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

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setName('');
            setNaturalLanguage('');
            setRules({
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
            setAudienceSize(null);
            setMessageTemplate('');
            setObjective('');
            setMessageSuggestions([]);
            setLookalikeData(null);
            setSegmentId('');
            setError('');
        }
    }, [isOpen]);

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
        } catch (error) {
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
                if (response.data.rules) {
                    setRules(response.data.rules);
                    handlePreviewAudience(response.data.rules);
                }
            }
        } catch (error: unknown) {
            console.error('Error generating lookalike audience:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate lookalike audience');
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
                // Save segment first
                const segmentResponse = await api.segments.createSegment({
                    name: `${name} Segment`,
                    rules,
                    description: naturalLanguage || undefined,
                });

                if (segmentResponse.data?.id) {
                    setSegmentId(segmentResponse.data.id);
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
                    onSuccess?.();
                    onClose();
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setError('Failed to create campaign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Create New Campaign</h2>
                            <p className="text-blue-100 mt-1">
                                {step === 1 ? 'Define your target audience' : 'Craft your message'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-6">
                        <div className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                    step >= 1 ? 'bg-white text-purple-600 border-white' : 'border-white/30 text-white/60'
                                }`}
                            >
                                {step > 1 ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    '1'
                                )}
                            </div>
                            <div className={`flex-1 h-1 mx-4 rounded transition-all ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                    step >= 2 ? 'bg-white text-purple-600 border-white' : 'border-white/30 text-white/60'
                                }`}
                            >
                                2
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="text-white/90">Audience</span>
                            <span className="text-white/90">Message</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <form onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setError('')}
                                        className="ml-auto text-red-500 hover:text-red-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Define Audience */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* Campaign Name */}
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Campaign Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white/80 backdrop-blur-sm"
                                        placeholder="Enter campaign name"
                                        required
                                    />
                                </div>

                                {/* Natural Language Input */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        🤖 AI Audience Builder
                                    </label>
                                    <div className="flex space-x-3">
                                        <input
                                            type="text"
                                            value={naturalLanguage}
                                            onChange={(e) => setNaturalLanguage(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white/80 backdrop-blur-sm"
                                            placeholder="e.g., People who spent over ₹10,000 and haven't visited in 90 days"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleNaturalLanguageProcess}
                                            disabled={previewLoading || !naturalLanguage.trim()}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
                                        >
                                            {previewLoading ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                'Convert'
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Describe your audience in plain language, and our AI will create targeting rules
                                    </p>
                                </div>

                                {/* Rule Builder */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                        </svg>
                                        Advanced Targeting Rules
                                    </h3>
                                    <RuleBuilder
                                        value={rules}
                                        onChange={setRules}
                                        onPreview={handlePreviewAudience}
                                    />
                                </div>

                                {/* Audience Preview */}
                                {audienceSize !== null && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">Audience Size</h3>
                                                <p className="text-3xl font-bold text-green-600">
                                                    {audienceSize.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-slate-600">customers match your criteria</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lookalike Audience */}
                                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                                        🎯 AI Lookalike Audience
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Generate similar audiences based on your successful campaigns
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleGenerateLookalike}
                                        disabled={lookalikeLoading || !segmentId}
                                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
                                    >
                                        {lookalikeLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Generating...</span>
                                            </div>
                                        ) : (
                                            'Generate Lookalike Audience'
                                        )}
                                    </button>
                                    
                                    {lookalikeData && (
                                        <div className="mt-4 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-violet-200">
                                            <h4 className="font-semibold text-slate-800 mb-2">Lookalike Insights</h4>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-700">Avg Spend:</span>
                                                    <p className="text-violet-600 font-semibold">₹{lookalikeData.insights?.avgSpend || 0}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-700">Avg Visits:</span>
                                                    <p className="text-violet-600 font-semibold">{lookalikeData.insights?.avgVisits || 0}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-700">Quality Score:</span>
                                                    <p className="text-violet-600 font-semibold">High</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Create Message */}
                        {step === 2 && (
                            <div className="space-y-6">
                                {/* AI Assistant Info */}
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                                        ✨ AI Message Assistant
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                            <span className="text-slate-600">Smart message suggestions</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                            <span className="text-slate-600">Optimal send times</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                            <span className="text-slate-600">Personalized content</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Campaign Objective */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        🎯 Campaign Objective
                                    </label>
                                    <div className="flex space-x-3">
                                        <input
                                            type="text"
                                            value={objective}
                                            onChange={(e) => setObjective(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/80 backdrop-blur-sm"
                                            placeholder="e.g., win back inactive customers, promote new products"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGetMessageSuggestions}
                                            disabled={suggestionsLoading || !objective.trim()}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
                                        >
                                            {suggestionsLoading ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Generating...</span>
                                                </div>
                                            ) : (
                                                'Get AI Suggestions'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Message Suggestions */}
                                {messageSuggestions.length > 0 && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            AI-Generated Message Suggestions
                                        </h3>
                                        <div className="space-y-3">
                                            {messageSuggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelectSuggestion(suggestion)}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                                        messageTemplate === suggestion
                                                            ? 'border-green-400 bg-green-100/50 shadow-md'
                                                            : 'border-green-200 bg-white/70 hover:bg-green-50'
                                                    }`}
                                                >
                                                    <p className="text-slate-700">{suggestion}</p>
                                                    {messageTemplate === suggestion && (
                                                        <div className="mt-2 flex items-center text-green-600 text-sm">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Message Template */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        📝 Message Template *
                                    </label>
                                    <textarea
                                        value={messageTemplate}
                                        onChange={(e) => setMessageTemplate(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white/80 backdrop-blur-sm resize-none"
                                        placeholder="Hi {firstName}, here's a special offer just for you!"
                                        required
                                    />
                                    <p className="text-xs text-slate-600 mt-2">
                                        Use <code className="bg-purple-100 px-1 rounded">{'{firstName}'}</code>, <code className="bg-purple-100 px-1 rounded">{'{lastName}'}</code>, and <code className="bg-purple-100 px-1 rounded">{'{email}'}</code> as placeholders
                                    </p>
                                </div>

                                {/* Schedule Recommendation */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Recommended Send Time
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                                            <span className="font-medium text-slate-700">Best Day:</span>
                                            <span className="text-indigo-600 font-semibold">Thursday</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                                            <span className="font-medium text-slate-700">Best Time:</span>
                                            <span className="text-indigo-600 font-semibold">10:00 AM</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Based on your audience&apos;s activity patterns and engagement history
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
                            >
                                ← Back to Audience
                            </button>
                        )}
                        
                        <div className={step === 1 ? 'ml-auto' : ''}>
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    (step === 1 && (!name || rules.conditions.length === 0)) ||
                                    (step === 2 && !messageTemplate) ||
                                    isSubmitting
                                }
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Creating Campaign...</span>
                                    </div>
                                ) : step === 1 ? (
                                    'Continue to Message →'
                                ) : (
                                    '🚀 Launch Campaign'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
