'use client';

import { useState, useEffect } from 'react';
import SegmentRuleBuilder from './segment-rule-builder';

interface SegmentData {
    name: string;
    description?: string;
    rules?: SegmentRules;
    is_dynamic?: boolean;
    tags?: string[];
}

interface Segment {
    id: string;
    name?: string;
    description?: string;
    is_dynamic?: boolean;
    tags?: string[];
    rules?: SegmentRules;
    audience_size?: number;
}

interface EditSegmentModalProps {
    isOpen: boolean;
    segment: Segment | null;
    onClose: () => void;
    onSegmentUpdated: () => void;
    apiClient: {
        segments: {
            previewAudience: (segmentId: string | null, rules: SegmentRules) => Promise<{ total?: number; count?: number; }>;
            updateSegment: (id: string, segmentData: Partial<SegmentData>) => Promise<unknown>;
        };
    };
}

interface Rule {
    field: string;
    operator: string;
    value: string | number | [string | number, string | number];
}

interface SegmentRules {
    logic: 'AND' | 'OR';
    conditions: Rule[];
}

const AVAILABLE_TAGS = [
    'High Value',
    'Loyal Customer',
    'New Customer',
    'At Risk',
    'VIP',
    'Frequent Buyer',
    'Inactive',
    'Potential Upsell',
    'Budget Conscious',
    'Premium'
];

export default function EditSegmentModal({ isOpen, segment, onClose, onSegmentUpdated, apiClient }: EditSegmentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_dynamic: true,
        tags: [] as string[]
    });
    
    const [rules, setRules] = useState<SegmentRules>({
        logic: 'AND',
        conditions: [
            { field: 'total_spend', operator: '>', value: 0 }
        ]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [audienceSize, setAudienceSize] = useState<number | null>(null);
    const [error, setError] = useState('');

    // Initialize form data when segment changes
    useEffect(() => {
        if (isOpen && segment) {
            setFormData({
                name: segment.name || '',
                description: segment.description || '',
                is_dynamic: segment.is_dynamic !== undefined ? segment.is_dynamic : true,
                tags: Array.isArray(segment.tags) ? segment.tags : []
            });
            
            // Initialize rules from segment
            if (segment.rules && segment.rules.conditions) {
                setRules(segment.rules);
            } else {
                setRules({
                    logic: 'AND',
                    conditions: [
                        { field: 'total_spend', operator: '>', value: 0 }
                    ]
                });
            }
            
            setAudienceSize(segment.audience_size || null);
            setError('');
        }
    }, [isOpen, segment]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Preview audience size
    const handlePreviewAudience = async () => {
        setIsPreviewLoading(true);
        setError('');

        try {
            const response = await apiClient.segments.previewAudience(null, rules);
            setAudienceSize(response.total || response.count || 0);
        } catch (error: unknown) {
            console.error('Error previewing audience:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to preview audience size';
            setError(errorMessage);
            setAudienceSize(null);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!segment) {
            setError('No segment selected');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            const segmentData = {
                ...formData,
                rules
            };

            await apiClient.segments.updateSegment(segment.id, segmentData);
            onSegmentUpdated();
            onClose();
        } catch (error: unknown) {
            console.error('Error updating segment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update segment';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle tag selection
    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    if (!isOpen || !segment) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-0 w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-3xl px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Edit Segment
                            </h2>
                            <p className="text-orange-100 mt-1 text-sm">
                                Update segment details and rules
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors rounded-full p-2 hover:bg-white hover:bg-opacity-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Segment Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="e.g., High Value Customers"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Brief description of this segment"
                            />
                        </div>
                    </div>

                    {/* Dynamic Segment Checkbox */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="is_dynamic_edit"
                            checked={formData.is_dynamic}
                            onChange={(e) => setFormData({ ...formData, is_dynamic: e.target.checked })}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="is_dynamic_edit" className="text-sm font-medium text-gray-700">
                            Auto-update segment (Dynamic)
                        </label>
                        <div className="relative group">
                            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64">
                                Dynamic segments automatically update their audience as customer data changes. Static segments maintain a fixed list from the time of creation.
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        formData.tags.includes(tag)
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rule Builder */}
                    <SegmentRuleBuilder
                        rules={rules}
                        onChange={setRules}
                    />

                    {/* Audience Preview */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Audience Preview</h3>
                            <button
                                type="button"
                                onClick={handlePreviewAudience}
                                disabled={isPreviewLoading || rules.conditions.length === 0}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPreviewLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    'Preview Audience'
                                )}
                            </button>
                        </div>

                        {audienceSize !== null && (
                            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {audienceSize.toLocaleString()} customers
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            will match this segment
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {audienceSize === null && (
                            <div className="text-center py-4 text-gray-500">
                                <p>Click &quot;Preview Audience&quot; to see how many customers match these rules</p>
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.name.trim() || rules.conditions.length === 0}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Updating...
                                </div>
                            ) : (
                                'Update Segment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
