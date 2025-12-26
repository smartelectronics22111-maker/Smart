export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

export const formatDateInput = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const formatDateDisplay = (isoString: string): string => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const calculateWarrantyEndDate = (dateString: string, days: number): string => {
  if (!dateString || days === undefined || days === 0) return 'No Warranty';
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDateDisplay(date.toISOString());
};

export const numberToWords = (n: number): string => {
  if (n === 0) return "Zero";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (num: number): string => {
      if (num < 20) return units[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + units[num % 10] : "");
      if (num < 1000) return units[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
      return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  }
  return convert(Math.floor(n)) + " Rupees Only";
};

export const downloadCSV = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};