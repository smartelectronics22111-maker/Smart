
export interface Item {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  unit: string;
  serialNumbers: string[];
  warrantyDays: number;
  dateAdded?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstin: string;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  serialNumber: string;
  warrantyEndDate: string;
  hsnCode?: string;
  gstPercentage?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress?: string;
  customerGstin?: string;
  customerPhone?: string;
  customerPan?: string;
  date: string;
  totalAmount: number;
  items: InvoiceItem[];
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  terms?: string;
  challanNo?: string;
  challanDate?: string;
}

export interface PurchaseItem {
  itemId: string;
  name: string;
  price: number;
  salePrice?: number;
  unit: string;
  serialNumbers: string[];
  subtotal: number;
  hsnCode?: string;
  gstPercentage?: number;
  warrantyDays?: number;
  taxAmount?: number;
}

export interface Purchase {
  id: string;
  billNumber: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  paymentTerms?: string;
  items: PurchaseItem[];
}

export interface DashboardWidgets {
  showSummary: boolean;
  showChart: boolean;
  showLowStock: boolean;
  showSyncCard?: boolean;
  showInventory?: boolean;
}

export interface CompanySettings {
  name: string;
  gstin: string;
  pan?: string;
  address: string;
  phone: string;
  logoUrl?: string;
  businessDetails?: string;
  theme?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  msmeNo?: string;
  dashboardConfig?: DashboardWidgets;
}

export interface QuotationItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  date: string;
  totalAmount: number;
  items: QuotationItem[];
}

export type Firestore = any;
export type Auth = any;
export type User = any;
