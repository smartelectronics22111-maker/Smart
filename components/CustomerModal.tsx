
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Input from './Input';
import { X, Save } from 'lucide-react';

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gstin: '',
    address: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in mx-4">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Customer Name" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
          <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" />
          <Input label="GSTIN" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="Optional" />
          <Input label="Billing Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full Address" />

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
