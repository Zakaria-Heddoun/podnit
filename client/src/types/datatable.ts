// TypeScript interfaces and types for DataTable component

// Generic interface for data table columns
export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Interface for data table props
export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  paginated?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
}

// Sort direction type
export type SortDirection = 'asc' | 'desc' | null;

// Pagination info interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startEntry: number;
  endEntry: number;
}

// Filter interface for advanced filtering
export interface DataTableFilter {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

// Sort configuration interface
export interface SortConfig<T> {
  column: keyof T | null;
  direction: SortDirection;
}

// Selection state interface
export interface SelectionState<T> {
  selectedRows: T[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

// Data table state interface
export interface DataTableState<T> {
  search: string;
  currentPage: number;
  pageSize: number;
  sortConfig: SortConfig<T>;
  filters: DataTableFilter[];
  selection: SelectionState<T>;
}

// Action types for data table reducer
export type DataTableAction<T> =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SET_SORT'; payload: SortConfig<T> }
  | { type: 'ADD_FILTER'; payload: DataTableFilter }
  | { type: 'REMOVE_FILTER'; payload: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SELECT_ROW'; payload: T }
  | { type: 'SELECT_ALL'; payload: T[] }
  | { type: 'CLEAR_SELECTION' };

// Common data types for sample data
export interface User {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: "Active" | "Pending" | "Cancel";
  budget: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  status: "Delivered" | "Pending" | "Canceled";
  image: string;
  stock?: number;
  rating?: number;
  orderCount?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  product: string;
  amount: number;
  status: "Completed" | "Processing" | "Cancelled" | "Refunded";
  date: string;
  paymentMethod?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Return {
  id: number;
  returnNumber: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  product: string;
  templateName: string;
  amount: number;
  status: "Approved" | "Pending" | "Rejected" | "Refunded";
  date: string;
  reason?: string;
}

export interface Seller {
  id: number;
  name: string;
  email: string;
  phone?: string;
  brand_name?: string;
  cin?: string;
  bank_name?: string;
  rib?: string;
  balance?: number;
  points?: number;
  is_verified?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Utility types
export type DataTableSize = 'sm' | 'md' | 'lg';
export type DataTableVariant = 'default' | 'striped' | 'bordered';

// Export default configuration
export const DEFAULT_DATA_TABLE_CONFIG = {
  searchable: true,
  paginated: true,
  defaultPageSize: 10,
  pageSizeOptions: [5, 8, 10, 20, 50],
  searchPlaceholder: "Search...",
  emptyMessage: "No data found",
  loading: false,
  selectable: false,
} as const;