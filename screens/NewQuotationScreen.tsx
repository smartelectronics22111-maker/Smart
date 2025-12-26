

import React, { useState, useMemo, useEffect } from 'react';
import { Item, Quotation, QuotationItem, Customer, Firestore } from '../types';
import { formatDateInput, formatCurrency } from '../utils';
import { addEntry } from '../services/firebase';
import { ArrowLeft, CheckCircle, Trash2, User } from 'lucide-react';
import Input from '../components/Input';

interface NewQuotationScreenProps {
  items: Item[];
  customers: Customer[];
  db: Firestore | null;
  userId: string | null;
  appId: string;
  setScreen: (screen: string) => void;
  quotations: Quotation[];
}

const NewQuotationScreen: React.FC<NewQuotationScreenProps> = ({ items, customers, db, userId, appId, setScreen, quotations }) => {
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<(QuotationItem & { itemId: string })[]>([]);
  
  const nextNumber = useMemo(() => {
    const last = quotations.reduce((max, q) => {
      const match = q.quotationNumber.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `QT-${String(last + 1).padStart(4, '0')}`;
  }, [quotations]);

  const [quotationNumber, setQuotationNumber] = useState(nextNumber);
  const [date, setDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    if (quotationNumber === nextNumber) setQuotationNumber(nextNumber);
  }, [nextNumber]);

  const handleCustomerSelect = (customerId: string) => {
    const c = customers.find(cus => cus.id === customerId);
    if (c) setCustomerName(c.name);
  };

  const handleAddItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    setSelectedItems(prev => [...prev, {
      itemId: item.id,
      name: item.name,
      price: item.salePrice,
      quantity: 1,
      unit: item.unit,
      subtotal: item.salePrice
    }]);
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index].quantity = qty;
      copy[index].subtotal = copy[index].price * qty;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = selectedItems.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSave = async () => {
    if (!userId || !customerName || selectedItems.length === 0) return;

    try {
      const data: Omit<Quotation, 'id'> = {
        quotationNumber,
        customerName,
        date: new Date(date).toISOString(),
        totalAmount,
        items: selectedItems
      };

      await addEntry(db, userId, 'quotations', data);
      setScreen('quotations');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('quotations')} className="mr-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Quotation</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Quotation Number" value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} required />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <hr className="border-gray-100" />
        
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              Customer
            </h3>
            {customers.length > 0 && (
              <select 
                className="w-full md:w-auto text-sm border-gray-300 rounded-md shadow-sm bg-gray-50 p-2 border"
                onChange={(e) => handleCustomerSelect(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select Saved Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter Customer Name" required />
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Product (Stock not reserved)</label>
          <select
            className="w-full p-2.5 border border-gray-300 rounded-lg"
            onChange={(e) => { handleAddItem(e.target.value); e.target.value = ''; }}
            defaultValue=""
          >
            <option value="" disabled>Select a product...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.salePrice)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Product</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Price</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Subtotal</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedItems.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No items added.</td></tr>
              ) : (
                selectedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value))}
                          className="w-16 text-center border rounded p-1"
                        />
                        <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-100 gap-4">
          <div className="text-xl font-bold text-gray-900">Total: {formatCurrency(totalAmount)}</div>
          <button 
            onClick={handleSave} 
            disabled={!customerName || selectedItems.length === 0}
            className={`w-full md:w-auto px-6 py-2 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center ${
              !customerName || selectedItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Save Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewQuotationScreen;
