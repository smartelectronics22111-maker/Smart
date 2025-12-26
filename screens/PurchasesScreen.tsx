

import React from 'react';
import { Purchase, Firestore } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils';
import { deleteEntry } from '../services/firebase';
import { Plus, Trash2 } from 'lucide-react';

interface PurchasesScreenProps {
  purchases: Purchase[];
  setScreen: (screen: string) => void;
  db: Firestore | null;
  userId: string | null;
  appId: string;
}

const PurchasesScreen: React.FC<PurchasesScreenProps> = ({ purchases, setScreen, db, userId, appId }) => {
  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!window.confirm("Delete record? Stock added by this purchase remains in inventory.")) return;
    try {
      await deleteEntry(db, userId, 'purchases', id);
    } catch (e) {
      console.error(e);
    }
  };

  const sorted = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-500 mt-1">Track inventory sourcing and costs.</p>
        </div>
        <button
          onClick={() => setScreen('new-purchase')}
          className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:bg-rose-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Bill No.', 'Supplier', 'Date', 'Total Cost', 'Items', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No purchases recorded.</td></tr>
              ) : (
                sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{p.billNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{p.supplierName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateDisplay(p.date)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-600 whitespace-nowrap">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {p.items.reduce((acc, i) => acc + (i.serialNumbers?.length || 0), 0)} units
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchasesScreen;
