

import React, { useState } from 'react';
import { Item, Firestore } from '../types';
import { formatCurrency } from '../utils';
import { addEntry, updateEntry, deleteEntry } from '../services/firebase';
import { Plus, Edit2, Trash2, AlertCircle, Eye, EyeOff, Settings2 } from 'lucide-react';
import ItemModal from '../components/ItemModal';

interface ItemsScreenProps {
  items: Item[];
  db: Firestore | null;
  userId: string | null;
  appId: string;
}

const ItemsScreen: React.FC<ItemsScreenProps> = ({ items, db, userId, appId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [columns, setColumns] = useState({
    name: true,
    unit: true,
    stock: true,
    actions: true
  });

  const handleSave = async (itemData: Partial<Item>) => {
    if (!userId) return;
    try {
      const dataToSave = {
        ...itemData,
        serialNumbers: editItem ? (editItem.serialNumbers || []) : [],
      };

      if (editItem) {
        await updateEntry(db, userId, 'inventory', editItem.id, dataToSave);
      } else {
        await addEntry(db, userId, 'inventory', { ...dataToSave, dateAdded: new Date().toISOString() });
      }
      setShowModal(false);
      setEditItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!userId) return;
    if (!window.confirm("Are you sure? All serial number tracking for this item will be lost.")) return;
    try {
      await deleteEntry(db, userId, 'inventory', itemId);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Manage products and stock levels.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <button 
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                    <Settings2 className="w-5 h-5 mr-2" />
                    Columns
                </button>
                {showColumnMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 p-2 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-1">Show/Hide Columns</p>
                        {Object.keys(columns).map((key) => (
                            <button
                                key={key}
                                onClick={() => toggleColumn(key as keyof typeof columns)}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-gray-50 text-gray-700"
                            >
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                {columns[key as keyof typeof columns] ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
            </button>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start">
        <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Stock quantity is automatically calculated based on the number of stored unique Serial Numbers.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.name && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>}
                {columns.unit && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>}
                {columns.stock && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock (Serials)</th>}
                {columns.actions && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No items found. Add your first product to get started.</td></tr>
              ) : (
                items.map((item) => {
                  const stockCount = item.serialNumbers.length;
                  const isLowStock = stockCount < 5;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      {columns.name && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>}
                      {columns.unit && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>}
                      {columns.stock && (
                          <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                  {stockCount}
                              </span>
                          </td>
                      )}
                      {columns.actions && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                              <button onClick={() => { setEditItem(item); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ItemModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ItemsScreen;
