
import React, { useState, useMemo, useEffect } from 'react';
import { Item, Invoice, InvoiceItem, Customer, Firestore } from '../types';
import { formatDateInput, formatCurrency, calculateWarrantyEndDate } from '../utils';
import { addEntry, updateEntry } from '../services/firebase';
import { ArrowLeft, Trash2, CheckCircle, User, Percent, DollarSign, AlertCircle, ScanBarcode } from 'lucide-react';
import Input from '../components/Input';

interface NewInvoiceScreenProps {
  items: Item[];
  customers: Customer[];
  db: Firestore | null;
  userId: string | null;
  appId: string;
  setScreen: (screen: string) => void;
  invoices: Invoice[];
}

const NewInvoiceScreen: React.FC<NewInvoiceScreenProps> = ({ items, customers, db, userId, appId, setScreen, invoices }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPan, setCustomerPan] = useState('');
  
  const [selectedItems, setSelectedItems] = useState<(Partial<InvoiceItem> & { itemId: string; name: string; unit: string; warrantyDays: number })[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');

  const nextInvoiceNumber = useMemo(() => {
    const lastNum = invoices.reduce((max, inv) => {
      const match = inv.invoiceNumber.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `GB/${lastNum + 1}/24-25`;
  }, [invoices]);

  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    if (invoiceNumber === nextInvoiceNumber) setInvoiceNumber(nextInvoiceNumber);
  }, [nextInvoiceNumber]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone || '');
      setCustomerGstin(customer.gstin || '');
      setCustomerAddress(customer.address || '');
    }
  };

  const handleAddItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const availableSerial = item.serialNumbers.find(sn => !selectedItems.some(si => si.serialNumber === sn)) || '';

    setSelectedItems(prev => [...prev, {
      itemId: item.id,
      name: item.name,
      price: item.salePrice || 0,
      quantity: 1,
      unit: item.unit,
      subtotal: item.salePrice || 0,
      serialNumber: availableSerial,
      warrantyDays: item.warrantyDays,
      hsnCode: '84181090',
      gstPercentage: 18
    }]);
  };

  const handleUpdateSerial = (index: number, newSerial: string) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index].serialNumber = newSerial;
      return copy;
    });
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index].price = newPrice;
      copy[index].subtotal = newPrice * (copy[index].quantity || 1);
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subTotal = selectedItems.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const discountAmount = discountType === 'percentage' ? (subTotal * discountValue / 100) : discountValue;
  const taxableAmount = Math.max(0, subTotal - discountAmount);
  
  // Logic for GST on top
  const totalGst = selectedItems.reduce((sum, i) => {
    const lineDiscountRatio = subTotal > 0 ? (subTotal - discountAmount) / subTotal : 1;
    const lineTaxableValue = (i.subtotal || 0) * lineDiscountRatio;
    return sum + (lineTaxableValue * (i.gstPercentage || 0) / 100);
  }, 0);

  const totalAmount = taxableAmount + totalGst;

  const handleSave = async () => {
    if (!userId || !customerName || selectedItems.length === 0) return;

    try {
      const finalItems: InvoiceItem[] = selectedItems.map(item => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price || 0,
        quantity: 1,
        unit: item.unit,
        subtotal: item.subtotal || 0,
        serialNumber: item.serialNumber || 'N/A',
        warrantyEndDate: calculateWarrantyEndDate(invoiceDate, item.warrantyDays),
        hsnCode: item.hsnCode,
        gstPercentage: item.gstPercentage
      }));

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        customerName,
        customerAddress,
        customerGstin,
        customerPhone,
        customerPan,
        date: new Date(invoiceDate).toISOString(),
        totalAmount,
        items: finalItems,
        discountValue: discountValue > 0 ? discountValue : undefined,
        discountType: discountValue > 0 ? discountType : undefined,
      };

      await addEntry(db, userId, 'invoices', invoiceData);

      for (const invItem of finalItems) {
        const originalItem = items.find(i => i.id === invItem.itemId);
        if (originalItem && invItem.serialNumber !== 'N/A') {
           const remainingSerials = originalItem.serialNumbers.filter(sn => sn !== invItem.serialNumber);
           await updateEntry(db, userId, 'inventory', invItem.itemId, { serialNumbers: remainingSerials });
        }
      }

      setScreen('invoices');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('invoices')} className="mr-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Generate Tax Invoice</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Invoice Number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required className="bg-indigo-700/50 border-white/20 text-white placeholder:text-white/40" />
          <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required className="bg-indigo-700/50 border-white/20 text-white" />
        </div>

        <div className="p-6 space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Party Details (M/s.)
              </h3>
              {customers.length > 0 && (
                <select 
                  className="text-xs font-bold uppercase border-gray-200 rounded-lg bg-gray-50 px-3 py-2 border hover:border-indigo-500 transition cursor-pointer"
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Search Saved Customers</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <Input label="Customer Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="M/s : [Party Name]" required />
              </div>
              <Input label="Phone No." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile No." />
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Billing Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Full Address" />
                <Input label="GSTIN No." value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} placeholder="GST Number" />
                <Input label="PAN No." value={customerPan} onChange={(e) => setCustomerPan(e.target.value)} placeholder="PAN Number" />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Add Billing Items</label>
            <div className="relative">
              <select
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-sm cursor-pointer appearance-none"
                onChange={(e) => {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>--- Select a product to bill ---</option>
                {sortedItems.map(item => (
                  <option key={item.id} value={item.id} className="p-2">
                    {item.name} | Stock: {item.serialNumbers.length} units | Price: {formatCurrency(item.salePrice)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ArrowLeft className="w-4 h-4 rotate-270" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr className="text-[10px] font-black uppercase text-gray-600 tracking-wider">
                  <th className="px-4 py-3 text-left">Description of Goods</th>
                  <th className="px-4 py-3 text-center">Serial/Model</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Net Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {selectedItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-400 italic font-medium">No items added to this invoice yet.</td></tr>
                ) : (
                  selectedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900 uppercase text-sm">{item.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-0.5">HSN: {item.hsnCode} | GST: {item.gstPercentage}%</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 group">
                           <ScanBarcode className="w-3 h-3 text-gray-300 group-focus-within:text-indigo-500" />
                           <input 
                              value={item.serialNumber}
                              onChange={(e) => handleUpdateSerial(idx, e.target.value)}
                              placeholder="Serial No."
                              className="p-1 border-b border-gray-200 rounded text-xs bg-transparent font-mono w-32 text-center focus:border-indigo-500 outline-none"
                           />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-gray-700">1.00</td>
                      <td className="px-4 py-4 text-right">
                         <input 
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdatePrice(idx, parseFloat(e.target.value))}
                            className="w-24 p-1.5 border border-gray-200 rounded-lg text-right font-bold text-indigo-600"
                            min="0"
                         />
                      </td>
                      <td className="px-4 py-4 text-right font-black text-gray-900">{formatCurrency(item.subtotal)}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-end pt-4 gap-8">
             <div className="w-full md:w-64 bg-gray-50 p-5 rounded-2xl border border-gray-100 h-fit">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Apply Discount</label>
                <div className="flex gap-2 mb-3">
                   <button type="button" onClick={() => setDiscountType('fixed')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${discountType === 'fixed' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>FIXED</button>
                   <button type="button" onClick={() => setDiscountType('percentage')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${discountType === 'percentage' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200'}`}>% OFF</button>
                </div>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {discountType === 'fixed' ? <DollarSign className="w-4 h-4 text-gray-300" /> : <Percent className="w-4 h-4 text-gray-300" />}
                   </div>
                   <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value))} className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl text-sm font-bold" placeholder="0" min="0" />
                </div>
             </div>

             <div className="w-full md:w-80 p-6 bg-gray-900 rounded-2xl text-white shadow-xl space-y-4">
              <div className="flex justify-between items-center opacity-60 text-sm">
                 <span className="uppercase tracking-widest font-bold">Taxable Value</span>
                 <span className="font-mono">{formatCurrency(taxableAmount)}</span>
              </div>
              <div className="flex justify-between items-center opacity-60 text-sm">
                 <span className="uppercase tracking-widest font-bold">GST Amount</span>
                 <span className="font-mono">{formatCurrency(totalGst)}</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between items-center text-2xl font-black italic">
                 <span className="uppercase text-xs tracking-[0.2em] font-bold opacity-40 not-italic">Grand Total</span>
                 <span className="text-indigo-400">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setScreen('invoices')} className="px-8 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">CANCEL</button>
            <button 
              onClick={handleSave} 
              disabled={!customerName || selectedItems.length === 0}
              className={`px-12 py-3 text-white font-black rounded-xl shadow-2xl flex items-center transition transform active:scale-95 ${
                !customerName || selectedItems.length === 0 ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              FINALIZE INVOICE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoiceScreen;
