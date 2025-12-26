
import React, { useState } from 'react';
import { Invoice, CompanySettings, Firestore } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils';
import { deleteEntry } from '../services/firebase';
import { Plus, Eye, Trash2, Settings2, EyeOff } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';

interface InvoicesScreenProps {
  invoices: Invoice[];
  setScreen: (screen: string) => void;
  db: Firestore | null;
  userId: string | null;
  appId: string;
  companySettings: CompanySettings | null;
}

const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ invoices, setScreen, db, userId, appId, companySettings }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [columns, setColumns] = useState({
    invoiceNumber: true,
    customer: true,
    date: true,
    amount: true,
    totalQty: true,
    itemsCount: false,
    actions: true
  });

  const handleDelete = async (invoiceId: string) => {
    if (!userId) return;
    if (!window.confirm("Delete this invoice? Stock will NOT be automatically reverted.")) return;
    try {
      await deleteEntry(db, userId, 'invoices', invoiceId);
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateTotalQty = (inv: Invoice) => {
    return inv.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sales Invoices</h1>
          <p className="text-gray-500 mt-1">History of all customer transactions.</p>
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
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-10 p-2 space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase px-2 mb-1 tracking-widest">Display Columns</p>
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
            onClick={() => setScreen('new-invoice')}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 transition"
            >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 font-bold">
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest">
                {columns.invoiceNumber && <th className="px-6 py-4 text-left">Invoice No.</th>}
                {columns.customer && <th className="px-6 py-4 text-left">Customer</th>}
                {columns.date && <th className="px-6 py-4 text-left">Date</th>}
                {columns.amount && <th className="px-6 py-4 text-left">Amount</th>}
                {columns.totalQty && <th className="px-6 py-4 text-center">Total Qty</th>}
                {columns.itemsCount && <th className="px-6 py-4 text-center">Lines</th>}
                {columns.actions && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedInvoices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No invoices recorded yet.</td></tr>
              ) : (
                sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    {columns.invoiceNumber && <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-700">{inv.invoiceNumber}</td>}
                    {columns.customer && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{inv.customerName}</td>}
                    {columns.date && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{formatDateDisplay(inv.date)}</td>}
                    {columns.amount && <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-emerald-600">{formatCurrency(inv.totalAmount)}</td>}
                    {columns.totalQty && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-gray-700">
                        {calculateTotalQty(inv).toFixed(2)}
                      </td>
                    )}
                    {columns.itemsCount && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{inv.items.length}</td>}
                    {columns.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center space-x-3">
                          <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
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

      {selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          companySettings={companySettings}
        />
      )}
    </div>
  );
};

export default InvoicesScreen;
