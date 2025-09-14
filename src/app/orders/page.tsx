'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApiClient } from '@/utils/api-client';
import Navigation from '@/components/navigation';
import AddOrderModal from '../../components/add-order-modal';
import OrderDetailsModal from '../../components/order-details-modal';
import EditOrderModal from '../../components/edit-order-modal';

// TypeScript interfaces
interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Order {
    id: string;
    customer_id: string;
    order_number: string;
    amount: number;
    items: Product[];
    status: string;
    order_date: string;
    created_at: string;
    updated_at: string;
    customers?: Customer;
}

// Main Orders component
export default function OrdersPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const api = useApiClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const ordersPerPage = 10;

    // Load orders
    const loadOrders = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await api.orders.getOrders(page, ordersPerPage);
            
            if (response.success) {
                setOrders(response.data || []);
                setTotalOrders(response.pagination?.total || 0);
                setTotalPages(response.pagination?.pages || 0);
                setCurrentPage(page);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [api.orders]);

    // Load customers for dropdown
    const loadCustomers = useCallback(async () => {
        try {
            const response = await api.customers.getCustomers(1, 100);
            if (response.success) {
                setCustomers(response.data || []);
            }
        } catch (err: unknown) {
            console.error('Failed to load customers:', err);
        }
    }, [api.customers]);

    // Initial load
    useEffect(() => {
        loadOrders();
        loadCustomers();
    }, [loadOrders, loadCustomers]);

    // Authentication check
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Handle order created
    const handleOrderCreated = () => {
        setIsAddModalOpen(false);
        loadOrders(currentPage);
    };

    // Handle view order details
    const handleViewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    // Handle close order details modal
    // Handle order edit
    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsEditModalOpen(true);
        setIsDetailsModalOpen(false); // Close details modal if open
    };

    // Handle order delete
    const handleDeleteOrder = async (orderId: string) => {
        // Find the order to get its number for confirmation
        const orderToDelete = orders.find(order => order.id === orderId);
        const orderNumber = orderToDelete?.order_number || orderId;

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await api.orders.deleteOrder(orderId);
            // Refresh the orders list
            await loadOrders(currentPage);
            alert('Order deleted successfully!');
        } catch (error: unknown) {
            console.error('Error deleting order:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete order. Please try again.';
            alert(errorMessage);
        }
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedOrder(null);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status badge color for dark theme
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (loading && orders.length === 0) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-blue-900/10">
                {/* Navigation */}
                <div className="w-64 hidden md:block">
                    <Navigation />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
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
                                Orders Management
                            </h1>
                            <p className="text-gray-400 mt-2">Manage and track customer orders</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-xl"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span>Add Order</span>
                        </button>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-xl backdrop-blur-sm">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Orders Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">{totalOrders}</h3>
                                    <p className="text-sm text-gray-400">Total Orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {orders.filter(o => o.status === 'completed').length}
                                    </h3>
                                    <p className="text-sm text-gray-400">Completed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {orders.filter(o => o.status === 'pending').length}
                                    </h3>
                                    <p className="text-sm text-gray-400">Pending</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {formatCurrency(orders.reduce((sum, order) => sum + order.amount, 0))}
                                    </h3>
                                    <p className="text-sm text-gray-400">Total Revenue</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                        </div>

                        {orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
                                <p className="text-gray-400 mb-6">Get started by creating your first order.</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add First Order
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Order
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/5 divide-y divide-white/5">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {order.order_number}
                                                        </div>
                                                        <div className="text-sm text-gray-400">ID: {order.id.slice(0, 8)}...</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {order.customers 
                                                                ? `${order.customers.first_name} ${order.customers.last_name}`
                                                                : 'Unknown Customer'
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-400">
                                                            {order.customers?.email || ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-white">
                                                        {formatCurrency(order.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-white">
                                                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                                        {order.items.length > 2 && '...'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    {formatDate(order.order_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewOrderDetails(order)}
                                                            className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditOrder(order)}
                                                            className="text-amber-400 hover:text-amber-300 transition-colors p-2 rounded-lg hover:bg-amber-500/10"
                                                            title="Edit Order"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                            title="Delete Order"
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
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                                <div className="text-sm text-gray-400">
                                    Showing {(currentPage - 1) * ordersPerPage + 1} to{' '}
                                    {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadOrders(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="px-3 py-1 text-sm border border-white/20 text-gray-300 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => loadOrders(i + 1)}
                                            className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                                                currentPage === i + 1
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => loadOrders(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="px-3 py-1 text-sm border border-white/20 text-gray-300 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Order Modal */}
            {isAddModalOpen && (
                <AddOrderModal
                    customers={customers}
                    onClose={() => setIsAddModalOpen(false)}
                    onOrderCreated={handleOrderCreated}
                />
            )}

            {/* Order Details Modal */}
            {isDetailsModalOpen && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={handleCloseDetailsModal}
                    onEdit={handleEditOrder}
                    onDelete={handleDeleteOrder}
                />
            )}

            {/* Edit Order Modal */}
            {isEditModalOpen && selectedOrder && (
                <EditOrderModal
                    order={selectedOrder}
                    customers={customers}
                    apiClient={api}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    onOrderUpdated={() => {
                        loadOrders(currentPage);
                        setIsEditModalOpen(false);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
}
