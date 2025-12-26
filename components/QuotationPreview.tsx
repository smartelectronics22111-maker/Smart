
import React from 'react';
import { Quotation, CompanySettings } from '../types';
import { formatCurrency, formatDateDisplay, numberToWords } from '../utils';
import { Printer, X, MessageCircle } from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  onClose: () => void;
  companySettings: CompanySettings | null;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, onClose, companySettings }) => {
  const sellerInfo = companySettings || {
    name: "Your Company Name",
    gstin: "",
    address: "Update in Settings",
    phone: "",
    logoUrl: "",
    businessDetails: ""
  };

  const subTotal = quotation.items.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = quotation.totalAmount;

  const generateShareMessage = () => {
    return `*ESTIMATE: ${quotation.quotationNumber}*\n` +
      `Date: ${formatDateDisplay(quotation.date)}\n` +
      `Customer: ${quotation.customerName}\n` +
      `Total Amount: ${formatCurrency(grandTotal)}\n\n` +
      `Regards,\n${sellerInfo.name}`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white md:rounded-xl shadow-2xl w-full max-w-4xl h-full md:h-auto md:my-8 flex flex-col max-h-none md:max-h-[90vh] print:shadow-none print:m-0 print:max-w-none print:max-h-none print:rounded-none">
        {/* Screen-only Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl print:hidden flex-shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
            Quotation Preview
            <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">
              {quotation.quotationNumber}
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content (Print Area) */}
        <div className="overflow-y-auto flex-grow p-4 md:p-8 bg-gray-50 print:p-0 print:bg-white print:overflow-visible">
           <div id="quotation-print-area" className="bg-white text-gray-900 font-sans text-xs md:text-sm print:w-full">
              
              <div className="border border-gray-800">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start p-4 border-b border-gray-800 gap-4">
                  <div className="flex gap-4 items-start w-full sm:w-auto">
                    {sellerInfo.logoUrl && (
                      <img src={sellerInfo.logoUrl} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                    )}
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-indigo-900">{sellerInfo.name}</h1>
                      {sellerInfo.businessDetails && (
                        <p className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wider mt-1 mb-2 max-w-md leading-relaxed">
                          {sellerInfo.businessDetails}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-gray-600 max-w-sm">{sellerInfo.address}</p>
                      <div className="mt-2 text-xs text-gray-700">
                        <p>GSTIN: <span className="font-semibold">{sellerInfo.gstin || 'N/A'}</span></p>
                        <p>Phone: <span className="font-semibold">{sellerInfo.phone || 'N/A'}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto">
                    <h2 className="text-lg md:text-xl font-bold uppercase text-gray-600 border-2 border-gray-600 px-4 py-1 inline-block">Quotation</h2>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="flex flex-col sm:flex-row border-b border-gray-800">
                  <div className="w-full sm:w-1/2 p-4 border-b sm:border-b-0 sm:border-r border-gray-800">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quotation For:</p>
                    <p className="font-bold text-base">{quotation.customerName}</p>
                  </div>

                  <div className="w-full sm:w-1/2">
                    <div className="flex border-b border-gray-800">
                      <div className="w-1/2 p-2 border-r border-gray-800">
                        <p className="text-xs text-gray-500 uppercase">Quotation No.</p>
                        <p className="font-bold break-all">{quotation.quotationNumber}</p>
                      </div>
                      <div className="w-1/2 p-2">
                        <p className="text-xs text-gray-500 uppercase">Date</p>
                        <p className="font-bold">{formatDateDisplay(quotation.date)}</p>
                      </div>
                    </div>
                    <div className="p-2">
                       <p className="text-xs text-gray-500 uppercase">Valid Until</p>
                       <p className="font-semibold">15 Days from Date</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 text-xs uppercase border-b border-gray-800">
                        <th className="p-2 border-r border-gray-800 w-10 text-center">No</th>
                        <th className="p-2 border-r border-gray-800">Description</th>
                        <th className="p-2 border-r border-gray-800 text-center w-12">Qty</th>
                        <th className="p-2 border-r border-gray-800 text-right w-20">Rate</th>
                        <th className="p-2 text-right w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {quotation.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="p-2 border-r border-gray-800 text-center align-top">{index + 1}</td>
                          <td className="p-2 border-r border-gray-800 align-top font-medium">{item.name}</td>
                          <td className="p-2 border-r border-gray-800 text-center align-top">{item.quantity} {item.unit}</td>
                          <td className="p-2 border-r border-gray-800 text-right align-top">{formatCurrency(item.price)}</td>
                          <td className="p-2 text-right font-medium align-top">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex flex-col sm:flex-row border-b border-gray-800">
                   <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-gray-800 p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Amount in Words</p>
                      <p className="font-bold text-gray-800 italic capitalize">{numberToWords(Math.round(grandTotal))}</p>
                   </div>
                   <div className="w-full sm:w-1/3">
                      <div className="flex justify-between p-2 bg-gray-100 font-bold text-lg border-b border-gray-800">
                         <span>Total</span>
                         <span>{formatCurrency(grandTotal)}</span>
                      </div>
                   </div>
                </div>

                {/* Footer */}
                <div className="flex p-4">
                  <div className="w-1/2 pr-4">
                    <p className="text-xs font-bold uppercase mb-1">Terms</p>
                    <ul className="text-[10px] md:text-xs text-gray-600 list-disc list-inside space-y-0.5">
                      <li>Rates subject to change.</li>
                      <li>Estimate only.</li>
                    </ul>
                  </div>
                  <div className="w-1/2 text-right flex flex-col justify-between pl-4 border-l border-gray-200">
                    <p className="font-bold text-sm truncate">For {sellerInfo.name}</p>
                    <div className="h-12 md:h-16"></div>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase">Authorized Signatory</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white rounded-b-xl flex justify-between items-center print:hidden flex-shrink-0">
            <div className="flex gap-2">
              <button onClick={handleWhatsAppShare} className="flex items-center px-3 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition shadow-sm text-sm">
                <MessageCircle className="w-4 h-4 mr-1" /> Share
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => onClose()} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition text-sm">Close</button>
              <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition text-sm">
                <Printer className="w-4 h-4 mr-2" /> Print PDF
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
