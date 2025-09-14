'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import AddCustomerModal from '@/components/add-customer-modal';
import EditCustomerModal from '@/components/edit-customer-modal';
// Using SVG icons for better compatibility

interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    total_spend?: number;
    total_visits?: number;
    last_visit_date?: string | null;
    tags?: string[];
    created_at: string;
}

// Customers list page
export default function CustomersList() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const api = useApiClient();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Fetch customers function
    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoadingCustomers(true);
            const response = await api.customers.getCustomers();
            console.log('Customers API response:', response);
            
            // Handle different response structures
            if (response.success && response.data) {
                setCustomers(response.data);
            } else if (Array.isArray(response.data)) {
                setCustomers(response.data);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
        } finally {
            setIsLoadingCustomers(false);
        }
    }, [api.customers]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch customers on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchCustomers();
        }
    }, [isAuthenticated, fetchCustomers]);

    // Handle adding a new customer
    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
        try {
          
            
            // Ensure numeric fields are properly formatted
            const formattedData = {
                ...customerData,
                total_spend: Number(customerData.total_spend) || 0,
                total_visits: Number(customerData.total_visits) || 0,
                phone: customerData.phone || '',
                address: customerData.address || '',
                last_visit_date: customerData.last_visit_date || '',
                tags: customerData.tags || [],
            };
            
            console.log('Formatted customer data:', formattedData);
            const response = await api.customers.createCustomer(formattedData);
            console.log('Create customer response:', response);
            
            if (response.success) {
                setShowAddCustomerModal(false);
                // Since creation is async via Redis, wait a moment then refresh
                setTimeout(() => {
                    fetchCustomers();
                }, 1000);
                alert('Customer created successfully!');
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error: unknown) {
            console.error('Error adding customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowEditCustomerModal(true);
    };

    // Handle editing an existing customer
    const handleEditCustomerSubmit = async (customerId: string, customerData: Omit<Customer, 'id' | 'created_at'>) => {
        try {
            console.log('Editing customer with ID:', customerId, 'Data:', customerData);
            
            // Ensure numeric fields are properly formatted
            const formattedData = {
                ...customerData,
                total_spend: Number(customerData.total_spend) || 0,
                total_visits: Number(customerData.total_visits) || 0,
                phone: customerData.phone || '',
                address: customerData.address || '',
                last_visit_date: customerData.last_visit_date || '',
                tags: customerData.tags || [],
            };
            
            console.log('Formatted customer data:', formattedData);
            const response = await api.customers.updateCustomer(customerId, formattedData);
            console.log('Update customer response:', response);
            
            if (response.success) {
                setShowEditCustomerModal(false);
                setSelectedCustomer(null);
                // Refresh the customer list
                fetchCustomers();
                alert('Customer updated successfully!');
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error: unknown) {
            console.error('Error updating customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleDeleteCustomer = async (customer: Customer) => {
        if (!confirm(`Are you sure you want to delete "${customer.first_name} ${customer.last_name}"?\n\nThis action cannot be undone.`)) return;

        try {
            console.log('Deleting customer with ID:', customer.id);
            const response = await api.customers.deleteCustomer(customer.id);
            console.log('Delete customer response:', response);
            
            if (response.success) {
                // Refresh the customer list
                fetchCustomers();
                alert('Customer deleted successfully!');
            } else {
                alert(`Error: ${response.message}`);
            }
        } catch (error: unknown) {
            console.error('Error deleting customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
            alert(`Error: ${errorMessage}`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
                                Customers
                            </h1>
                            <p className="text-gray-400 mt-2">Manage and analyze your customer database</p>
                        </div>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl"
                            onClick={() => setShowAddCustomerModal(true)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Add Customer</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{customers.length}</p>
                            <p className="text-sm text-gray-400">Total Customers</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                ${customers.reduce((sum, c) => sum + (c.total_spend || 0), 0).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {customers.reduce((sum, c) => sum + (c.total_visits || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-400">Total Visits</p>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoadingCustomers ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-xl">
                            <svg className="mx-auto text-gray-500 mb-4 w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            <h2 className="text-xl font-semibold text-white mb-2">No customers found</h2>
                            <p className="text-gray-400 mb-6">Add your first customer to get started</p>
                            <button
                                onClick={() => setShowAddCustomerModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 mx-auto transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Add First Customer</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-white/10 border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Spending
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Activity
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Tags
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {customers.map((customer: Customer, index: number) => (
                                            <tr key={customer.id} className="hover:bg-white/5 transition-colors duration-150">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                                                            {customer.first_name?.charAt(0) || 'U'}{customer.last_name?.charAt(0) || 'N'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-white">
                                                                {customer.first_name} {customer.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-400">
                                                                Customer #{index + 1}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Since {formatDate(customer.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2 text-gray-300">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                                            <span className="text-sm">{customer.email}</span>
                                                        </div>
                                                        {customer.phone && (
                                                            <div className="flex items-center space-x-2 text-gray-300">
                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                                <span className="text-sm">{customer.phone}</span>
                                                            </div>
                                                        )}
                                                        {customer.address && (
                                                            <div className="flex items-center space-x-2 text-gray-300">
                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                                <span className="text-sm truncate max-w-32">{customer.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                           
                                                            <span className="text-sm font-semibold text-green-400">
                                                                ${(customer.total_spend || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {customer.total_visits || 0} visits
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                                            <span className="text-sm text-gray-300">
                                                                {customer.last_visit_date
                                                                    ? formatDate(customer.last_visit_date)
                                                                    : 'Never visited'
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Last activity
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {customer.tags && customer.tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {customer.tags.slice(0, 2).map((tag: string, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {customer.tags.length > 2 && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                                                    +{customer.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No tags</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            className="inline-flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors duration-150"
                                                            onClick={() => {
                                                                alert(`View details for ${customer.first_name} ${customer.last_name}`);
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </button>
                                                        <button
                                                            className="inline-flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors duration-150"
                                                            onClick={() => handleEditCustomer(customer)}
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-150"
                                                            onClick={() => handleDeleteCustomer(customer)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
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
            </div>

            {/* Add Customer Modal */}
            {showAddCustomerModal && (
                <AddCustomerModal
                    onClose={() => setShowAddCustomerModal(false)}
                    onAddCustomer={handleAddCustomer}
                />
            )}

            {/* Edit Customer Modal */}
            {showEditCustomerModal && selectedCustomer && (
                <EditCustomerModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowEditCustomerModal(false);
                        setSelectedCustomer(null);
                    }}
                    onEditCustomer={handleEditCustomerSubmit}
                />
            )}
        </div>
    );
}
