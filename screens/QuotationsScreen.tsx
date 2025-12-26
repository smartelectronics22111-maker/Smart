

import React, { useState } from 'react';
import { Quotation, CompanySettings, Firestore } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils';
import { deleteEntry } from '../services/firebase';
import { Plus, Eye, Trash2, Settings2, EyeOff } from 'lucide-react';
import QuotationPreview from '../components/QuotationPreview';

interface QuotationsScreenProps {
  quotations: Quotation[];
  setScreen: (screen: string) => void;
  db: Firestore | null;
  userId: string | null;
  appId: string;
  companySettings: CompanySettings | null;
}

const QuotationsScreen: React.FC<QuotationsScreenProps> = ({ quotations, setScreen, db, userId, appId, companySettings }) => {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  
  const [columns, setColumns] = useState({
    quotationNumber: true,
    customer: true,
    date: true,
    amount: true,
    actions: true
  });

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!window.confirm("Delete this quotation?")) return;
    try {
      await deleteEntry(db, userId, 'quotations', id);
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
  };

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sortedQuotations = [...quotations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 mt-1">Manage price estimates and proposals.</p>
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
            onClick={() => setScreen('new-quotation')}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
            <Plus className="w-5 h-5 mr-2" />
            Create Quotation
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.quotationNumber && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quotation No.</th>}
                {columns.customer && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>}
                {columns.date && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>}
                {columns.amount && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>}
                {columns.actions && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedQuotations.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No quotations created yet.</td></tr>
              ) : (
                sortedQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedQuotation(q)}>
                    {columns.quotationNumber && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{q.quotationNumber}</td>}
                    {columns.customer && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.customerName}</td>}
                    {columns.date && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(q.date)}</td>}
                    {columns.amount && <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{formatCurrency(q.totalAmount)}</td>}
                    {columns.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex space-x-3">
                          <button onClick={() => setSelectedQuotation(q)} className="text-indigo-600 hover:text-indigo-900" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQuotation && (
        <QuotationPreview
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          companySettings={companySettings}
        />
      )}
    </div>
  );
};

export default QuotationsScreen;
