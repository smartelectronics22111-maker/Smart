import React, { useState, useMemo, useEffect } from 'react';
import { Item, Purchase, PurchaseItem, Firestore } from '../types';
import { formatDateInput, formatCurrency } from '../utils';
// @ts-ignore
import { doc, getDoc } from 'firebase/firestore';
import { addEntry, updateEntry, useFirebase } from '../services/firebase';
import { ArrowLeft, Save, Plus, Trash2, Wand2, RefreshCw, PackagePlus, ScanBarcode } from 'lucide-react';
import Input from '../components/Input';
import ItemModal from '../components/ItemModal';

interface NewPurchaseScreenProps {
  items: Item[];
  db: Firestore | null;
  userId: string | null;
  appId: string;
  setScreen: (screen: string) => void;
  purchases: Purchase[];
}

const NewPurchaseScreen: React.FC<NewPurchaseScreenProps> = ({ items, db, userId, appId, setScreen, purchases }) => {
  // Header State
  const [supplierName, setSupplierName] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  
  const nextBillNumber = useMemo(() => {
    const last = purchases.reduce((max, p) => {
      const match = p.billNumber.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `PBL-${String(last + 1).padStart(4, '0')}`;
  }, [purchases]);

  const [billNumber, setBillNumber] = useState(nextBillNumber);
  const [date, setDate] = useState(formatDateInput(new Date()));

  useEffect(() => {
    if (billNumber === nextBillNumber) setBillNumber(nextBillNumber);
  }, [nextBillNumber]);

  // Item Entry State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isSerialized, setIsSerialized] = useState(true); // New Toggle
  const [isAutoGenerate, setIsAutoGenerate] = useState(true); 
  const [entryQuantity, setEntryQuantity] = useState<number | string>(''); 

  const [currentEntry, setCurrentEntry] = useState({
    price: 0,
    salePrice: 0,
    hsnCode: '',
    gstPercentage: 0,
    warrantyDays: 0,
    serialsInput: ''
  });

  // Modal State for Quick Add
  const [showItemModal, setShowItemModal] = useState(false);

  // List of added items
  const [addedItems, setAddedItems] = useState<(PurchaseItem & { salePrice?: number })[]>([]);

  // Helpers
  const handleItemSelect = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    setSelectedItemId(itemId);
    setEntryQuantity('');
    setIsAutoGenerate(true);
    setIsSerialized(true); // Default to true, user can uncheck
    
    setCurrentEntry({
        price: item.purchasePrice || 0,
        salePrice: item.salePrice || 0,
        hsnCode: '',
        gstPercentage: 18, 
        warrantyDays: item.warrantyDays || 365,
        serialsInput: ''
    });
  };

  const handleEntryChange = (field: string, value: any) => {
      setCurrentEntry(prev => ({ ...prev, [field]: value }));
  };

  const generateSerials = (qty: number) => {
      if (qty <= 0) return '';
      // Generate unique IDs: SN + Timestamp + Random + Index
      const prefix = "SN"; 
      const timestamp = Date.now().toString().slice(-6); 
      const random = Math.floor(Math.random() * 100);
      return Array.from({ length: qty }).map((_, i) => {
          return `${prefix}${timestamp}${random}-${i+1}`; 
      }).join(', ');
  };

  const handleQuantityChange = (val: string) => {
      const qty = parseInt(val) || 0;
      setEntryQuantity(val);
      
      if (isSerialized) {
          if (qty > 0) {
              const serials = generateSerials(qty);
              handleEntryChange('serialsInput', serials);
              setIsAutoGenerate(true);
          } else {
              handleEntryChange('serialsInput', '');
          }
      }
  };

  const handleSerialsInputChange = (val: string) => {
      handleEntryChange('serialsInput', val);
      if (!isAutoGenerate) {
          const count = val.split(/[\n,]+/).filter(s => s.trim()).length;
          setEntryQuantity(count === 0 ? '' : count);
      }
  };

  const handleAutoGenerateToggle = (checked: boolean) => {
      setIsAutoGenerate(checked);
      if (checked) {
          const qty = parseInt(String(entryQuantity)) || 0;
          if (qty > 0) {
              handleEntryChange('serialsInput', generateSerials(qty));
          }
      }
  };

  const handleAddItemToList = () => {
    if (!selectedItemId) return;
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    let serialList: string[] = [];

    if (isSerialized) {
        // Mode 1: Tracked Serials
        serialList = currentEntry.serialsInput
            .split(/[\n,]+/) 
            .map(s => s.trim())
            .filter(s => s !== '');

        if (serialList.length === 0) {
            alert("Please enter Quantity or Serial Numbers.");
            return;
        }

        if (new Set(serialList).size !== serialList.length) {
            alert("Duplicate serial numbers generated/found in your input.");
            return;
        }
        
        // Check duplicates in current bill
        const allExistingBillSerials = addedItems.flatMap(i => i.serialNumbers);
        const duplicates = serialList.filter(s => allExistingBillSerials.includes(s));
        if (duplicates.length > 0) {
            alert(`Serial number(s) ${duplicates.join(', ')} are already added to this bill.`);
            return;
        }

        // Check duplicates in Inventory
        const existingInventorySerials = item.serialNumbers || [];
        const inventoryDuplicates = serialList.filter(s => existingInventorySerials.includes(s));
        if (inventoryDuplicates.length > 0) {
            alert(`Error: The following Serial Numbers already exist in your Stock:\n${inventoryDuplicates.join(', ')}\n\nPlease use unique serial numbers.`);
            return;
        }
    } else {
        // Mode 2: Bulk (Optional Serials)
        const qty = parseInt(String(entryQuantity)) || 0;
        if (qty <= 0) {
            alert("Please enter a valid Quantity.");
            return;
        }
        // Generate internal placeholders to maintain stock count logic
        // These are marked with 'BULK-' prefix so we can hide them in UI later if needed
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        serialList = Array.from({ length: qty }).map((_, i) => `BULK-${timestamp}-${random}-${i}`);
    }

    const qty = serialList.length;
    const baseAmount = currentEntry.price * qty;
    const taxAmount = baseAmount * (currentEntry.gstPercentage / 100);
    const totalLineAmount = baseAmount + taxAmount;

    const newItem: PurchaseItem & { salePrice?: number } = {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        price: currentEntry.price,
        salePrice: currentEntry.salePrice,
        hsnCode: currentEntry.hsnCode,
        gstPercentage: currentEntry.gstPercentage,
        warrantyDays: currentEntry.warrantyDays,
        serialNumbers: serialList,
        taxAmount: taxAmount,
        subtotal: totalLineAmount 
    };

    setAddedItems(prev => [...prev, newItem]);
    
    setSelectedItemId('');
    setEntryQuantity('');
    setIsAutoGenerate(true);
    setCurrentEntry({ price: 0, salePrice: 0, hsnCode: '', gstPercentage: 0, warrantyDays: 0, serialsInput: '' });
  };

  const handleRemoveItem = (index: number) => {
      setAddedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickItemSave = async (itemData: Partial<Item>) => {
      if (!userId) return;
      try {
          const newItem = await addEntry(db, userId, 'inventory', { 
              ...itemData, 
              serialNumbers: [], 
              purchasePrice: 0, 
              salePrice: 0, 
              warrantyDays: 0,
              dateAdded: new Date().toISOString() 
          });
          setShowItemModal(false);
          // Auto select the new item
          if (newItem && newItem.id) {
             // Small delay to allow state propagation
             setTimeout(() => handleItemSelect(newItem.id), 500);
          }
      } catch (e) {
          console.error("Error creating item:", e);
      }
  };

  const calculateTotals = () => {
      const subtotal = addedItems.reduce((acc, i) => acc + (i.price * i.serialNumbers.length), 0);
      const totalTax = addedItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
      const grandTotal = addedItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { subtotal, totalTax, grandTotal };
  };

  const { subtotal, totalTax, grandTotal } = calculateTotals();

  const handleSave = async () => {
    if (!userId || !supplierName || addedItems.length === 0) return;

    try {
      // 1. Save Purchase Record
      const purchaseData: Omit<Purchase, 'id'> = {
        billNumber,
        supplierName,
        paymentTerms,
        date: new Date(date).toISOString(),
        totalAmount: parseFloat(grandTotal.toFixed(2)),
        items: addedItems
      };
      
      await addEntry(db, userId, 'purchases', purchaseData);

      // 2. Update Inventory - DIRECT STORAGE ACCESS METHOD
      // This bypasses any stale React state and reads the source of truth directly.
      
      const updates: Record<string, { serials: string[], price: number, salePrice: number, warranty: number }> = {};
      
      // Consolidate all additions by Item ID
      for (const item of addedItems) {
          if (!updates[item.itemId]) {
              updates[item.itemId] = { serials: [], price: item.price, salePrice: item.salePrice || 0, warranty: item.warrantyDays || 0 };
          }
          updates[item.itemId].serials.push(...item.serialNumbers);
          // Update price to latest entered
          updates[item.itemId].price = item.price;
          if (item.salePrice) updates[item.itemId].salePrice = item.salePrice;
          if (item.warrantyDays) updates[item.itemId].warranty = item.warrantyDays;
      }

      let updateCount = 0;

      for (const itemId in updates) {
          const updateData = updates[itemId];
          
          let currentItemData: Item | null = null;

          // Fetch Fresh Data
          if (db) {
             // Online
             const docRef = doc(db, `artifacts/${appId}/users/${userId}/inventory`, itemId);
             const snap = await getDoc(docRef);
             if (snap.exists()) {
                 currentItemData = { id: snap.id, ...snap.data() } as Item;
             }
          } else {
             // Offline
             const key = `smart_data_${userId}_inventory`;
             const raw = localStorage.getItem(key);
             const list = raw ? JSON.parse(raw) : [];
             currentItemData = list.find((i: any) => i.id === itemId) || null;
          }

          if (currentItemData) {
              const currentSerials = currentItemData.serialNumbers || [];
              const uniqueNew = updateData.serials.filter(sn => !currentSerials.includes(sn));
              const finalSerials = [...currentSerials, ...uniqueNew];

              const finalSalePrice = updateData.salePrice > 0 ? updateData.salePrice : (currentItemData.salePrice || 0);
              const finalWarranty = updateData.warranty > 0 ? updateData.warranty : (currentItemData.warrantyDays || 0);

              await updateEntry(db, userId, 'inventory', itemId, {
                  serialNumbers: finalSerials,
                  purchasePrice: updateData.price,
                  salePrice: finalSalePrice,
                  warrantyDays: finalWarranty
              });
              updateCount++;
          }
      }

      alert(`Success! Purchase saved and Stock updated for ${updateCount} items.`);
      setScreen('purchases');
    } catch (e) {
      console.error(e);
      alert("Error saving purchase. Please check console.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('purchases')} className="mr-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Purchase Bill</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 space-y-6">
        
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Bill Number" value={billNumber} onChange={e => setBillNumber(e.target.value)} required />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <Input label="Supplier Name" value={supplierName} onChange={e => setSupplierName(e.target.value)} required />
          <Input label="Payment Terms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, Cash" />
        </div>

        <hr className="border-gray-100" />

        {/* Add Item Form */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-gray-700 uppercase">Item Details</h3>
             {selectedItemId && (
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={isSerialized}
                        onChange={(e) => setIsSerialized(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center text-sm font-semibold text-gray-700">
                         <ScanBarcode className="w-4 h-4 mr-1 text-gray-500"/>
                         Track Serial Numbers?
                    </div>
                 </label>
             )}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
               {/* Row 1 */}
               <div className="md:col-span-4">
                   <label className="block text-xs font-medium text-gray-700 mb-1">Select Product</label>
                   <div className="flex gap-2">
                       <select 
                          className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm"
                          value={selectedItemId}
                          onChange={e => handleItemSelect(e.target.value)}
                       >
                           <option value="">-- Select Product --</option>
                           {items.map(i => (
                               <option key={i.id} value={i.id}>
                                   {i.name} ({i.serialNumbers?.length || 0} in stock)
                               </option>
                           ))}
                       </select>
                       <button 
                         onClick={() => setShowItemModal(true)}
                         className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                         title="Create New Item"
                       >
                         <PackagePlus className="w-5 h-5" />
                       </button>
                   </div>
               </div>

               <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm font-bold"
                      value={entryQuantity}
                      onChange={e => handleQuantityChange(e.target.value)}
                      disabled={!selectedItemId}
                      placeholder="Enter Qty"
                      min="1"
                   />
               </div>

                <div className="md:col-span-3 flex items-end pb-1">
                    {isSerialized && (
                        <label className={`flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded border shadow-sm w-full transition ${isAutoGenerate ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-white border-gray-300 text-gray-700'}`}>
                            <input 
                                type="checkbox" 
                                checked={isAutoGenerate}
                                onChange={(e) => handleAutoGenerateToggle(e.target.checked)}
                                className="rounded text-rose-600 focus:ring-rose-500"
                                disabled={!selectedItemId}
                            />
                            <div className="flex items-center text-xs font-bold">
                                <Wand2 className={`w-3 h-3 mr-1 ${isAutoGenerate ? 'text-rose-600' : 'text-gray-400'}`}/>
                                Auto-generate
                            </div>
                        </label>
                    )}
                </div>
               
               {/* Row 2 - Financials */}
               <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Rate</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm"
                      value={currentEntry.price}
                      onChange={e => handleEntryChange('price', parseFloat(e.target.value))}
                      disabled={!selectedItemId}
                   />
               </div>

                <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-emerald-700 mb-1">Selling Price (MRP)</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-emerald-300 rounded focus:ring-emerald-500 text-sm font-semibold"
                      value={currentEntry.salePrice}
                      onChange={e => handleEntryChange('salePrice', parseFloat(e.target.value))}
                      disabled={!selectedItemId}
                      placeholder="MRP"
                   />
               </div>

               <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
                   <select
                      className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm"
                      value={currentEntry.gstPercentage}
                      onChange={e => handleEntryChange('gstPercentage', parseFloat(e.target.value))}
                      disabled={!selectedItemId}
                   >
                       <option value="0">0%</option>
                       <option value="5">5%</option>
                       <option value="12">12%</option>
                       <option value="18">18%</option>
                       <option value="28">28%</option>
                   </select>
               </div>
               
                <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-gray-700 mb-1">Warranty (Days)</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm"
                      value={currentEntry.warrantyDays}
                      onChange={e => handleEntryChange('warrantyDays', parseFloat(e.target.value))}
                      disabled={!selectedItemId}
                   />
               </div>
               
                <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
                   <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-rose-500 text-sm"
                      value={currentEntry.hsnCode}
                      onChange={e => handleEntryChange('hsnCode', e.target.value)}
                      disabled={!selectedItemId}
                      placeholder="XXXX"
                   />
               </div>
           </div>

           {isSerialized && (
               <div className="mb-4 animate-fade-in">
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                       Serial Numbers {isAutoGenerate ? '(Auto Generated)' : '(Scan or Type manually)'}
                   </label>
                   <textarea 
                      className={`w-full p-2 border rounded focus:ring-rose-500 text-sm font-mono h-24 ${isAutoGenerate ? 'bg-gray-100 text-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Serial numbers will appear here..."
                      value={currentEntry.serialsInput}
                      onChange={e => handleSerialsInputChange(e.target.value)}
                      disabled={!selectedItemId}
                      readOnly={isAutoGenerate}
                   />
                   <p className="text-xs text-gray-500 mt-1 flex justify-between">
                       <span>Count: {currentEntry.serialsInput ? currentEntry.serialsInput.split(/[\n,]+/).filter(s=>s.trim()).length : 0} units</span>
                       {isAutoGenerate && (
                           <button onClick={() => handleQuantityChange(String(entryQuantity))} className="text-indigo-600 hover:underline flex items-center text-xs">
                              <RefreshCw className="w-3 h-3 mr-1" /> Regenerate IDs
                           </button>
                       )}
                   </p>
               </div>
           )}

           <button 
              onClick={handleAddItemToList}
              disabled={!selectedItemId || (isSerialized && !currentEntry.serialsInput) || (!isSerialized && !entryQuantity)}
              className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center transition ${!selectedItemId ? 'bg-gray-300 text-gray-500' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
           >
               <Plus className="w-4 h-4 mr-2" />
               Add Item to Bill
           </button>
        </div>

        {/* Item List Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">MRP</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">GST</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {addedItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No items added to this bill yet.</td></tr>
              ) : (
                addedItems.map((item, idx) => {
                  const isBulk = item.serialNumbers.some(s => s.startsWith('BULK-'));
                  return (
                    <tr key={idx}>
                        <td className="px-4 py-3">
                            <div className="font-medium text-sm text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">Warranty: {item.warrantyDays} days</div>
                            {isBulk ? (
                                <div className="text-[10px] text-gray-400 mt-1 italic">Bulk Item (No Serials)</div>
                            ) : (
                                <div className="text-[10px] text-gray-400 mt-1 max-w-xs break-all truncate">{item.serialNumbers.join(', ')}</div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">{formatCurrency(item.salePrice || 0)}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">{item.serialNumbers.length}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                            <div>{item.gstPercentage}%</div>
                            <div className="text-xs text-gray-400">{formatCurrency(item.taxAmount || 0)}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-rose-600">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                        </button>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {addedItems.length > 0 && (
                <tfoot className="bg-gray-50">
                    <tr>
                        <td colSpan={3}></td>
                        <td className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Subtotal:</td>
                        <td colSpan={2} className="px-4 py-2 text-right font-bold">{formatCurrency(subtotal)}</td>
                        <td></td>
                    </tr>
                     <tr>
                        <td colSpan={3}></td>
                        <td className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Total Tax:</td>
                        <td colSpan={2} className="px-4 py-2 text-right font-bold text-gray-600">{formatCurrency(totalTax)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colSpan={3}></td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 uppercase border-t border-gray-300">Grand Total:</td>
                        <td colSpan={2} className="px-4 py-2 text-right text-lg font-bold text-rose-600 border-t border-gray-300">{formatCurrency(grandTotal)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-6 border-t border-gray-100 gap-4">
          <button onClick={() => setScreen('purchases')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
             onClick={handleSave} 
             disabled={addedItems.length === 0 || !supplierName}
             className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg flex items-center ${
               addedItems.length === 0 || !supplierName ? 'bg-gray-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
             }`}
          >
            <Save className="w-5 h-5 mr-2" />
            Save Purchase & Update Stock
          </button>
        </div>
      </div>

      {showItemModal && (
          <ItemModal 
             item={null} 
             onClose={() => setShowItemModal(false)}
             onSave={handleQuickItemSave}
          />
      )}
    </div>
  );
};

export default NewPurchaseScreen;