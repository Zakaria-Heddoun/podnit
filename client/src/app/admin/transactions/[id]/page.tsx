"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Transaction interface (same as in main page)
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
  receiptImage?: string;
}

// API Response interfaces
interface DepositResponse {
  id: number;
  user_id: number;
  amount: number | string;
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
  amount: number | string;
  fee: number | string;
  net_amount: number | string;
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

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  const transactionId = params.id as string;

  // Transform API responses to unified transaction format
  const transformDeposit = (deposit: DepositResponse): Transaction => {
    const amount = typeof deposit.amount === 'string' ? parseFloat(deposit.amount) : deposit.amount;

    return {
      id: deposit.id,
      transactionId: `DEP-${deposit.id.toString().padStart(6, '0')}`,
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
      receiptImage: deposit.receipt_image,
    };
  };

  const transformWithdrawal = (withdrawal: WithdrawalResponse): Transaction => {
    const amount = typeof withdrawal.amount === 'string' ? parseFloat(withdrawal.amount) : withdrawal.amount;
    const fee = typeof withdrawal.fee === 'string' ? parseFloat(withdrawal.fee) : withdrawal.fee;

    return {
      id: withdrawal.id,
      transactionId: `WITH-${withdrawal.id.toString().padStart(6, '0')}`,
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

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!user || !token || user.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';


        // Extract ID from transaction ID format (DEP-000001 or WITH-000001)
        const isDeposit = transactionId.startsWith('DEP-');
        const actualId = transactionId.includes('-') ?
          parseInt(transactionId.split('-')[1]) :
          parseInt(transactionId);


        const endpoint = isDeposit
          ? `${API_URL}/api/admin/deposits/${actualId}`
          : `${API_URL}/api/admin/withdrawals/${actualId}`;


        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });


        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            const transformedTransaction = isDeposit
              ? transformDeposit(result.data)
              : transformWithdrawal(result.data);

            setTransaction(transformedTransaction);
          } else {
            console.error('API returned success=false or no data:', result);
            router.push('/admin/transactions');
          }
        } else {
          const errorData = await response.text();
          console.error('API request failed:', response.status, errorData);
          router.push('/admin/transactions');
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
        router.push('/admin/transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, user, token, router]);

  // Handle transaction actions
  const handleApproveClick = () => {
    if (!token || !transaction) {
      toast.error('Authentication required');
      return;
    }
    setApproveConfirmOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!transaction || !token) return;
    setApproveConfirmOpen(false);
    setActionLoading('approve');
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
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        console.error('Failed to approve:', data);
        toast.error(`Failed to approve transaction: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('An error occurred while approving the transaction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = () => {
    if (!token || !transaction) {
      toast.error('Authentication required');
      return;
    }
    setRejectConfirmOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!transaction || !token) return;
    setRejectConfirmOpen(false);
    setActionLoading('reject');
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

      const data = await response.json();

      if (response.ok) {
        toast.success('Transaction rejected successfully!');
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        console.error('Failed to reject:', data);
        toast.error(`Failed to reject transaction: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('An error occurred while rejecting the transaction');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number | undefined | null, currency: string = "DH") => {
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
      month: 'long',
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

  if (!transaction) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400">The requested transaction could not be found.</p>
            <button
              onClick={() => router.push('/admin/transactions')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/admin/transactions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Transactions
            </button>
          </div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Transaction Details
          </h2>
          <p className="text-regular text-body dark:text-bodydark">
            {transaction.transactionId} - {transaction.type}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            size="md"
            color={
              transaction.status === "VALIDATED" || transaction.status === "PROCESSED" ? "success" :
                transaction.status === "PENDING" ? "warning" :
                  transaction.status === "REJECTED" || transaction.status === "CANCELLED" ? "error" : "light"
            }
          >
            {transaction.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transaction Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.transactionId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.paymentMethod}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{formatDate(transaction.date)}</p>
              </div>
              {transaction.fees && transaction.fees > 0 && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Fees</span>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.fees)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Full Name</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.customer.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Email Address</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Additional Details Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Details
            </h3>
            <div className="space-y-4">
              {transaction.referenceNumber && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reference Number</span>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.referenceNumber}</p>
                </div>
              )}
              {transaction.bankName && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Bank Name</span>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{transaction.bankName}</p>
                </div>
              )}
              {transaction.bankDetails && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Bank Details</span>
                  <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(transaction.bankDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes Card */}
          {transaction.adminNotes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Admin Notes
              </h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200">{transaction.adminNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Receipt Image Card (only for deposits) */}
          {transaction.type === "Deposit" && transaction.receiptImage && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Receipt
              </h3>
              <div className="space-y-4">
                <div className="relative group">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/storage/${transaction.receiptImage}`}
                    alt="Payment Receipt"
                    width={300}
                    height={400}
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Card */}
          {transaction.status === "PENDING" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleApproveClick}
                  disabled={!!actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Transaction
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectClick}
                  disabled={!!actionLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Transaction
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Size Image Modal */}
      {isImageModalOpen && transaction.receiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/storage/${transaction.receiptImage}`}
              alt="Payment Receipt - Full Size"
              width={800}
              height={1000}
              className="w-auto h-auto max-w-full max-h-[90vh] rounded-lg"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Transaction"
        message={transaction ? `Are you sure you want to approve this ${transaction.type.toLowerCase()}?` : ''}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        isLoading={actionLoading === 'approve'}
      />

      <ConfirmDialog
        open={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Transaction"
        message={transaction ? `Are you sure you want to reject this ${transaction.type.toLowerCase()}?` : ''}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={actionLoading === 'reject'}
      />
    </div>
  );
}
