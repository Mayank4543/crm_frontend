'use client';

import { useState } from 'react';

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

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onEdit?: (order: Order) => void;
    onDelete?: (orderId: string) => void;
}

// Order Details Modal component
export default function OrderDetailsModal({ order, onClose, onEdit, onDelete }: OrderDetailsModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
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
            month: 'long',
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

    // Handle edit order
    const handleEdit = () => {
        if (onEdit) {
            onEdit(order);
            onClose();
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (onDelete) {
            setIsDeleting(true);
            try {
                await onDelete(order.id);
                onClose();
            } catch (error) {
                console.error('Error deleting order:', error);
            } finally {
                setIsDeleting(false);
                setShowDeleteConfirm(false);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-0 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 my-8">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-3xl px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Order Details
                            </h2>
                            <p className="text-blue-100 mt-1 text-sm">
                                Complete order information and items
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

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Order Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Order Information
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Order Number:</span>
                                    <span className="text-gray-900 font-semibold">{order.order_number}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Order ID:</span>
                                    <span className="text-gray-700 font-mono text-sm">{order.id.slice(0, 8)}...</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Status:</span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">Order Date:</span>
                                    <span className="text-gray-900">{formatDate(order.order_date)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                    <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {formatCurrency(order.amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Customer Information
                            </h3>
                            
                            {order.customers ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Name:</span>
                                        <span className="text-gray-900 font-semibold">
                                            {order.customers.first_name} {order.customers.last_name}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Email:</span>
                                        <span className="text-gray-900">{order.customers.email}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Customer ID:</span>
                                        <span className="text-gray-700 font-mono text-sm">{order.customer_id.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Customer information not available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Order Items ({order.items.length} item{order.items.length > 1 ? 's' : ''})
                        </h3>
                        
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
                                            <div className="flex items-center mt-2 space-x-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    <span className="font-medium">Price: {formatCurrency(item.price)}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                    </svg>
                                                    <span className="font-medium">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900">
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                            <div className="text-sm text-gray-500">Subtotal</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Items Total */}
                        <div className="mt-6 pt-4 border-t-2 border-gray-300">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-800">Items Total:</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                    {formatCurrency(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
                        {/* Left side - Edit and Delete buttons */}
                        <div className="flex space-x-3">
                            {onEdit && (
                                <button
                                    onClick={handleEdit}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </div>
                                </button>
                            )}
                            
                            {onDelete && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Right side - Close and Print buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Close
                                </div>
                            </button>
                            
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Order</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete order <span className="font-semibold">{order.order_number}</span>? 
                                This action cannot be undone.
                            </p>
                            <div className="flex space-x-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete Order'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
