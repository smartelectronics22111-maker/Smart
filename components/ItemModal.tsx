
import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import Input from './Input';
import { X } from 'lucide-react';

interface ItemModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    purchasePrice: 0,
    salePrice: 0,
    unit: 'Pcs',
    warrantyDays: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        unit: item.unit,
        warrantyDays: item.warrantyDays || 0,
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all mx-4">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">{item ? 'Edit Inventory Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Item Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Wireless Mouse" required />
          
          <div className="grid grid-cols-1 gap-4">
            <Input label="Unit" name="unit" value={formData.unit} onChange={handleChange} placeholder="Pcs, Kg" required />
          </div>

          {/* Hidden inputs to ensure logic doesn't break */}
          <input type="hidden" name="purchasePrice" value={0} />
          <input type="hidden" name="salePrice" value={0} />
          <input type="hidden" name="warrantyDays" value={0} />

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
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
              {item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
