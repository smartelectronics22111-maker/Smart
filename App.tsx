
import React, { useState } from 'react';
import { useFirebase, useFirestoreData, useCompanySettings } from './services/firebase';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import ItemsScreen from './screens/ItemsScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import NewInvoiceScreen from './screens/NewInvoiceScreen';
import PurchasesScreen from './screens/PurchasesScreen';
import NewPurchaseScreen from './screens/NewPurchaseScreen';
import SettingsScreen from './screens/SettingsScreen';
import CustomersScreen from './screens/CustomersScreen';
import ReportsScreen from './screens/ReportsScreen';
import QuotationsScreen from './screens/QuotationsScreen';
import NewQuotationScreen from './screens/NewQuotationScreen';
import AuthScreen from './screens/AuthScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import { Item, Invoice, Purchase, Customer, Quotation } from './types';
// Fix: Added missing Cloud icon import from lucide-react
import { Menu, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const { db, auth, userId, currentUser, isAuthReady, appId, provider } = useFirebase();
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Data Fetching
  const { data: items } = useFirestoreData<Item>(db, userId, 'inventory', isAuthReady);
  const { data: invoices } = useFirestoreData<Invoice>(db, userId, 'invoices', isAuthReady);
  const { data: purchases } = useFirestoreData<Purchase>(db, userId, 'purchases', isAuthReady);
  const { data: customers } = useFirestoreData<Customer>(db, userId, 'customers', isAuthReady);
  const { data: quotations } = useFirestoreData<Quotation>(db, userId, 'quotations', isAuthReady);
  const { settings } = useCompanySettings(db, userId, isAuthReady);

  // 1. Loading State
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Initializing Secure App...</p>
        </div>
      </div>
    );
  }

  // 2. Auth State (Login Screen)
  // If no provider selected, allow mock login. If provider selected, redirect to their auth logic if needed.
  if (!userId) {
    return <AuthScreen auth={auth} />;
  }

  // 3. Main App State
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard items={items} invoices={invoices} purchases={purchases} companySettings={settings} db={db} userId={userId} />;
      case 'items':
        return <ItemsScreen items={items} db={db} userId={userId} appId={appId} />;
      case 'invoices':
        return <InvoicesScreen invoices={invoices} setScreen={setCurrentScreen} db={db} userId={userId} appId={appId} companySettings={settings} />;
      case 'new-invoice':
        return <NewInvoiceScreen items={items} customers={customers} db={db} userId={userId} appId={appId} setScreen={setCurrentScreen} invoices={invoices} />;
      case 'quotations':
        return <QuotationsScreen quotations={quotations} setScreen={setCurrentScreen} db={db} userId={userId} appId={appId} companySettings={settings} />;
      case 'new-quotation':
        return <NewQuotationScreen items={items} customers={customers} db={db} userId={userId} appId={appId} setScreen={setCurrentScreen} quotations={quotations} />;
      case 'purchases':
        return <PurchasesScreen purchases={purchases} setScreen={setCurrentScreen} db={db} userId={userId} appId={appId} />;
      case 'new-purchase':
        return <NewPurchaseScreen items={items} db={db} userId={userId} appId={appId} setScreen={setCurrentScreen} purchases={purchases} />;
      case 'customers':
        return <CustomersScreen customers={customers} db={db} userId={userId} appId={appId} />;
      case 'reports':
        return <ReportsScreen items={items} invoices={invoices} purchases={purchases} />;
      case 'settings':
        return <SettingsScreen settings={settings} db={db} userId={userId} appId={appId} currentUser={currentUser} />;
      case 'user-management':
        return <UserManagementScreen />;
      default:
        return <Dashboard items={items} invoices={invoices} purchases={purchases} companySettings={settings} db={db} userId={userId} />;
    }
  };

  const theme = settings?.theme || 'indigo';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      <Sidebar 
        currentScreen={currentScreen} 
        setScreen={(screen) => { setCurrentScreen(screen); setIsSidebarOpen(false); }} 
        userId={userId} 
        companySettings={settings} 
        auth={auth} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className={`md:hidden bg-${theme}-900 text-white p-4 flex justify-between items-center shadow-md z-20 flex-shrink-0`}>
           <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-white/10 rounded">
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-bold text-lg truncate max-w-[200px]">{settings?.name || "SMART ELECTRONICS"}</span>
           </div>
           {provider !== 'none' && <Cloud className="w-4 h-4 text-emerald-400" />}
        </header>

        <main className="flex-1 overflow-auto relative w-full custom-scrollbar">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default App;
