'use client';
import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/navigation';
import NewSegmentModal from '@/components/new-segment-modal';
import EditSegmentModal from '@/components/edit-segment-modal';
import { useApiClient } from '@/utils/api-client';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiUsers, FiCalendar, FiTarget } from 'react-icons/fi';

interface Rule {
    field: string;
    operator: string;
    value: string | number | [number, number];
}

interface SegmentRules {
    logic: 'AND' | 'OR';
    conditions: Rule[];
}

interface Segment {
    id: string;
    name: string;
    description: string;
    rules?: SegmentRules;
    is_dynamic?: boolean;
    tags?: string[];
    audience_size?: number;
    last_calculated_at?: string;
    created_at: string;
    updated_at: string;
    customer_count?: number;
}

interface CustomerSample {
    name?: string;
    email?: string;
}

interface AudiencePreview {
    total?: number;
    count?: number;
    sample?: CustomerSample[];
}

export default function SegmentsPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [audiencePreview, setAudiencePreview] = useState<AudiencePreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSegmentForEdit, setSelectedSegmentForEdit] = useState<Segment | null>(null);

    const apiClient = useApiClient();

    const fetchSegments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.segments.getSegments(1, 50);
            console.log('Segments response:', response);
            setSegments(response.segments || response.data || []);
        } catch (err: unknown) {
            console.error('Error fetching segments:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch segments';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [apiClient.segments]);

    useEffect(() => {
        fetchSegments();
    }, [fetchSegments]);

    const handleViewSegment = async (segment: Segment) => {
        setSelectedSegment(segment);
        setViewMode('details');

        // Fetch audience preview
        try {
            setPreviewLoading(true);
            const response = await apiClient.segments.previewAudience(segment.id);
            // Handle both possible response formats
            setAudiencePreview(response.data || response);
        } catch (err) {
            console.error('Error fetching audience preview:', err);
            setAudiencePreview(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleEditSegment = async (segment: Segment) => {
        setSelectedSegmentForEdit(segment);
        setShowEditModal(true);
    };

    const handleDeleteSegment = async (segment: Segment) => {
        // Show confirmation dialog with segment details
        const confirmed = window.confirm(
            `Are you sure you want to delete the segment "${segment.name}"?\n\nThis action cannot be undone and will permanently remove:\n- Segment rules and configuration\n- All associated data\n\nAudience size: ${segment.audience_size || segment.customer_count || 0} customers`
        );
        
        if (!confirmed) return;

        try {
            await apiClient.segments.deleteSegment(segment.id);
            await fetchSegments(); // Refresh the list
            
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            successDiv.textContent = `Segment "${segment.name}" deleted successfully!`;
            document.body.appendChild(successDiv);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                }
            }, 3000);
            
        } catch (err: unknown) {
            console.error('Error deleting segment:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to delete segment: ${errorMessage}`);
        }
    };

    const handleSegmentCreated = () => {
        fetchSegments(); // Refresh the segments list
    };

    const handleSegmentUpdated = () => {
        fetchSegments(); // Refresh the segments list
        
        // If we're viewing the updated segment, update the selected segment
        if (selectedSegment && selectedSegmentForEdit && selectedSegment.id === selectedSegmentForEdit.id) {
            // Re-fetch the updated segment for the detail view
            handleViewSegment(selectedSegmentForEdit);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRules = (rules: unknown) => {
        if (!rules || typeof rules !== 'object') return 'No rules defined';

        try {
            const rulesStr = JSON.stringify(rules, null, 2);
            return rulesStr.length > 200 ? rulesStr.substring(0, 200) + '...' : rulesStr;
        } catch {
            return 'Invalid rules format';
        }
    };

    if (viewMode === 'details' && selectedSegment) {
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
                                <button
                                    onClick={() => {
                                        setViewMode('list');
                                        setSelectedSegment(null);
                                        setAudiencePreview(null);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 mb-2 flex items-center text-sm"
                                >
                                    ← Back to Segments
                                </button>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    {selectedSegment.name}
                                </h1>
                                <p className="text-gray-400 mt-2">{selectedSegment.description}</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleEditSegment(selectedSegment)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200"
                                >
                                    <FiEdit size={16} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteSegment(selectedSegment)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200"
                                >
                                    <FiTrash2 size={16} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Segment Details */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                    <FiTarget className="mr-2" />
                                    Segment Details
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Created</label>
                                        <p className="text-white flex items-center">
                                            <FiCalendar className="mr-2" size={16} />
                                            {formatDate(selectedSegment.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Last Updated</label>
                                        <p className="text-white flex items-center">
                                            <FiCalendar className="mr-2" size={16} />
                                            {formatDate(selectedSegment.updated_at)}
                                        </p>
                                    </div>
                                    {selectedSegment.last_calculated_at && (
                                        <div>
                                            <label className="text-sm text-gray-400">Last Calculated</label>
                                            <p className="text-white flex items-center">
                                                <FiCalendar className="mr-2" size={16} />
                                                {formatDate(selectedSegment.last_calculated_at)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm text-gray-400">Type</label>
                                        <p className="text-white">
                                            {selectedSegment.is_dynamic ? '🔄 Dynamic' : '📷 Static'}
                                        </p>
                                    </div>
                                    {selectedSegment.tags && selectedSegment.tags.length > 0 && (
                                        <div>
                                            <label className="text-sm text-gray-400">Tags</label>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedSegment.tags.map((tag, index) => (
                                                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm text-gray-400">Segment Rules</label>
                                        <pre className="text-white text-xs bg-black/20 p-3 rounded-lg mt-1 overflow-auto max-h-60">
                                            {renderRules(selectedSegment.rules)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Audience Preview */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                    <FiUsers className="mr-2" />
                                    Audience Preview
                                </h2>

                                {previewLoading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                    </div>
                                ) : audiencePreview ? (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4">
                                            <p className="text-2xl font-bold text-white">
                                                {audiencePreview.total || audiencePreview.count || 0}
                                            </p>
                                            <p className="text-sm text-gray-400">Total Customers</p>
                                        </div>

                                        {audiencePreview.sample && audiencePreview.sample.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-400 mb-2">Sample Customers:</h3>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {audiencePreview.sample?.map((customer: CustomerSample, index: number) => (
                                                        <div key={index} className="bg-black/20 rounded-lg p-2">
                                                            <p className="text-white text-sm font-medium">
                                                                {customer.name || customer.email || `Customer ${index + 1}`}
                                                            </p>
                                                            {customer.email && customer.name && (
                                                                <p className="text-gray-400 text-xs">{customer.email}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-8">
                                        <FiUsers size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No audience data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
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
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Customer Segments
                            </h1>
                            <p className="text-gray-400 mt-2">Manage and analyze your customer segments</p>
                        </div>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <FiPlus size={20} />
                            <span>Create Segment</span>
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                            <p className="text-red-400 mb-4">Error loading segments</p>
                            <p className="text-gray-400 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchSegments}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : segments.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-xl">
                            <FiUsers size={64} className="mx-auto text-gray-500 mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">No segments found</h2>
                            <p className="text-gray-400 mb-6">Create your first customer segment to get started</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 mx-auto transition-all duration-200"
                            >
                                <FiPlus size={20} />
                                <span>Create First Segment</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {segments.map((segment) => (
                                <div
                                    key={segment.id}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2">{segment.name}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{segment.description}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                                            <FiUsers size={14} />
                                            <span>{segment.customer_count || 0}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs text-gray-400 mb-1">Created</p>
                                        <p className="text-sm text-gray-300">{formatDate(segment.created_at)}</p>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleViewSegment(segment)}
                                            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center justify-center space-x-1 transition-all duration-200"
                                        >
                                            <FiEye size={14} />
                                            <span>View</span>
                                        </button>
                                        <button
                                            onClick={() => handleEditSegment(segment)}
                                            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg flex items-center justify-center space-x-1 transition-all duration-200"
                                        >
                                            <FiEdit size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSegment(segment)}
                                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg flex items-center justify-center transition-all duration-200"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Segment Modal */}
            <NewSegmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSegmentCreated={handleSegmentCreated}
                apiClient={apiClient}
            />

            {/* Edit Segment Modal */}
            <EditSegmentModal
                isOpen={showEditModal}
                segment={selectedSegmentForEdit}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedSegmentForEdit(null);
                }}
                onSegmentUpdated={handleSegmentUpdated}
                apiClient={apiClient}
            />
        </div>
    );
}
