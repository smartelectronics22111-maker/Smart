
import React, { useState, useEffect, useRef } from 'react';
import { CompanySettings, Firestore, User } from '../types';
// @ts-ignore
import { saveSettings, syncLocalToCloud, getCloudProvider, setCloudProvider } from '../services/firebase';
import Input from '../components/Input';
import { Save, Image as ImageIcon, Briefcase, Layout, Palette, Check, Lock, Download, Upload, AlertCircle, Cloud, Wifi, WifiOff, RefreshCw, Server, LogOut, Database, CreditCard, Building2 } from 'lucide-react';

interface SettingsScreenProps {
  settings: CompanySettings | null;
  db: Firestore | null;
  userId: string | null;
  appId: string;
  currentUser: User | null;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, db, userId, appId, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud' | 'security'>('profile');
  const [currentProvider, setCurrentProvider] = useState(getCloudProvider());

  const defaultLogo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjIwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMTEwIDQwIEgyMTAgQzIzMCA0MCAyNDAgNDUgMjQwIDY1IEMyNDAgODUgMjMwIDkwIDIxMCA5MCBIMTMwIEMxMTAgOTAgMTAwIDk1IDEwMCAxMTUgQzEwMCAxMzUgMTEwIDE0MCAxMzAgMTQwIEgyMzAiIHN0cm9rZT0iIzAxNjY5RSIgc3Ryb2tlLXdpZHRoPSIzMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTI2MCA0MCBIMzMwIE0yNjAgOTAgSDMxMCBNMjYwIDE0MCBIMzMwIE0yNjAgNDAgVjE0MCIgc3Ryb2tlPSIjRTExRDQ4IiBzdHJva2Utd2lkdGg9IjMwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMjQ1IDYwIEwyMjAgOTAgSDI2MCBMMjM1IDEyMCIgZmlsbD0iI0UxMUQ0OCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTkwIiBmaWxsPSIjRTExRDQ4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TTUFSVDwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIxNSIgZmlsbD0iIzAxNjY5RSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjEwIj4tRUxFQ1RST05JQ1MtPC90ZXh0Pgo8L3N2Zz4=";

  const [formData, setFormData] = useState<CompanySettings>({
    name: 'SMART ELECTRONICS',
    gstin: '24BAHPP3110Q1ZK',
    pan: 'BAHPP3110Q',
    address: '1, UDWADA PARIA ROAD, NEAR JALARAMBAPA TAMPLE, TALAV FALIA, Goima, Valsad, Gujarat, 396145',
    phone: '8469622111',
    logoUrl: defaultLogo,
    businessDetails: 'Wholesale Dealers in Electronics',
    bankName: 'ICICI BANK LIMITED',
    bankBranch: 'VALSAD BRANCH',
    accountNumber: '214505500409',
    ifscCode: 'ICIC0002145',
    msmeNo: '',
    theme: 'indigo',
    dashboardConfig: { showSummary: true, showChart: true, showLowStock: true, showSyncCard: true, showInventory: true }
  });

  const [firebaseConfigInput, setFirebaseConfigInput] = useState(localStorage.getItem('custom_firebase_config') || '');
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('custom_supabase_config') ? JSON.parse(localStorage.getItem('custom_supabase_config')!).url : '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('custom_supabase_config') ? JSON.parse(localStorage.getItem('custom_supabase_config')!).key : '');
  
