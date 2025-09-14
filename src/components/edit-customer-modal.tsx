'use client';

import { useState, useEffect } from 'react';

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

// EditCustomerModal component
export default function EditCustomerModal({
  customer,
  onClose,
  onEditCustomer,
}: {
  customer: Customer;
  onClose: () => void;
  onEditCustomer: (
    customerId: string,
    customerData: Omit<Customer, 'id' | 'created_at'>
  ) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    total_spend: 0,
    total_visits: 0,
    last_visit_date: '',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with customer data
  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        total_spend: customer.total_spend || 0,
        total_visits: customer.total_visits || 0,
        last_visit_date: customer.last_visit_date 
          ? new Date(customer.last_visit_date).toISOString().split('T')[0] 
          : '',
        tags: Array.isArray(customer.tags) ? customer.tags.join(', ') : '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['total_spend', 'total_visits'];
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: numericFields.includes(name) ? Number(value) || 0 : value 
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert tags string to array and handle null values
    const customerData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      last_visit_date: formData.last_visit_date || undefined,
    };
    
    await onEditCustomer(customer.id, customerData);
    setIsSubmitting(false);
  };

  return (
    <div 
      className="fixed inset-0  bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-0 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 my-8">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-t-3xl px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Edit Customer
              </h2>
              <p className="text-green-100 mt-1 text-sm">
                Update customer information and preferences
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors rounded-full p-2 hover:bg-white hover:bg-opacity-20"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="group">
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="customer@example.com"
                    required
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="+1 (555) 123-4567"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="123 Main Street, City, State"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label
                    htmlFor="total_spend"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Total Spend ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="total_spend"
                      id="total_spend"
                      value={formData.total_spend}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                    />
                    <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="total_visits"
                    className="block text-sm font-semibold text-gray-800 mb-2"
                  >
                    Total Visits
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="total_visits"
                      id="total_visits"
                      value={formData.total_visits}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                      placeholder="0"
                    />
                    <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="last_visit_date"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Last Visit Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="last_visit_date"
                    id="last_visit_date"
                    value={formData.last_visit_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="group">
                <label
                  htmlFor="tags"
                  className="block text-sm font-semibold text-gray-800 mb-2"
                >
                  Tags (comma-separated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="VIP, Returning Customer, Premium"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Customer...
                  </div>
                ) : (
                  'Update Customer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
