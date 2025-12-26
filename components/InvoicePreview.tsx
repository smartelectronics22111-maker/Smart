
import React from 'react';
import { Invoice, CompanySettings } from '../types';
import { formatCurrency, formatDateDisplay, numberToWords } from '../utils';
import { Printer, X, MessageCircle, Mail, QrCode, ShieldCheck } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
  companySettings: CompanySettings | null;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose, companySettings }) => {
  const defaultLogo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjIwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNMTEwIDQwIEgyMTAgQzIzMCA0MCAyNDAgNDUgMjQwIDY1IEMyNDAgODUgMjMwIDkwIDIxMCA5MCBIMTMwIEMxMTAgOTAgMTAwIDk1IDEwMCAxMTUgQzEwMCAxMzUgMTEwIDE0MCAxMzAgMTQwIEgyMzAiIHN0cm9rZT0iIzAxNjY5RSIgc3Ryb2tlLXdpZHRoPSIzMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTI2MCA0MCBIMzMwIE0yNjAgOTAgSDMxMCBNMjYwIDE0MCBIMzMwIE0yNjAgNDAgVjE0MCIgc3Ryb2tlPSIjRTExRDQ4IiBzdHJva2Utd2lkdGg9IjMwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMjQ1IDYwIEwyMjAgOTAgSDI2MCBMMjM1IDEyMCIgZmlsbD0iI0UxMUQ0OCIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTkwIiBmaWxsPSIjRTExRDQ4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TTUFSVDwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIxNSIgZmlsbD0iIzAxNjY5RSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjEwIj4tRUxFQ1RST05JQ1MtPC90ZXh0Pgo8L3N2Zz4=";

  const sellerInfo = companySettings || {
    name: "SMART ELECTRONICS",
    gstin: "24BAHPP3110Q1ZK",
    pan: "BAHPP3110Q",
    address: "1, UDWADA PARIA ROAD, NEAR JALARAMBAPA TAMPLE, TALAV FALIA, Goima, Valsad, Gujarat, 396145",
    phone: "8469622111",
    logoUrl: defaultLogo,
    businessDetails: "Wholesale Dealers in Electronics",
    bankName: "ICICI BANK LIMITED",
    bankBranch: "VALSAD BRANCH",
    accountNumber: "214505500409",
    ifscCode: "ICIC0002145",
    msmeNo: ""
  };

  const subTotal = invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = invoice.totalAmount;
  
  let discountAmount = 0;
  if (invoice.discountValue && invoice.discountValue > 0) {
      if (invoice.discountType === 'percentage') {
          discountAmount = subTotal * invoice.discountValue / 100;
      } else {
          discountAmount = invoice.discountValue;
      }
  }

  const taxableAmount = Math.max(0, subTotal - discountAmount);
  const totalGst = grandTotal - taxableAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  // HSN Breakdown
  const hsnBreakdown: Record<string, { taxable: number, gstRate: number, gstAmt: number }> = {};
  invoice.items.forEach(item => {
    const hsn = item.hsnCode || '84181090';
    const lineDiscountRatio = subTotal > 0 ? (subTotal - discountAmount) / subTotal : 1;
    const lineTaxable = item.subtotal * lineDiscountRatio;
    const lineGst = lineTaxable * (item.gstPercentage || 18) / 100;
    
    if (!hsnBreakdown[hsn]) {
      hsnBreakdown[hsn] = { taxable: 0, gstRate: item.gstPercentage || 18, gstAmt: 0 };
    }
    hsnBreakdown[hsn].taxable += lineTaxable;
    hsnBreakdown[hsn].gstAmt += lineGst;
  });

  const generateShareMessage = () => {
    return `*TAX INVOICE: ${invoice.invoiceNumber}*\n` +
      `Date: ${formatDateDisplay(invoice.date)}\n` +
      `Customer: ${invoice.customerName}\n` +
      `Grand Total: ${formatCurrency(grandTotal)}\n\n` +
      `Thank you for your business with ${sellerInfo.name}!`;
  };

  const handleWhatsAppShare = () => {
    const rawPhone = invoice.customerPhone || '';
    const phone = rawPhone.replace(/\D/g, '');
    const targetPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = encodeURIComponent(generateShareMessage());
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white md:rounded-xl shadow-2xl w-full max-w-5xl h-full md:h-auto md:my-8 flex flex-col max-h-none md:max-h-[95vh] print:shadow-none print:m-0 print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Screen Toolbar */}
        <div className="flex justify-between items-center p-4 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-bold text-gray-800">Invoice Preview</h3>
             <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono font-bold uppercase">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleWhatsAppShare} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Share on WhatsApp"><MessageCircle className="w-5 h-5" /></button>
            <button onClick={() => window.print()} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Print Invoice"><Printer className="w-5 h-5" /></button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Print Content */}
        <div className="overflow-y-auto flex-grow p-4 md:p-8 bg-gray-100 print:p-0 print:bg-white print:overflow-visible">
          <div id="invoice-print-area" className="bg-white text-gray-900 font-sans text-[11px] leading-tight print:w-full max-w-[210mm] mx-auto shadow-sm print:shadow-none border border-black min-h-[297mm] flex flex-col">
            
            {/* Header Section */}
            <div className="flex flex-col border-b border-black">
              <div className="flex justify-between items-start p-4 border-b border-black">
                 <div className="flex gap-4 items-center">
                    {sellerInfo.logoUrl && <img src={sellerInfo.logoUrl} className="h-20 w-auto" alt="Logo" />}
                    <div>
                       <h1 className="text-3xl font-black text-blue-900 uppercase leading-none tracking-tight">{sellerInfo.name}</h1>
                       <p className="text-[10px] text-gray-600 font-bold max-w-lg mt-1">{sellerInfo.businessDetails}</p>
                       <p className="text-[10px] text-gray-500">{sellerInfo.address}</p>
                       <p className="text-[10px] text-gray-500">Mo.: +91 {sellerInfo.phone} | Email: {sellerInfo.name.toLowerCase().replace(/\s/g, '')}@gmail.com</p>
                    </div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <span className="text-[12px] font-black text-gray-800 uppercase tracking-widest mb-1">Tax Invoice</span>
                    <div className="w-16 h-16 border border-gray-200 flex items-center justify-center p-1 bg-gray-50 opacity-20">
                       <QrCode className="w-full h-full text-black" />
                    </div>
                 </div>
              </div>

              {/* Info Grid */}
              <div className="flex border-t border-black">
                 <div className="w-2/3 border-r border-black p-3 space-y-1">
                    <div className="flex">
                       <span className="w-10 font-bold">M/s. :</span>
                       <div className="flex-1">
                          <p className="text-sm font-black uppercase">{invoice.customerName}</p>
                          <p className="text-gray-600 whitespace-pre-wrap">{invoice.customerAddress}</p>
                          <p className="mt-2">MO. : <span className="font-bold">{invoice.customerPhone || 'N/A'}</span></p>
                       </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 mt-2 grid grid-cols-2 gap-2 text-[10px]">
                       <p>GSTIN No. : <span className="font-bold">{invoice.customerGstin || 'Unregistered'}</span></p>
                       <p>PAN No. : <span className="font-bold">{invoice.customerPan || '-'}</span></p>
                       <p>Place of Supply : <span className="font-bold">24-Gujarat</span></p>
                    </div>
                 </div>
                 
                 <div className="w-1/3 relative">
                    <div className="absolute top-0 right-0 p-1 border-l border-b border-black text-[9px] font-black px-3 bg-gray-100 italic">Original</div>
                    <div className="p-3 space-y-1 mt-4">
                       <div className="grid grid-cols-2">
                          <span className="text-gray-500 font-bold uppercase text-[9px]">Invoice No.</span>
                          <span className="font-black">: {invoice.invoiceNumber}</span>
                       </div>
                       <div className="grid grid-cols-2">
                          <span className="text-gray-500 font-bold uppercase text-[9px]">Date</span>
                          <span className="font-black">: {formatDateDisplay(invoice.date)}</span>
                       </div>
                       <div className="grid grid-cols-2">
                          <span className="text-gray-500 font-bold uppercase text-[9px]">Challan No.</span>
                          <span className="font-bold">: {invoice.challanNo || invoice.invoiceNumber}</span>
                       </div>
                       <div className="grid grid-cols-2">
                          <span className="text-gray-500 font-bold uppercase text-[9px]">Challan Date</span>
                          <span className="font-bold">: {formatDateDisplay(invoice.challanDate || invoice.date)}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Main Items Table */}
            <div className="flex-grow flex flex-col">
              <table className="w-full border-collapse">
                <thead className="text-center font-bold bg-gray-50 border-b border-black">
                  <tr>
                    <th className="border-r border-black p-1 w-8">SrNo</th>
                    <th className="border-r border-black p-1">Description of Goods</th>
                    <th className="border-r border-black p-1 w-16">HSN</th>
                    <th className="border-r border-black p-1 w-10">Qty</th>
                    <th className="border-r border-black p-1 w-16">Rate</th>
                    <th className="border-r border-black p-1 w-16">Taxable</th>
                    <th className="border-r border-black p-1 w-10">GST%</th>
                    <th className="border-r border-black p-1 w-16">GST Amt</th>
                    <th className="p-1 w-20">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {invoice.items.map((item, idx) => {
                    const lineDiscountRatio = subTotal > 0 ? (subTotal - discountAmount) / subTotal : 1;
                    const lineTaxable = item.subtotal * lineDiscountRatio;
                    const lineGst = lineTaxable * (item.gstPercentage || 18) / 100;
                    return (
                      <tr key={idx} className="h-12 align-top">
                        <td className="border-r border-black p-1 text-center font-bold text-gray-600">{idx + 1}</td>
                        <td className="border-r border-black p-1 pl-3">
                           <p className="font-black text-gray-800 uppercase">{item.name}</p>
                           <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[9px] font-mono text-gray-500">S/N: {item.serialNumber}</span>
                              <span className="text-[9px] font-bold text-indigo-600 flex items-center gap-1">
                                 <ShieldCheck className="w-3 h-3" /> Warranty Until: {item.warrantyEndDate}
                              </span>
                           </div>
                        </td>
                        <td className="border-r border-black p-1 text-center font-mono text-gray-500">{item.hsnCode || '84181090'}</td>
                        <td className="border-r border-black p-1 text-center font-black">{item.quantity.toFixed(1)}</td>
                        <td className="border-r border-black p-1 text-right pr-2">{item.price.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-right pr-2 font-bold">{lineTaxable.toFixed(2)}</td>
                        <td className="border-r border-black p-1 text-center text-[9px] font-bold text-gray-500">{item.gstPercentage || '18'}%</td>
                        <td className="border-r border-black p-1 text-right pr-2">{lineGst.toFixed(2)}</td>
                        <td className="p-1 text-right font-black pr-2">{(lineTaxable + lineGst).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-10">
                      <td className="border-r border-black p-1" colSpan={9}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GST Summary Table */}
            <div className="border-t border-black bg-gray-50">
               <div className="p-1 font-bold uppercase text-[9px] text-gray-500 text-center border-b border-black">Tax Summary (HSN Wise Breakdown)</div>
               <table className="w-full text-[9px] border-collapse">
                  <thead>
                     <tr className="border-b border-black font-bold">
                        <th className="border-r border-black p-1">HSN/SAC</th>
                        <th className="border-r border-black p-1">Taxable Value</th>
                        <th className="border-r border-black p-1">CGST Rate</th>
                        <th className="border-r border-black p-1">CGST Amount</th>
                        <th className="border-r border-black p-1">SGST Rate</th>
                        <th className="border-r border-black p-1">SGST Amount</th>
                        <th className="p-1">Total Tax</th>
                     </tr>
                  </thead>
                  <tbody>
                     {Object.entries(hsnBreakdown).map(([hsn, data], idx) => (
                        <tr key={idx} className="border-b border-black/5 text-center">
                           <td className="border-r border-black p-1 font-mono">{hsn}</td>
                           <td className="border-r border-black p-1">{data.taxable.toFixed(2)}</td>
                           <td className="border-r border-black p-1">{(data.gstRate / 2).toFixed(1)}%</td>
                           <td className="border-r border-black p-1">{(data.gstAmt / 2).toFixed(2)}</td>
                           <td className="border-r border-black p-1">{(data.gstRate / 2).toFixed(1)}%</td>
                           <td className="border-r border-black p-1">{(data.gstAmt / 2).toFixed(2)}</td>
                           <td className="p-1 font-bold">{data.gstAmt.toFixed(2)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Footer Summary Box */}
            <div className="mt-auto border-t border-black flex flex-col">
              <div className="flex border-b border-black bg-gray-50/50">
                 <div className="w-2/3 border-r border-black p-2 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                       <p className="text-[9px] font-bold text-gray-400 uppercase">GSTIN No. :</p>
                       <p className="text-[10px] font-black">{sellerInfo.gstin}</p>
                    </div>
                 </div>
                 <div className="w-1/3 flex">
                    <div className="w-1/2 p-1 border-r border-black text-center font-bold text-lg">{invoice.items.reduce((sum, i) => sum + i.quantity, 0).toFixed(1)}</div>
                    <div className="w-1/2 flex items-center justify-between p-2 font-black uppercase text-[9px]">
                       <span>Line Totals</span>
                       <span className="text-xs">{taxableAmount.toFixed(2)}</span>
                    </div>
                 </div>
              </div>

              <div className="flex h-36 border-b border-black">
                 <div className="w-2/3 border-r border-black flex flex-col">
                    <div className="p-3 border-b border-gray-100 flex-1">
                       <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 italic">Amount Chargeable (in words) :</p>
                       <p className="text-xs font-black capitalize italic">{numberToWords(Math.round(grandTotal))}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 grid grid-cols-12 gap-1 text-[9px]">
                       <div className="col-span-3 text-gray-500 font-bold uppercase">Bank Name</div>
                       <div className="col-span-9 font-black">: {sellerInfo.bankName}</div>
                       <div className="col-span-3 text-gray-500 font-bold uppercase">A/c Holder</div>
                       <div className="col-span-9 font-black uppercase">: {sellerInfo.name}</div>
                       <div className="col-span-3 text-gray-500 font-bold uppercase">Bank A/c. No.</div>
                       <div className="col-span-9 font-black">: {sellerInfo.accountNumber}</div>
                       <div className="col-span-3 text-gray-500 font-bold uppercase">IFSC Code</div>
                       <div className="col-span-9 font-black">: {sellerInfo.ifscCode}</div>
                    </div>
                 </div>
                 
                 <div className="w-1/3 flex flex-col text-[10px]">
                    <div className="flex justify-between p-1.5 border-b border-gray-100">
                       <span className="text-gray-500 font-bold uppercase">Total Taxable</span>
                       <span className="font-black">{taxableAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-1.5 border-b border-gray-100">
                       <span className="text-gray-500 font-bold uppercase">Add CGST (9%)</span>
                       <span className="font-black">{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-1.5 border-b border-black">
                       <span className="text-gray-500 font-bold uppercase">Add SGST (9%)</span>
                       <span className="font-black">{sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between p-2 bg-gray-100 font-black text-xl border-t border-black shadow-inner">
                       <span className="uppercase text-[10px] font-bold text-gray-600">Total</span>
                       <span className="tracking-tighter">₹ {grandTotal.toFixed(2)}</span>
                    </div>
                 </div>
              </div>

              <div className="flex p-3 h-24">
                 <div className="w-2/3 pr-4">
                    <p className="text-[9px] font-bold uppercase mb-1 border-b border-gray-100 pb-1">Terms & Conditions :</p>
                    <ol className="text-[8px] text-gray-500 list-decimal list-inside space-y-0.5 leading-tight">
                       <li>Goods once Sold will not be taken back.</li>
                       <li>Manufacturing defects settled by company only.</li>
                       <li>Warranty as per company policy mentioned above.</li>
                       <li>Subject to local jurisdiction.</li>
                    </ol>
                 </div>
                 <div className="w-1/3 text-right flex flex-col justify-between pl-4">
                    <p className="font-black text-[10px] uppercase text-gray-600">For, {sellerInfo.name}</p>
                    <div className="h-8"></div>
                    <div className="border-t border-black pt-1 inline-block self-end w-40 text-center">
                       <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">(Authorised Signatory)</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-4 print:hidden">This is a computer generated invoice and does not require signature.</p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3 rounded-b-xl print:hidden flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Close</button>
          <button onClick={() => window.print()} className="px-8 py-2 bg-indigo-600 text-white font-black rounded-lg shadow-lg hover:bg-indigo-700 transition flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
