"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Transaction interface for unified deposits and withdrawals
interface Transaction {
  id: number;
  transactionId: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  amount: number;
  currency: string;
  paymentMethod: "Bank Transfer" | "Withdrawal";
  status: "PENDING" | "VALIDATED" | "REJECTED" | "PROCESSED" | "CANCELLED";
  type: "Deposit" | "Withdrawal";
  date: string;
  fees?: number;
  adminNotes?: string;
  referenceNumber?: string;
  bankName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bankDetails?: any;
}

// API Response interfaces
interface DepositResponse {
  id: number;
  user_id: number;
  amount: number | string; // Can be string from API
  bank_name: string;
  receipt_image: string;
  reference_number?: string;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  admin_notes?: string;
  validated_by?: number;
  validated_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  validator?: {
    id: number;
    name: string;
  };
}

interface WithdrawalResponse {
  id: number;
  user_id: number;
  amount: number | string; // Can be string from API
  fee: number | string; // Can be string from API
  net_amount: number | string; // Can be string from API
  status: "PENDING" | "PROCESSED" | "REJECTED" | "CANCELLED";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bank_details: any;
  admin_notes?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  processor?: {
    id: number;
    name: string;
  };
}

export default function AdminTransactions() {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [approveTransaction, setApproveTransaction] = useState<Transaction | null>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectTransaction, setRejectTransaction] = useState<Transaction | null>(null);
  const [selectedPaymentMethod] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<string>("All");

  const statuses = ["All", "PENDING", "VALIDATED", "REJECTED", "PROCESSED", "CANCELLED"];
  const types = ["All", "Deposit", "Withdrawal"];
  const dateFilters = ["All", "Today", "This Week", "This Month", "Last 30 Days"];

  // Transform API responses to unified transaction format
  const transformDeposit = (deposit: DepositResponse): Transaction => {
    // Ensure amount is properly converted to number
    const amount = typeof deposit.amount === 'string' ? parseFloat(deposit.amount) : deposit.amount;

    const transactionId = `DEP-${deposit.id.toString().padStart(6, '0')}`;


    return {
      id: deposit.id,
      transactionId,
      customer: {
        name: deposit.user.name,
        email: deposit.user.email,
      },
      amount: amount,
      currency: "DH",
      paymentMethod: "Bank Transfer",
      status: deposit.status,
      type: "Deposit",
      date: deposit.created_at,
      fees: 0,
      adminNotes: deposit.admin_notes,
      referenceNumber: deposit.reference_number,
      bankName: deposit.bank_name,
    };
  };

  const transformWithdrawal = (withdrawal: WithdrawalResponse): Transaction => {
    // Ensure amount is properly converted to number
    const amount = typeof withdrawal.amount === 'string' ? parseFloat(withdrawal.amount) : withdrawal.amount;
    const fee = typeof withdrawal.fee === 'string' ? parseFloat(withdrawal.fee) : withdrawal.fee;

    const transactionId = `WITH-${withdrawal.id.toString().padStart(6, '0')}`;


    return {
      id: withdrawal.id,
      transactionId,
      customer: {
        name: withdrawal.user.name,
        email: withdrawal.user.email,
      },
      amount: amount,
      currency: "DH",
      paymentMethod: "Withdrawal",
      status: withdrawal.status,
      type: "Withdrawal",
      date: withdrawal.created_at,
      fees: fee,
      adminNotes: withdrawal.admin_notes,
      bankDetails: withdrawal.bank_details,
    };
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || !token || user.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

        // Fetch deposits and withdrawals simultaneously
        const [depositsResponse, withdrawalsResponse] = await Promise.all([
          fetch(`${API_URL}/api/admin/deposits`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/admin/withdrawals`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        const allTransactions: Transaction[] = [];

        // Process deposits
        if (depositsResponse.ok) {
          const depositsResult = await depositsResponse.json();
          if (depositsResult.success && depositsResult.data) {
            const depositsData = Array.isArray(depositsResult.data.data)
              ? depositsResult.data.data
              : Array.isArray(depositsResult.data)
                ? depositsResult.data
                : [];

            const depositTransactions = depositsData.map(transformDeposit);
            allTransactions.push(...depositTransactions);
          }
        }

        // Process withdrawals
        if (withdrawalsResponse.ok) {
          const withdrawalsResult = await withdrawalsResponse.json();
          if (withdrawalsResult.success && withdrawalsResult.data) {
            const withdrawalsData = Array.isArray(withdrawalsResult.data.data)
              ? withdrawalsResult.data.data
              : Array.isArray(withdrawalsResult.data)
                ? withdrawalsResult.data
                : [];

            const withdrawalTransactions = withdrawalsData.map(transformWithdrawal);
            allTransactions.push(...withdrawalTransactions);
          }
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(allTransactions);

      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, token]);

  const router = useRouter();

  // Handle viewing transaction details
  const handleViewTransaction = (transaction: Transaction) => {
    router.push(`/admin/transactions/${transaction.transactionId}`);
  };

  // Handle transaction actions
  const handleApproveClick = (transaction: Transaction) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    setApproveTransaction(transaction);
    setApproveConfirmOpen(true);
  };

  const handleApproveConfirm = async () => {
    const transaction = approveTransaction;
    if (!transaction || !token) return;
    setApproveConfirmOpen(false);
    setApproveTransaction(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const endpoint = transaction.type === 'Deposit'
        ? `${API_URL}/api/admin/deposits/${transaction.id}`
        : `${API_URL}/api/admin/withdrawals/${transaction.id}`;

      const status = transaction.type === 'Deposit' ? 'VALIDATED' : 'PROCESSED';


      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          admin_notes: `Approved by admin on ${new Date().toLocaleDateString()}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Transaction approved successfully!');
        // Refresh transactions
        window.location.reload();
      } else {
        console.error('Failed to approve:', data);
        toast.error(`Failed to approve transaction: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('An error occurred while approving the transaction');
    }
  };

  const handleRejectClick = (transaction: Transaction) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    setRejectTransaction(transaction);
    setRejectConfirmOpen(true);
  };

  const handleRejectConfirm = async () => {
    const transaction = rejectTransaction;
    if (!transaction || !token) return;
    setRejectConfirmOpen(false);
    setRejectTransaction(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const endpoint = transaction.type === 'Deposit'
        ? `${API_URL}/api/admin/deposits/${transaction.id}`
        : `${API_URL}/api/admin/withdrawals/${transaction.id}`;


      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          admin_notes: `Rejected by admin on ${new Date().toLocaleDateString()}`
        })
      });

      if (response.ok) {
        // Refresh transactions
        window.location.reload();
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('An error occurred while rejecting the transaction');
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch =
        transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "All" || transaction.status === selectedStatus;
      const matchesType = selectedType === "All" || transaction.type === selectedType;
      const matchesPaymentMethod = selectedPaymentMethod === "All" || transaction.paymentMethod === selectedPaymentMethod;

      // Simple date filtering
      let matchesDate = true;
      if (dateFilter !== "All") {
        const transactionDate = new Date(transaction.date);
        const today = new Date();

        switch (dateFilter) {
          case "Today":
            matchesDate = transactionDate.toDateString() === today.toDateString();
            break;
          case "This Week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= weekAgo;
            break;
          case "This Month":
            matchesDate = transactionDate.getMonth() === today.getMonth() &&
              transactionDate.getFullYear() === today.getFullYear();
            break;
          case "Last 30 Days":
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= thirtyDaysAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesPaymentMethod && matchesDate;
    });
  }, [transactions, searchTerm, selectedStatus, selectedType, selectedPaymentMethod, dateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalRevenue: 0,
        todaysDeposits: 0,
        pendingCount: 0,
        rejectedCount: 0,
        totalFees: 0,
        netRevenue: 0
      };
    }

    const validatedDeposits = transactions.filter(t => t.type === "Deposit" && t.status === "VALIDATED");
    const processedWithdrawals = transactions.filter(t => t.type === "Withdrawal" && t.status === "PROCESSED");

    const totalRevenue = validatedDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawals = processedWithdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fees || 0), 0);

    const today = new Date().toDateString();
    const todaysDeposits = validatedDeposits
      .filter(t => new Date(t.date).toDateString() === today)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingCount = transactions.filter(t => t.status === "PENDING").length;
    const rejectedCount = transactions.filter(t => t.status === "REJECTED" || t.status === "CANCELLED").length;

    return {
      totalRevenue,
      todaysDeposits,
      pendingCount,
      rejectedCount,
      totalFees,
      netRevenue: totalRevenue - totalWithdrawals - totalFees
    };
  }, [transactions]);

  const formatCurrency = (amount: number | undefined | null, currency: string = "DH") => {
    // Ensure we have a valid number
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (currency === "DH") {
      return `${safeAmount.toFixed(2)} DH`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(safeAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Check authentication and admin role
  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Transactions Management
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Monitor all financial transactions, payments, and revenue analytics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z" />
              <path d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </h4>
              <span className="text-sm font-medium">Total Deposits</span>
              <div className="mt-1">
                <span className="text-xs text-gray-500">Net: {formatCurrency(stats.netRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" />
              <path d="M19.7781 0.975006H18.8406L18.5906 2.84376C18.5563 3.23126 18.2375 3.53751 17.8156 3.53751H2.18438C1.76251 3.53751 1.44376 3.23126 1.40938 2.84376L1.15938 0.975006H0.221883C0.0968828 0.975006 -0.0281172 1.07501 -0.0281172 1.23751C-0.0281172 1.36251 0.0718828 1.49376 0.221883 1.49376H0.877508L1.43751 8.00001C1.47188 8.35001 1.76251 8.62501 2.1125 8.62501H17.8875C18.2375 8.62501 18.5281 8.35001 18.5625 8.00001L19.1225 1.49376H19.7781C19.9031 1.49376 20.0281 1.39376 20.0281 1.23126C20.0281 1.10001 19.9031 0.975006 19.7781 0.975006Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {formatCurrency(stats.todaysDeposits)}
              </h4>
              <span className="text-sm font-medium">Today&apos;s Deposits</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9344 19.7313 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37816 18.6313 2.44691 18.2188L4.12816 3.43751C4.19691 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1875 2.16563 17.8031 2.71563 17.8719 3.43751L19.5532 18.2188C19.6219 18.6313 19.4907 19.0438 19.2157 19.3531Z" />
              <path d="M14.3344 5.29375C13.8469 5.29375 13.4688 5.67188 13.4688 6.15938V8.625C13.4688 9.1125 13.8469 9.49063 14.3344 9.49063C14.8219 9.49063 15.2 9.1125 15.2 8.625V6.15938C15.2 5.67188 14.8219 5.29375 14.3344 5.29375Z" />
              <path d="M7.66559 5.29375C7.17809 5.29375 6.79996 5.67188 6.79996 6.15938V8.625C6.79996 9.1125 7.17809 9.49063 7.66559 9.49063C8.15309 9.49063 8.53121 9.1125 8.53121 8.625V6.15938C8.53121 5.67188 8.15309 5.29375 7.66559 5.29375Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.pendingCount}
              </h4>
              <span className="text-sm font-medium">Pending Transactions</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z" />
              <path d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z" />
              <path d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7781 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 17.0406 1.13428 17.5563 1.85303 17.5563H8.97178C9.69053 17.5563 10.2062 17.0406 10.2062 16.3219V13.8469C10.2062 13.2281 9.99678 12.6094 9.65303 12.0938C10.3468 11.6781 11.1499 11.4375 11.9187 11.4375H15.2437C16.0343 11.4375 16.6531 12.0563 16.6531 12.8469V14.6094C16.6531 15.4 17.2718 16.0188 18.0624 16.0188C18.8531 16.0188 19.4718 15.4 19.4718 14.6094V12.8469C19.4718 11.2969 18.5343 10.0313 15.9843 10.0313Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.rejectedCount}
              </h4>
              <span className="text-sm font-medium">Rejected/Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              All Transactions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 sm:w-64"
              />
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status} Status
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type} Type
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {dateFilters.map(filter => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Transaction
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Payment Method
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                        {transaction.transactionId}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        {transaction.type}
                      </p>

                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                        {transaction.customer.name}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        {transaction.customer.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div>
                      <p className={`font-medium text-sm text-gray-800 dark:text-white/90`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.fees != null && transaction.fees > 0 && (
                        <p className="text-gray-500 text-xs dark:text-gray-400">
                          Fee: {formatCurrency(transaction.fees)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                      <span className="text-gray-600 text-sm dark:text-gray-400">
                        {transaction.paymentMethod}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      size="sm"
                      color={
                        transaction.status === "VALIDATED" || transaction.status === "PROCESSED" ? "success" :
                          transaction.status === "PENDING" ? "warning" :
                            transaction.status === "REJECTED" || transaction.status === "CANCELLED" ? "error" : "light"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-gray-500 text-sm dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="View Details"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {transaction.status === "PENDING" && (
                        <>
                          <button
                            className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                            title="Approve Transaction"
                            onClick={() => handleApproveClick(transaction)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Reject Transaction"
                            onClick={() => handleRejectClick(transaction)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}

                      {(transaction.type === "Deposit" && transaction.status === "VALIDATED") && (
                        <button
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          title="View Receipt"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={approveConfirmOpen}
        onClose={() => { setApproveConfirmOpen(false); setApproveTransaction(null); }}
        onConfirm={handleApproveConfirm}
        title="Approve Transaction"
        message={approveTransaction ? `Are you sure you want to approve this ${approveTransaction.type.toLowerCase()}?` : ''}
        confirmLabel="Approve"
        cancelLabel="Cancel"
      />

      <ConfirmDialog
        open={rejectConfirmOpen}
        onClose={() => { setRejectConfirmOpen(false); setRejectTransaction(null); }}
        onConfirm={handleRejectConfirm}
        title="Reject Transaction"
        message={rejectTransaction ? `Are you sure you want to reject this ${rejectTransaction.type.toLowerCase()}?` : ''}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}