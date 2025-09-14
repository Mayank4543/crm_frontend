'use client';

import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface OrderData {
    customer_id: string;
    total_amount: number;
    status: string;
    items?: unknown[];
    order_date?: string;
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

interface EditOrderModalProps {
    order: Order;
    customers: Customer[];
    onClose: () => void;
    onOrderUpdated: () => void;
    apiClient: {
        orders: {
            updateOrder: (id: string, data: Partial<OrderData>) => Promise<unknown>;
        };
    };
}

export default function EditOrderModal({ order, customers, onClose, onOrderUpdated, apiClient }: EditOrderModalProps) {
    const [formData, setFormData] = useState({
        customer_id: order.customer_id,
        status: order.status,
        items: order.items,
        amount: order.amount
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await apiClient.orders.updateOrder(order.id, formData);
            onOrderUpdated();
            onClose();
        } catch (error: unknown) {
            console.error('Error updating order:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'An error occurred while updating the order';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle item changes
    const handleItemChange = (index: number, field: keyof Product, value: string | number) => {
        const updatedItems = [...formData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: field === 'price' || field === 'quantity' ? Number(value) : value
        };
        
        // Recalculate total amount
        const newAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        setFormData({
            ...formData,
            items: updatedItems,
            amount: newAmount
        });
    };

    // Add new item
    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: Date.now().toString(), name: '', price: 0, quantity: 1 }]
        });
    };

    // Remove item
    const removeItem = (index: number) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        const newAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        setFormData({
            ...formData,
            items: updatedItems,
            amount: newAmount
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div 
            className="fixed inset-0  bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-0 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-3xl px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Edit Order
                            </h2>
                            <p className="text-orange-100 mt-1 text-sm">
                                Update order details and items
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

                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Order Number
                            </label>
                            <input
                                type="text"
                                value={order.order_number}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className='mt-4'>
                            <label className="block text-sm font-medium text-black mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                required
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-black mb-2">
                            Customer
                        </label>
                        <select
                            value={formData.customer_id}
                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                            className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            required
                        >
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.first_name} {customer.last_name} ({customer.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                            >
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.items.map((item, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-black mb-1">
                                                Product Name
                                            </label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-black mb-1">
                                                Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-black mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Amount */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                                <span className="text-2xl font-bold text-amber-600">
                                    {formatCurrency(formData.amount)}
                                </span>
                            </div>
                        </div>
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
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Updating...
                                </div>
                            ) : (
                                'Update Order'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