  const [msg, setMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings,
        logoUrl: settings.logoUrl || defaultLogo,
        dashboardConfig: { ...formData.dashboardConfig, ...settings.dashboardConfig }
      });
    }
  }, [settings]);

  const handleConnectFirebase = () => {
    try {
      const parsed = JSON.parse(firebaseConfigInput.trim());
      if (!parsed.apiKey || !parsed.projectId) throw new Error("Invalid Config");
      localStorage.setItem('custom_firebase_config', JSON.stringify(parsed));
      setCloudProvider('firebase');
      alert("Firebase Connected! Reloading...");
      window.location.reload();
    } catch (e) {
      alert("Invalid JSON format. Paste the full config object.");
    }
  };

  const handleConnectSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
      alert("Please provide both URL and Anon Key.");
      return;
    }
    localStorage.setItem('custom_supabase_config', JSON.stringify({ url: supabaseUrl, key: supabaseKey }));
    setCloudProvider('supabase');
    alert("Supabase Connected! Reloading...");
    window.location.reload();
  };

  const handleDisconnect = () => {
    if (confirm("Disconnect cloud server? App will revert to local storage.")) {
      setCloudProvider('none');
      window.location.reload();
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setMsg('Saving...');
    await saveSettings(db, userId, formData);
    setMsg('Profile Updated!');
    setTimeout(() => setMsg(''), 3000);
  };

  const themes = [
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-600' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-600' },
    { name: 'Emerald', value: 'emerald', class: 'bg-emerald-600' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-600' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl animate-fade-in pb-20 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Configure your business profiles, branding, and cloud sync.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>Profile & Branding</button>
            <button onClick={() => setActiveTab('cloud')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition flex items-center ${activeTab === 'cloud' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}><Cloud className="w-4 h-4 mr-2" />Cloud Sync</button>
            <button onClick={() => setActiveTab('security')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'security' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>Security</button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Company Identity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h3 className="text-lg font-bold flex items-center border-b pb-3 text-gray-800"><Briefcase className="w-5 h-5 mr-2 text-indigo-500" /> Business Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Business Legal Name" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Smart Electronics" />
                <Input label="Business Description" name="businessDetails" value={formData.businessDetails} onChange={e => setFormData({...formData, businessDetails: e.target.value})} placeholder="e.g., Wholesale Dealers" />
                <Input label="GSTIN Number" name="gstin" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} placeholder="24XXXXXXXXXXXX" />
                <Input label="PAN Number" name="pan" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} placeholder="XXXXX0000X" />
                <Input label="Phone Contact" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                <div className="md:col-span-2">
                  <Input label="Registered Address" name="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full office address" />
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h3 className="text-lg font-bold flex items-center border-b pb-3 text-gray-800"><Building2 className="w-5 h-5 mr-2 text-indigo-500" /> Bank Account (For Invoices)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="e.g., ICICI Bank" />
                <Input label="Branch Location" name="bankBranch" value={formData.bankBranch} onChange={e => setFormData({...formData, bankBranch: e.target.value})} placeholder="e.g., Valsad" />
                <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} placeholder="214505500409" />
                <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value})} placeholder="ICIC0002145" />
              </div>
            </div>
          </div>

          {/* Sidebar Settings (Logo & Theme) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-bold flex items-center border-b pb-3 text-gray-800"><ImageIcon className="w-5 h-5 mr-2 text-indigo-500" /> Branding</h3>
              <Input label="Company Logo URL" name="logoUrl" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
              <div className="mt-2 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex justify-center items-center">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} className="max-h-24 object-contain rounded" alt="Preview" />
                ) : (
                  <div className="text-gray-400 text-xs text-center italic">No logo provided.<br/>Using default text logo.</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-bold flex items-center border-b pb-3 text-gray-800"><Palette className="w-5 h-5 mr-2 text-indigo-500" /> UI Theme</h3>
              <div className="flex flex-wrap gap-4">
                {themes.map(t => (
                  <button key={t.value} onClick={() => setFormData({...formData, theme: t.value})} className={`w-12 h-12 rounded-xl ${t.class} flex items-center justify-center transition shadow-sm hover:scale-105 ${formData.theme === t.value ? 'ring-4 ring-offset-2 ring-indigo-200' : ''}`}>
                    {formData.theme === t.value && <Check className="w-6 h-6 text-white" />}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-2">Choose your primary app color</p>
            </div>
          </div>
          
          <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-center p-6 bg-indigo-50 rounded-xl border border-indigo-100 gap-4 mt-4">
            <div className="flex items-center text-indigo-700">
               <AlertCircle className="w-5 h-5 mr-2" />
               <span className="text-sm font-medium">Changes apply immediately to new invoices.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-600 font-bold animate-pulse">{msg}</span>
              <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-12 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center">
                <Save className="w-5 h-5 mr-2" /> SAVE ALL SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cloud' && (
        <div className="max-w-4xl animate-fade-in space-y-6">
           <div className={`p-8 rounded-2xl shadow-xl text-white ${currentProvider === 'none' ? 'bg-gray-800' : currentProvider === 'firebase' ? 'bg-indigo-900' : 'bg-emerald-900'}`}>
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-2xl shadow-inner"><Wifi className="w-8 h-8 text-white" /></div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight uppercase">Cloud Storage Integration</h2>
                       <p className="opacity-70 text-sm font-medium">Provider: {currentProvider === 'none' ? 'OFFLINE (Local Device)' : currentProvider.toUpperCase()}</p>
                    </div>
                 </div>
                 {currentProvider !== 'none' && (
                    <button onClick={handleDisconnect} className="bg-white/10 hover:bg-red-500/20 px-4 py-2 rounded-lg text-xs font-bold border border-white/20 transition">DISCONNECT SERVER</button>
                 )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border-2 transition cursor-pointer bg-white/5 hover:bg-white/10 ${currentProvider === 'firebase' ? 'border-yellow-400' : 'border-white/10'}`} onClick={() => setCurrentProvider('firebase')}>
                      <div className="flex items-center gap-3 mb-4"><img src="https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg" className="w-8 h-8" alt="FB" /><span className="font-black text-lg">Google Firebase</span></div>
                      {currentProvider === 'firebase' && (
                         <div className="space-y-4 animate-fade-in">
                            <textarea value={firebaseConfigInput} onChange={e => setFirebaseConfigInput(e.target.value)} placeholder='Paste JSON config...' className="w-full h-28 bg-black/40 border border-white/20 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-yellow-400 outline-none" />
                            <button onClick={handleConnectFirebase} className="w-full py-3 bg-yellow-400 text-indigo-950 font-black rounded-xl hover:bg-yellow-300 transition shadow-lg">CONNECT FIREBASE</button>
                         </div>
                      )}
                  </div>
                  <div className={`p-6 rounded-2xl border-2 transition cursor-pointer bg-white/5 hover:bg-white/10 ${currentProvider === 'supabase' ? 'border-emerald-400' : 'border-white/10'}`} onClick={() => setCurrentProvider('supabase')}>
                      <div className="flex items-center gap-3 mb-4"><Database className="w-8 h-8 text-emerald-400" /><span className="font-black text-lg">Supabase (PostgreSQL)</span></div>
                      {currentProvider === 'supabase' && (
                         <div className="space-y-4 animate-fade-in">
                            <input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="Supabase URL" className="w-full p-3 bg-black/40 border border-white/20 rounded-xl text-xs" />
                            <input value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} type="password" placeholder="Anon Public Key" className="w-full p-3 bg-black/40 border border-white/20 rounded-xl text-xs" />
                            <button onClick={handleConnectSupabase} className="w-full py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-400 transition shadow-lg">CONNECT SUPABASE</button>
                         </div>
                      )}
                  </div>
              </div>

              {currentProvider !== 'none' && (
                <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                   <div className="text-sm opacity-70">Already have offline data? Sync it now.</div>
                   <button onClick={async () => { setSyncStatus('Syncing...'); await syncLocalToCloud(db, userId!); setSyncStatus(''); }} className="bg-white text-gray-900 px-8 py-3 rounded-xl font-black hover:bg-gray-100 transition shadow-xl flex items-center gap-3">
                      <RefreshCw className={`w-5 h-5 ${syncStatus ? 'animate-spin' : ''}`} /> SYNC ALL DATA TO CLOUD
                   </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
