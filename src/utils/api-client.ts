// API client for making requests to the backend
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useCallback, useMemo } from 'react';

// Type definitions
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}

interface Condition {
    id: string;
    field: string;
    operation: string;
    value: string | number | boolean;
}

interface ConditionGroup {
    id: string;
    operator: 'AND' | 'OR';
    conditions: (Condition | ConditionGroup)[];
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

interface SegmentData {
    name: string;
    description?: string;
    rules?: SegmentRules | ConditionGroup;
    is_dynamic?: boolean;
    tags?: string[];
}

interface CampaignData {
    name: string;
    segmentId: string;
    messageTemplate: string;
    objective?: string;
    status?: string;
    tags?: string[];
}

interface CustomerData {
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    phone?: string;
    address?: string;
    total_spend?: number;
    total_visits?: number;
    last_visit_date?: string;
    tags?: string[];
}

interface OrderData {
    customer_id: string;
    total_amount: number;
    status: string;
    items?: unknown[];
    order_date?: string;
}

interface SegmentAudienceData {
    rules: SegmentRules | ConditionGroup;
    audienceSize?: number;
}

interface MessageSuggestionData {
    objective: string;
    segmentData: SegmentAudienceData;
}

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API client hook
export function useApiClient() {
    const { getToken, logout } = useAuth();

    // Generic request function with authentication
    const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const token = getToken();

        // Set up headers
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
                cache: 'no-store',
            });

            // Handle authentication errors
            if (response.status === 401) {
                logout();
                throw new Error('Authentication required');
            }

            // Parse response
            const data = await response.json();

            // Handle API errors
            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }, [getToken, logout]);

    // HTTP methods
    const client = useMemo(() => ({
        get: (endpoint: string, options: RequestInit = {}) =>
            request(endpoint, { ...options, method: 'GET' }),

        post: (endpoint: string, data: unknown, options: RequestInit = {}) =>
            request(endpoint, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data),
            }),

        put: (endpoint: string, data: unknown, options: RequestInit = {}) =>
            request(endpoint, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data),
            }),

        delete: (endpoint: string, options: RequestInit = {}) =>
            request(endpoint, { ...options, method: 'DELETE' }),
    }), [request]);

    // AI-specific methods
    const aiClient = useMemo(() => ({
        // Convert natural language to segment rules
        naturalLanguageToRules: (text: string) =>
            client.post('/api/ai/natural-language-to-rules', { query: text }),

        // Get message suggestions based on objective
        getMessageSuggestions: (objective: string, segmentData: SegmentAudienceData) =>
            client.post('/api/ai/message-suggestions', { objective, segmentData }),

        // Auto-tag campaign based on message and rules
        autoTagCampaign: (message: string, segmentRules: SegmentRules | ConditionGroup) =>
            client.post('/api/ai/auto-tag', { message, segmentRules }),

        // Get campaign schedule suggestions
        getScheduleSuggestions: (segmentId: string) =>
            client.post('/api/ai/campaign-schedule', { segmentId }),

        // Generate lookalike audience
        getLookalikeAudience: (campaignId: string) =>
            client.post('/api/ai/lookalike-audience', { campaignId }),

        // Get smart scheduling suggestions
        getSchedulingSuggestions: (campaignData: CampaignData, segmentRules?: SegmentRules | ConditionGroup) =>
            client.post('/api/ai/scheduling-suggestions', { campaignData, segmentRules }),
    }), [client]);

    // Segment-specific methods
    const segmentClient = useMemo(() => ({
        // Get all segments with pagination
        getSegments: (page: number = 1, limit: number = 10) =>
            client.get(`/api/segments?page=${page}&limit=${limit}`),

        // Get single segment by ID
        getSegmentById: (id: string) =>
            client.get(`/api/segments/${id}`),

        // Create new segment
        createSegment: (segmentData: SegmentData) =>
            client.post('/api/segments', segmentData),

        // Update existing segment
        updateSegment: (id: string, segmentData: Partial<SegmentData>) =>
            client.put(`/api/segments/${id}`, segmentData),

        // Delete segment
        deleteSegment: (id: string) =>
            client.delete(`/api/segments/${id}`),

        // Preview segment audience (for existing segment)
        previewAudience: (id: string | null, rules?: SegmentRules | ConditionGroup) => {
            if (id) {
                // Preview existing segment
                return client.post(`/api/segments/${id}/preview`, rules || {});
            } else {
                // Preview rules without saving segment
                return client.post('/api/segments/preview', { rules });
            }
        },
    }), [client]);

    // Campaign-specific methods
    const campaignClient = useMemo(() => ({
        // Get all campaigns with pagination
        getCampaigns: (page: number = 1, limit: number = 20) =>
            client.get(`/api/campaigns?page=${page}&limit=${limit}`),

        // Get single campaign by ID
        getCampaignById: (id: string) =>
            client.get(`/api/campaigns/${id}`),

        // Get campaign stats
        getCampaignStats: (id: string) =>
            client.get(`/api/campaigns/${id}/stats`),

        // Create new campaign
        createCampaign: (campaignData: CampaignData) => {
            // Map frontend field names to backend expected names
            const backendCampaignData = {
                name: campaignData.name,
                segmentId: campaignData.segmentId,
                messageTemplate: campaignData.messageTemplate,
                objective: campaignData.objective,
                tags: campaignData.tags || []
            };
            return client.post('/api/campaigns', backendCampaignData);
        },

        // Update existing campaign
        updateCampaign: (id: string, campaignData: Partial<CampaignData>) => {
            // Map frontend field names to backend expected names
            const backendCampaignData = {
                name: campaignData.name,
                segmentId: campaignData.segmentId,
                messageTemplate: campaignData.messageTemplate,
                objective: campaignData.objective,
                status: campaignData.status, // Include status updates
                tags: campaignData.tags || []
            };
            return client.put(`/api/campaigns/${id}`, backendCampaignData);
        },

        // Delete campaign
        deleteCampaign: (id: string) =>
            client.delete(`/api/campaigns/${id}`),

        // Execute campaign
        executeCampaign: (id: string) =>
            client.post(`/api/campaigns/${id}/execute`, {}),

        // Preview campaign audience
        previewCampaignAudience: (rules: SegmentRules | ConditionGroup) =>
            client.post('/api/campaigns/preview', { rules }),

        // Get campaign message suggestions
        getCampaignSuggestions: (segmentId: string, purpose: string) =>
            client.post('/api/campaigns/suggestions', { segmentId, purpose }),
    }), [client]);

    // Customer-specific methods
    const customerClient = useMemo(() => ({
        // Get all customers with pagination
        getCustomers: (page: number = 1, limit: number = 20) =>
            client.get(`/api/customers?page=${page}&limit=${limit}`),

        // Get single customer by ID
        getCustomerById: (id: string) =>
            client.get(`/api/customers/${id}`),

        // Create new customer
        createCustomer: (customerData: CustomerData) =>
            client.post('/api/customers', customerData),

        // Update existing customer
        updateCustomer: (id: string, customerData: Partial<CustomerData>) =>
            client.put(`/api/customers/${id}`, customerData),

        // Delete customer
        deleteCustomer: (id: string) =>
            client.delete(`/api/customers/${id}`),
    }), [client]);

    // Order-specific methods
    const orderClient = useMemo(() => ({
        // Get all orders with pagination
        getOrders: (page: number = 1, limit: number = 20) =>
            client.get(`/api/orders?page=${page}&limit=${limit}`),

        // Get single order by ID
        getOrderById: (id: string) =>
            client.get(`/api/orders/${id}`),

        // Create new order
        createOrder: (orderData: OrderData) =>
            client.post('/api/orders', orderData),

        // Update existing order
        updateOrder: (id: string, orderData: Partial<OrderData>) =>
            client.put(`/api/orders/${id}`, orderData),

        // Delete order
        deleteOrder: (id: string) =>
            client.delete(`/api/orders/${id}`),

        // Get orders by customer ID
        getOrdersByCustomer: (customerId: string) =>
            client.get(`/api/orders/customer/${customerId}`),
    }), [client]);

    return useMemo(() => ({
        ...client,
        ai: aiClient,
        segments: segmentClient,
        campaigns: campaignClient,
        customers: customerClient,
        orders: orderClient,
    }), [client, aiClient, segmentClient, campaignClient, customerClient, orderClient]);
}
