

import React, { useState } from 'react';
import { Customer, Firestore } from '../types';
import { addEntry, updateEntry, deleteEntry } from '../services/firebase';
import { Plus, Edit2, Trash2, Phone, MapPin } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';

interface CustomersScreenProps {
  customers: Customer[];
  db: Firestore | null;
  userId: string | null;
  appId: string;
}

const CustomersScreen: React.FC<CustomersScreenProps> = ({ customers, db, userId, appId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const handleSave = async (data: Partial<Customer>) => {
    if (!userId) return;
    try {
      if (editCustomer) {
        await updateEntry(db, userId, 'customers', editCustomer.id, data);
      } else {
        await addEntry(db, userId, 'customers', { ...data, dateAdded: new Date().toISOString() });
      }
      setShowModal(false);
      setEditCustomer(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteEntry(db, userId, 'customers', id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your client details for quick invoicing.</p>
        </div>
        <button
          onClick={() => { setEditCustomer(null); setShowModal(true); }}
          className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            No customers found. Add a customer to get started.
          </div>
        ) : (
          customers.map(customer => (
            <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full text-indigo-700 font-bold text-lg">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setEditCustomer(customer); setShowModal(true); }} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h3>
              {customer.gstin && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">GSTIN: {customer.gstin}</span>
              )}

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {customer.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <span className="flex-1">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CustomersScreen;
