
import React from 'react';
import { LayoutDashboard, Package, FileText, ShoppingCart, Settings, Users, BarChart3, FileBadge, LogOut, X, ShieldAlert } from 'lucide-react';
import { CompanySettings, Auth } from '../types';
import { logout } from '../services/firebase';

interface SidebarProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  userId: string | null;
  companySettings: CompanySettings | null;
  auth: Auth | null;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, userId, companySettings, auth, isOpen, onClose }) => {
  const theme = companySettings?.theme || 'indigo';
  const isMasterAdmin = userId === 'mock_admin_smart_electronics' || auth?.currentUser?.email === 'smartelectronics22111@gmail.com';

  const navItems = [
    { name: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
    { name: 'Items (Inventory)', screen: 'items', icon: Package },
    { name: 'Sales (Invoices)', screen: 'invoices', icon: FileText },
    { name: 'Quotations', screen: 'quotations', icon: FileBadge },
    { name: 'Purchases', screen: 'purchases', icon: ShoppingCart },
    { name: 'Customers', screen: 'customers', icon: Users },
    { name: 'Reports', screen: 'reports', icon: BarChart3 },
    { name: 'Settings', screen: 'settings', icon: Settings },
  ];

  if (isMasterAdmin) {
    navItems.push({ name: 'Manage Users', screen: 'user-management', icon: ShieldAlert });
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout(auth);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 md:w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full bg-${theme}-900 text-white p-4 space-y-4 shadow-2xl md:shadow-xl
      `}>
        
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            {companySettings?.logoUrl ? (
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className={`bg-${theme}-500 p-2 rounded-lg flex-shrink-0`}>
                <FileText className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`text-xl font-bold tracking-wide text-${theme}-100 leading-tight truncate`}>
              {companySettings?.name ? (
                <span className="truncate block">{companySettings.name}</span>
              ) : (
                "SMART ELECTRONICS"
              )}
            </div>
          </div>
          {/* Close Button (Mobile Only) */}
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => setScreen(item.screen)}
                className={`w-full text-left flex items-center p-3 rounded-lg transition duration-200 ease-in-out ${
                  isActive
                    ? `bg-${theme}-700 text-white shadow-lg ring-1 ring-${theme}-600`
                    : `hover:bg-${theme}-800/50 text-${theme}-300 hover:text-white`
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <button
            onClick={handleLogout}
            className={`w-full text-left flex items-center p-3 rounded-lg hover:bg-red-600/80 text-${theme}-200 hover:text-white transition duration-200`}
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>

          <div className={`p-4 bg-${theme}-950/50 rounded-lg border border-${theme}-800/50 hidden md:block`}>
            <p className={`text-xs text-${theme}-400 font-semibold mb-1 uppercase tracking-wider`}>User ID</p>
            <div className={`text-xs text-${theme}-200 overflow-hidden break-all font-mono opacity-75`}>
              {auth?.currentUser?.email || (userId === 'mock_admin_smart_electronics' ? 'Master Admin' : userId) || 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
