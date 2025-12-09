"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import { 
  Banknote as BanknotesIcon, 
  ArrowUp as ArrowUpIcon, 
  ArrowDown as ArrowDownIcon, 
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon
} from 'lucide-react';
import DepositModal from '@/components/common/DepositModal';
import WithdrawalModal from '@/components/common/WithdrawalModal';
import { useAuth } from '@/context/AuthContext';

interface Transaction {
  id: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'VALIDATED' | 'PROCESSED' | 'REJECTED' | 'CANCELLED';
  created_at: string;
  bank_name?: string;
  fee?: number;
  net_amount?: number;
  reference_number?: string;
  admin_notes?: string;
}

interface BankDetails {
  CIH: {
    bank_name: string;
    rib: string;
    account_holder: string;
    swift: string;
  };
  ATTIJARI: {
    bank_name: string;
    rib: string;
    account_holder: string;
    swift: string;
  };
}

const TransactionsPage = () => {
  const { fetchUserData } = useAuth();
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchBankDetails();
    fetchUserBalance();

    // Refresh balance when window regains focus (useful after admin validation)
    const handleFocus = () => {
      fetchUserBalance();
    };

    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const [depositsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/seller/deposits', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/seller/withdrawals', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (depositsRes.ok && withdrawalsRes.ok) {
        const depositsData = await depositsRes.json();
        const withdrawalsData = await withdrawalsRes.json();
        
        setDeposits(depositsData.data.data.map((d: any) => ({...d, type: 'DEPOSIT'})));
        setWithdrawals(withdrawalsData.data.data.map((w: any) => ({...w, type: 'WITHDRAWAL'})));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/seller/bank-details', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.data.balance || 0);
        
        // Also update AuthContext to keep header wallet in sync
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'VALIDATED':
      case 'PROCESSED': return 'success';
      case 'REJECTED':
      case 'CANCELLED': return 'error';
      default: return 'light';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4" />;
      case 'VALIDATED':
      case 'PROCESSED': return <CheckCircleIcon className="h-4 w-4" />;
      case 'REJECTED':
      case 'CANCELLED': return <XCircleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  // Combine and sort all transactions
  const allTransactions = [...deposits, ...withdrawals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleDepositSuccess = () => {
    fetchTransactions();
    fetchUserBalance();
    setShowDepositModal(false);
  };

  const handleWithdrawalSuccess = () => {
    fetchTransactions();
    fetchUserBalance();
    setShowWithdrawalModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Transactions
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your deposits and withdrawals
          </p>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userBalance.toLocaleString('en-MA')} DH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deposits.filter(d => d.status === 'VALIDATED').reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString('en-MA')} DH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {withdrawals.filter(w => w.status === 'PROCESSED').reduce((sum, w) => sum + (w.net_amount || 0), 0).toLocaleString('en-MA')} DH
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowDepositModal(true)}
          className="flex items-center gap-2"
        >
          <ArrowDownIcon className="h-4 w-4" />
          Make Deposit
        </Button>
        <Button 
          onClick={() => setShowWithdrawalModal(true)}
          variant="outline"
          className="flex items-center gap-2"
          disabled={userBalance < 100}
        >
          <ArrowUpIcon className="h-4 w-4" />
          Request Withdrawal
        </Button>
        <Button 
          onClick={() => setShowBankDetailsModal(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BanknotesIcon className="h-4 w-4" />
          View Bank Details
        </Button>
      </div>

      {userBalance < 100 && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <p className="text-sm text-orange-700">
            Minimum balance of 100 DH required for withdrawal requests.
          </p>
        </div>
      )}

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet. Make your first deposit to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {allTransactions.map((transaction) => (
                <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'DEPOSIT' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'DEPOSIT' ? 
                        <ArrowDownIcon className="h-4 w-4 text-green-600" /> : 
                        <ArrowUpIcon className="h-4 w-4 text-red-600" />
                      }
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                        {transaction.bank_name && ` - ${transaction.bank_name}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('en-MA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {transaction.reference_number && (
                        <div className="text-xs text-gray-400">
                          Ref: {transaction.reference_number}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'DEPOSIT' ? '+' : '-'}{transaction.amount.toLocaleString('en-MA')} DH
                    </div>
                    {transaction.type === 'WITHDRAWAL' && transaction.fee && (
                      <div className="text-xs text-gray-500">
                        Fee: {transaction.fee.toLocaleString('en-MA')} DH
                      </div>
                    )}
                    <Badge variant="light" color={getStatusColor(transaction.status)}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status}
                    </Badge>
                    {transaction.admin_notes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                        Note: {transaction.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showDepositModal && bankDetails && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
          bankDetails={bankDetails}
        />
      )}

      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess}
          currentBalance={userBalance}
        />
      )}

      {/* Bank Details Modal */}
      {showBankDetailsModal && bankDetails && (
        <Modal isOpen={showBankDetailsModal} onClose={() => setShowBankDetailsModal(false)} className="max-w-2xl">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bank Account Details</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Use these bank details to make deposits to your account.
              </p>
            </div>

            <div className="space-y-6">
              {/* CIH Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    CIH Bank
                    <Badge variant="light" color="primary">CIH</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Bank Name</Label>
                    <p className="text-sm font-medium">{bankDetails.CIH?.bank_name}</p>
                  </div>
                  <div>
                    <Label>RIB</Label>
                    <p className="text-sm font-mono font-medium">{bankDetails.CIH?.rib}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Attijari Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Attijari Wafabank
                    <Badge variant="light" color="info">ATTIJARI</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Bank Name</Label>
                    <p className="text-sm font-medium">{bankDetails.ATTIJARI?.bank_name}</p>
                  </div>
                  <div>
                    <Label>RIB</Label>
                    <p className="text-sm font-mono font-medium">{bankDetails.ATTIJARI?.rib}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowBankDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsPage;