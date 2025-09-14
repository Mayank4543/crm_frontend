'use client';

import { useState } from 'react';
import { useApiClient } from '@/utils/api-client';

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

interface AddOrderModalProps {
    customers: Customer[];
    onClose: () => void;
    onOrderCreated: () => void;
}

// Add Order Modal component
export default function AddOrderModal({ customers, onClose, onOrderCreated }: AddOrderModalProps) {
    const api = useApiClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        customerId: '',
        amount: 0,
    });

    const [products, setProducts] = useState<Product[]>([
        { id: '', name: '', price: 0, quantity: 1 }
    ]);

    // Handle form input changes
    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle product changes
    const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
        setProducts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Add new product row
    const addProduct = () => {
        setProducts(prev => [
            ...prev,
            { id: `product-${Date.now()}`, name: '', price: 0, quantity: 1 }
        ]);
    };

    // Remove product row
    const removeProduct = (index: number) => {
        if (products.length > 1) {
            setProducts(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Calculate total amount
    const calculateTotal = () => {
        return products.reduce((sum, product) => {
            return sum + (product.price * product.quantity);
        }, 0);
    };

    // Update amount when products change
    useState(() => {
        const total = calculateTotal();
        setFormData(prev => ({ ...prev, amount: total }));
    });

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.customerId) {
            setError('Please select a customer');
            return;
        }

        if (products.some(p => !p.name || p.price <= 0 || p.quantity <= 0)) {
            setError('Please fill in all product details correctly');
            return;
        }

        try {
            setLoading(true);

            // Calculate final amount
            const totalAmount = calculateTotal();

            // Prepare order data
            const orderData = {
                customer_id: formData.customerId,
                total_amount: totalAmount,
                status: 'pending',
                items: products.map(p => ({
                    id: p.id || `product-${Date.now()}-${Math.random()}`,
                    name: p.name,
                    price: parseFloat(p.price.toString()),
                    quantity: parseInt(p.quantity.toString())
                }))
            };

            await api.orders.createOrder(orderData);
            onOrderCreated();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0  bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-0 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 my-8">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-3xl px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Create New Order
                            </h2>
                            <p className="text-blue-100 mt-1 text-sm">
                                Create a new order for your customers
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
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-semibold text-black mb-3">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Customer *
                        </label>
                        <select
                            value={formData.customerId}
                            onChange={(e) => handleInputChange('customerId', e.target.value)}
                            className="w-full px-4 py-3 text-black border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
                            required
                        >
                            <option value="">Select a customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.first_name} {customer.last_name} ({customer.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Products Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <label className="flex items-center text-sm font-semibold text-black">
                                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Products *
                            </label>
                            <button
                                type="button"
                                onClick={addProduct}
                                className="inline-flex items-center px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Product
                            </button>
                        </div>

                        <div className="space-y-4">
                            {products.map((product, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 p-5 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    {/* Product Name */}
                                    <div className="col-span-5">
                                        <label className="block text-xs font-semibold text-black mb-2">
                                            Product Name
                                        </label>
                                        <input
                                            type="text"
                                            value={product.name}
                                            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                            className="w-full text-black px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                            Price ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={product.price}
                                            onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full text-black px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-black mb-2">
                                            Qty
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={product.quantity}
                                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-full text-black px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-3 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
                                            required
                                        />
                                    </div>

                                    {/* Remove Button */}
                                    <div className="col-span-2 flex items-end">
                                        {products.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(index)}
                                                className="w-full px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md border border-red-200 hover:border-red-300"
                                                title="Remove product"
                                            >
                                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-span-12 text-right">
                                        <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 rounded-full border border-green-200">
                                            <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            <span className="text-sm font-semibold text-green-700">
                                                Subtotal: ${(product.price * product.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-inner">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="text-lg font-bold text-gray-700">Total Amount:</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                ${calculateTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    Creating Order...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Order
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
