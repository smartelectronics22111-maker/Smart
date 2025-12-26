
import React, { useState } from 'react';
import { Item, Invoice, Purchase } from '../types';
import { downloadCSV, formatDateInput, formatDateDisplay } from '../utils';
import { FileDown, Calendar, TrendingUp, DollarSign, Package, FileText } from 'lucide-react';
import Input from '../components/Input';

interface ReportsScreenProps {
  items: Item[];
  invoices: Invoice[];
  purchases: Purchase[];
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ items, invoices, purchases }) => {
  const [startDate, setStartDate] = useState(formatDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1))); // First day of current month
  const [endDate, setEndDate] = useState(formatDateInput(new Date()));

  // Filter Data Helpers
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      const d = new Date(inv.date).getTime();
      return d >= new Date(startDate).getTime() && d <= new Date(endDate + 'T23:59:59').getTime();
    });
  };

  const getFilteredPurchases = () => {
    return purchases.filter(pur => {
      const d = new Date(pur.date).getTime();
      return d >= new Date(startDate).getTime() && d <= new Date(endDate + 'T23:59:59').getTime();
    });
  };

  // 1. Sales Report / GSTR1
  const downloadGSTR1 = () => {
    const data = getFilteredInvoices();
    const headers = ['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'Rate', 'Taxable Value', 'Cess Amount'];
    
    const rows = data.map(inv => {
      const taxRate = 18;
      const taxableValue = (inv.totalAmount / (1 + taxRate / 100));
      
      return [
        inv.customerGstin || '', 
        inv.customerName, 
        inv.invoiceNumber, 
        formatDateDisplay(inv.date), 
        inv.totalAmount.toFixed(2), 
        'Gujarat', 
        'No', 
        'Regular', 
        taxRate + '%', 
        taxableValue.toFixed(2), 
        '0'
      ];
    });

    downloadCSV(`GSTR1_Sales_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  const downloadSalesRegister = () => {
    const data = getFilteredInvoices();
    const headers = ['Date', 'Invoice No', 'Customer Name', 'Items Count', 'Total Amount'];
    const rows = data.map(inv => [
      formatDateDisplay(inv.date),
      inv.invoiceNumber,
      inv.customerName,
      inv.items.length,
      inv.totalAmount.toFixed(2)
    ]);
    downloadCSV(`Sales_Register_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  // 2. Purchase Report
  const downloadPurchaseRegister = () => {
    const data = getFilteredPurchases();
    const headers = ['Date', 'Bill No', 'Supplier Name', 'Total Amount'];
    const rows = data.map(pur => [
      formatDateDisplay(pur.date),
      pur.billNumber,
      pur.supplierName,
      pur.totalAmount.toFixed(2)
    ]);
    downloadCSV(`Purchase_Register_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  // 3. Stock Summary
  const downloadStockSummary = () => {
    const headers = ['Item Name', 'Unit', 'Purchase Price', 'Sale Price', 'Current Stock', 'Stock Value (Cost)'];
    const rows = items.map(item => [
      item.name,
      item.unit,
      item.purchasePrice,
      item.salePrice,
      item.serialNumbers.length,
      (item.serialNumbers.length * item.purchasePrice).toFixed(2)
    ]);
    downloadCSV(`Stock_Summary_${formatDateInput(new Date())}.csv`, [headers, ...rows]);
  };

  const downloadStockDetails = () => {
    const headers = ['Item Name', 'Serial Number', 'Warranty Days', 'Date Added', 'Status'];
    const rows: string[][] = [];
    items.forEach(item => {
        item.serialNumbers.forEach(sn => {
            rows.push([
                item.name,
                sn,
                item.warrantyDays.toString(),
                item.dateAdded ? formatDateDisplay(item.dateAdded) : '-',
                'In Stock'
            ]);
        });
    });
    downloadCSV(`Stock_Details_${formatDateInput(new Date())}.csv`, [headers, ...rows]);
  };

  // 4. Profit & Loss
  const downloadPnL = () => {
    const sales = getFilteredInvoices();
    const totalRevenue = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    let cogs = 0;
    sales.forEach(inv => {
        inv.items.forEach(invItem => {
            const originalItem = items.find(i => i.id === invItem.itemId);
            const cost = originalItem ? originalItem.purchasePrice : 0;
            cogs += (cost * invItem.quantity);
        });
    });

    const grossProfit = totalRevenue - cogs;

    const headers = ['Description', 'Amount'];
    const rows = [
        ['Sales Revenue', totalRevenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', cogs.toFixed(2)],
        ['Gross Profit', grossProfit.toFixed(2)],
        ['', ''],
        ['Net Profit', grossProfit.toFixed(2)] 
    ];

    downloadCSV(`Profit_Loss_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
  };

  // 5. Balance Sheet (Simplified)
  const downloadBalanceSheet = () => {
    const inventoryValue = items.reduce((sum, item) => sum + (item.purchasePrice * item.serialNumbers.length), 0);
    
    const headers = ['Liabilities', 'Amount', 'Assets', 'Amount'];
    const rows = [
        ['Capital Account', '-', 'Closing Stock', inventoryValue.toFixed(2)],
        ['Loans / Liability', '-', 'Cash / Bank', '-'],
        ['Sundry Creditors', '-', 'Sundry Debtors', '-'],
        ['Total', '-', 'Total', inventoryValue.toFixed(2)] 
    ];

    downloadCSV(`Balance_Sheet_as_of_${formatDateInput(new Date())}.csv`, [headers, ...rows]);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Download detailed financial and inventory reports.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-1/3">
            <Input label="From Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-full md:w-1/3">
            <Input label="To Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="pb-2 text-sm text-gray-500">
            Select date range for Sales, Purchase, and P&L reports.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Sales Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition">
            <div className="flex items-center mb-4 text-emerald-700">
                <FileText className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Sales Reports</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Export GSTR-1 filing format or detailed sales register.</p>
            <div className="space-y-3">
                <button onClick={downloadGSTR1} className="w-full flex items-center justify-between px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium transition">
                    <span>GSTR-1 Excel/CSV</span>
                    <FileDown className="w-4 h-4" />
                </button>
                <button onClick={downloadSalesRegister} className="w-full flex items-center justify-between px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium transition">
                    <span>Sales Register</span>
                    <FileDown className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Purchase Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100 hover:shadow-md transition">
            <div className="flex items-center mb-4 text-rose-700">
                <DollarSign className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Purchase Reports</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Detailed list of all purchase bills and supplier details.</p>
            <div className="space-y-3">
                <button onClick={downloadPurchaseRegister} className="w-full flex items-center justify-between px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 font-medium transition">
                    <span>Purchase Register</span>
                    <FileDown className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center mb-4 text-blue-700">
                <Package className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Inventory Reports</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Current stock valuation and detailed serial number list.</p>
            <div className="space-y-3">
                <button onClick={downloadStockSummary} className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition">
                    <span>Stock Summary</span>
                    <FileDown className="w-4 h-4" />
                </button>
                <button onClick={downloadStockDetails} className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition">
                    <span>Stock Details (Serials)</span>
                    <FileDown className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Financials Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition">
            <div className="flex items-center mb-4 text-indigo-700">
                <TrendingUp className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Financial Statements</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Profit & Loss Statement and Balance Sheet overview.</p>
            <div className="space-y-3">
                <button onClick={downloadPnL} className="w-full flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition">
                    <span>Profit & Loss</span>
                    <FileDown className="w-4 h-4" />
                </button>
                <button onClick={downloadBalanceSheet} className="w-full flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition">
                    <span>Balance Sheet</span>
                    <FileDown className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Consolidated */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-4 text-gray-700">
                    <Calendar className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-bold">Consolidated</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">Download all major reports in one click (Individual files).</p>
            </div>
            <button 
                onClick={() => {
                    downloadSalesRegister();
                    downloadPurchaseRegister();
                    downloadStockSummary();
                    downloadPnL();
                }} 
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium transition shadow-lg"
            >
                Download All Reports
            </button>
        </div>

      </div>
    </div>
  );
};

export default ReportsScreen;
