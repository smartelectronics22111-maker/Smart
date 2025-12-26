
import React, { useState } from 'react';
import { Item, Invoice, Purchase, CompanySettings, DashboardWidgets, Firestore } from '../types';
import { formatCurrency } from '../utils';
import { saveSettings } from '../services/firebase';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Download, HardDrive, Cloud, Layout, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  items: Item[];
  invoices: Invoice[];
  purchases: Purchase[];
  companySettings: CompanySettings | null;
  db: Firestore | null;
  userId: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ items, invoices, purchases, companySettings, db, userId }) => {
  const [showConfig, setShowConfig] = useState(false);
  const theme = companySettings?.theme || 'indigo';
  
  const showSummary = companySettings?.dashboardConfig?.showSummary ?? true;
  const showChart = companySettings?.dashboardConfig?.showChart ?? true;
  const showLowStock = companySettings?.dashboardConfig?.showLowStock ?? true;
  const showSyncCard = companySettings?.dashboardConfig?.showSyncCard ?? true;
  const showInventory = companySettings?.dashboardConfig?.showInventory ?? true;

  const isCloudConnected = !!localStorage.getItem('custom_firebase_config');

  const totalStockValue = items.reduce((sum, item) => sum + (item.purchasePrice * item.serialNumbers.length), 0);
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPurchases = purchases.reduce((sum, pur) => sum + pur.totalAmount, 0);
  const totalUnitsInStock = items.reduce((sum, item) => sum + item.serialNumbers.length, 0);
  const profitMargin = totalSales > 0 ? ((totalSales - totalPurchases) / totalSales) * 100 : 0;

  const lowStockItems = items.filter(item => item.serialNumbers.length < 5);

  const chartData = [
    { name: 'Sales', amount: totalSales },
    { name: 'Purchases', amount: totalPurchases },
    { name: 'Inventory', amount: totalStockValue },
  ];

  const chartColors = [
      theme === 'emerald' ? '#059669' : '#10b981', 
      theme === 'rose' ? '#e11d48' : '#f43f5e', 
      theme === 'indigo' ? '#4f46e5' : theme === 'blue' ? '#2563eb' : '#6366f1'
  ];

  const summaryCards = [
    { title: 'Total Revenue', value: formatCurrency(totalSales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Inventory Value', value: formatCurrency(totalStockValue), icon: DollarSign, color: `text-${theme}-600`, bg: `bg-${theme}-100` },
    { title: 'Units in Stock', value: totalUnitsInStock, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Purchases', value: formatCurrency(totalPurchases), icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const handleQuickBackup = () => {
      const userId = localStorage.getItem('smart_electronics_user_session') ? JSON.parse(localStorage.getItem('smart_electronics_user_session')!).uid : null;
      if (!userId) return;

      const collections = ['inventory', 'invoices', 'purchases', 'customers', 'quotations'];
      const data: Record<string, any> = { settings: companySettings };
      
      collections.forEach(col => {
          const key = `smart_data_${userId}_${col}`;
          const raw = localStorage.getItem(key);
          if (raw) data[col] = JSON.parse(raw);
      });
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartElectronics_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const toggleWidget = async (key: keyof DashboardWidgets) => {
    if (!userId) return;
    const currentConfig = companySettings?.dashboardConfig || { 
        showSummary: true, showChart: true, showLowStock: true, showSyncCard: true, showInventory: true
    };
    
    const newConfig = { ...currentConfig, [key]: !currentConfig[key] };
    
    const newSettings = { 
        ...companySettings!, 
        dashboardConfig: newConfig,
        name: companySettings?.name || '',
        gstin: companySettings?.gstin || '',
        address: companySettings?.address || '',
        phone: companySettings?.phone || ''
    };

    await saveSettings(db, userId, newSettings);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in relative">
      
      {showConfig && (
        <div className="absolute top-20 right-4 md:right-8 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 animate-fade-in">
           <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <Layout className="w-4 h-4 mr-2" /> Customize Layout
           </h4>
           <div className="space-y-2">
              <button onClick={() => toggleWidget('showSyncCard')} className="flex items-center w-full justify-between p-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                  <span>Storage Status</span>
                  {showSyncCard ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
               <button onClick={() => toggleWidget('showInventory')} className="flex items-center w-full justify-between p-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                  <span>Current Inventory</span>
                  {showInventory ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => toggleWidget('showSummary')} className="flex items-center w-full justify-between p-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                  <span>Summary Cards</span>
                  {showSummary ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => toggleWidget('showChart')} className="flex items-center w-full justify-between p-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                  <span>Financial Charts</span>
                  {showChart ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => toggleWidget('showLowStock')} className="flex items-center w-full justify-between p-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                  <span>Low Stock Alerts</span>
                  {showLowStock ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6 w-full">
          {companySettings?.logoUrl && (
            <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex items-center justify-center">
               <img src={companySettings.logoUrl} alt="Logo" className="h-20 md:h-24 w-auto object-contain" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">{companySettings?.name || 'Overview'}</h1>
            {companySettings?.businessDetails && (
              <p className={`text-sm text-${theme}-600 font-bold uppercase tracking-widest mt-1 line-clamp-2 md:line-clamp-none`}>
                {companySettings.businessDetails}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1 hidden md:block">Business Overview & Real-time Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`flex-1 md:flex-none px-3 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center shadow-sm ${showConfig ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
            >
                <Layout className="w-4 h-4 mr-2" />
                Customize
            </button>
            <div className={`hidden md:block px-4 py-2 bg-${theme}-50 text-${theme}-700 rounded-full text-sm font-semibold border border-${theme}-100 whitespace-nowrap shadow-sm`}>
               {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
      </div>

      {showSyncCard && (
          <div className={`rounded-xl p-6 text-white shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6 ${isCloudConnected ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-gray-800 to-gray-900'}`}>
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="p-3 bg-white/10 rounded-lg self-start">
                    {isCloudConnected ? <Cloud className="w-8 h-8 text-white" /> : <HardDrive className="w-8 h-8 text-blue-300" />}
                </div>
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 flex-wrap text-white">
                        Storage: <span className={isCloudConnected ? "text-white" : "text-blue-300"}>{isCloudConnected ? "CLOUD DATABASE (Online)" : "LOCAL DEVICE (Offline)"}</span>
                    </h3>
                    <p className="text-sm text-gray-100 mt-1 max-w-xl leading-relaxed">
                        {isCloudConnected 
                            ? "Your data is safely stored on the Cloud Server."
                            : "Your data is stored only in this browser. Backup recommended."
                        }
                    </p>
                </div>
             </div>
             {!isCloudConnected && (
                <button 
                    onClick={handleQuickBackup}
                    className="w-full lg:w-auto whitespace-nowrap px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Download Backup
                </button>
             )}
          </div>
      )}

      {/* Moved Inventory Table to Top */}
       {showInventory && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                    <span className="flex items-center"><Package className="w-5 h-5 mr-2 text-indigo-500" /> Current Stock Overview</span>
                    <span className="text-xs font-normal text-gray-500">Live Updates</span>
                </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Item Name</th>
                                <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Stock</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Purchase Rate</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Selling Price</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Value</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             {items.length === 0 ? (
                                 <tr><td colSpan={5} className="p-4 text-center text-gray-400">No stock available.</td></tr>
                             ) : (
                                 items.slice(0, 10).map(item => (
                                     <tr key={item.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.name}</td>
                                         <td className="px-4 py-2 text-center text-sm font-bold">
                                             <span className={item.serialNumbers.length < 5 ? "text-red-600" : "text-gray-700"}>{item.serialNumbers.length}</span>
                                         </td>
                                         <td className="px-4 py-2 text-right text-sm text-gray-500">{formatCurrency(item.purchasePrice)}</td>
                                         <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-600">{formatCurrency(item.salePrice)}</td>
                                         <td className="px-4 py-2 text-right text-sm text-gray-800">{formatCurrency(item.purchasePrice * item.serialNumbers.length)}</td>
                                     </tr>
                                 ))
                             )}
                        </tbody>
                    </table>
                    {items.length > 10 && (
                        <div className="text-center mt-2">
                            <span className="text-xs text-gray-400">Showing top 10 items. View 'Items' tab for full inventory.</span>
                        </div>
                    )}
                </div>
           </div>
       )}

      {showSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                {idx === 0 && profitMargin !== 0 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${profitMargin > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                    </span>
                )}
                </div>
                <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {showChart && (
            <div className={`${showLowStock ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-6 rounded-xl shadow-sm border border-gray-100`}>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Summary</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `₹${value/1000}k`} />
                    <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}

        {showLowStock && (
            <div className={`${showChart ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col`}>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                    Low Stock Alerts
                </h2>
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-80 lg:max-h-full">
                    {lowStockItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-10">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <p>Inventory looks healthy.</p>
                    </div>
                    ) : (
                    <ul className="space-y-3">
                        {lowStockItems.map(item => (
                        <li key={item.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <div className="overflow-hidden">
                            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-amber-700">Only {item.serialNumbers.length} left</p>
                            </div>
                            <span className="text-xs bg-white text-amber-600 px-2 py-1 rounded shadow-sm border border-amber-200 font-medium">
                            Low
                            </span>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
