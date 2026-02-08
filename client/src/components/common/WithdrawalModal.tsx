import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { Card, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
  settings?: any;
  user?: any;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onSuccess, currentBalance, settings, user }) => {
  const [amount, setAmount] = useState('');
  const bankName = user?.bank_name || '';
  const rib = user?.rib || '';
  const [isInstantTransfer, setIsInstantTransfer] = useState(false);
  const [loading, setLoading] = useState(false);

  const MIN_WITHDRAWAL = settings?.min_withdrawal_amount?.value ? parseFloat(settings.min_withdrawal_amount.value) : 100;
  const MAX_WITHDRAWAL = settings?.max_withdrawal_amount?.value ? parseFloat(settings.max_withdrawal_amount.value) : 20000;
  const INSTANT_TRANSFER_FEE = 20; // 20 DH for non-CIH/Attijari instant transfers

  const calculateFee = () => {
    // Only charge 20 DH if instant transfer is selected and bank is not CIH or Attijari
    if (isInstantTransfer && bankName !== 'CIH' && bankName !== 'ATTIJARI') {
      return INSTANT_TRANSFER_FEE;
    }
    return 0;
  };

  const calculateNetAmount = (amount: number) => {
    return Math.round((amount - calculateFee()) * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Please enter withdrawal amount');
      return;
    }

    if (!bankName || !rib) {
      toast.error('Your bank details are incomplete. Please update your profile before making a withdrawal.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < MIN_WITHDRAWAL || amountNum > MAX_WITHDRAWAL) {
      toast.error(`Amount must be between ${MIN_WITHDRAWAL} DH and ${MAX_WITHDRAWAL.toLocaleString()} DH`);
      return;
    }

    if (amountNum > currentBalance) {
      toast.error('Withdrawal amount cannot exceed your current balance');
      return;
    }

    if (rib.replace(/\D/g, '').length < 24) {
      toast.error('RIB must be at least 24 digits');
      return;
    }

    setLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      
      const response = await fetch(`${API_URL}/api/seller/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: amountNum,
          is_instant_transfer: isInstantTransfer
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Withdrawal request submitted successfully!');
        handleClose();
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setIsInstantTransfer(false);
    onClose();
  };

  const amountNum = parseFloat(amount) || 0;
  const fee = calculateFee();
  const netAmount = calculateNetAmount(amountNum);

  const bankOptions = [
    { value: 'CIH', label: 'CIH Bank' },
    { value: 'ATTIJARI', label: 'Attijariwafa Bank' },
    { value: 'BMCE', label: 'BMCE Bank' },
    { value: 'BMCI', label: 'BMCI' },
    { value: 'CREDIT_AGRICOLE', label: 'Crédit Agricole du Maroc' },
    { value: 'SOCIETE_GENERALE', label: 'Société Générale' },
    { value: 'CFG', label: 'CFG Bank' },
    { value: 'OTHER', label: 'Other' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Request Withdrawal</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Withdraw funds to your bank account. Please ensure all bank details are correct.
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Balance</span>
                <Badge variant="light" color="success">
                  {currentBalance.toLocaleString('en-MA')} DH
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Withdrawal Amount (DH) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Enter amount (min: ${MIN_WITHDRAWAL} DH, max: ${MAX_WITHDRAWAL.toLocaleString()} DH)`}
              defaultValue={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_WITHDRAWAL.toString()}
              max={Math.min(MAX_WITHDRAWAL, currentBalance).toString()}
              step={0.01}
            />
            <p className="mt-1 text-xs text-gray-500">
              Available: {currentBalance.toLocaleString('en-MA')} DH | 
              Min: {MIN_WITHDRAWAL} DH | 
              Max: {MAX_WITHDRAWAL.toLocaleString('en-MA')} DH
            </p>
          </div>

          {/* Amount Summary */}
          {amountNum > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requested Amount:</span>
                  <span>{amountNum.toLocaleString('en-MA')} DH</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Instant Transfer Fee:</span>
                    <span>-{fee.toLocaleString('en-MA')} DH</span>
                  </div>
                )}
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span>Net Amount:</span>
                  <span className="text-green-600">{netAmount.toLocaleString('en-MA')} DH</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Details - Read Only */}
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Bank Account Details</h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Bank Name</Label>
                  <div className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                    {bankName === 'CIH' ? 'CIH Bank' : 
                     bankName === 'ATTIJARI' ? 'Attijariwafa Bank' : 
                     bankName === 'BMCE' ? 'BMCE Bank' : 
                     bankName === 'BMCI' ? 'BMCI' : 
                     bankName === 'CREDIT_AGRICOLE' ? 'Crédit Agricole du Maroc' : 
                     bankName === 'SOCIETE_GENERALE' ? 'Société Générale' : 
                     bankName === 'CFG' ? 'CFG Bank' : 
                     bankName || 'Not set'}
                  </div>
                </div>

                <div>
                  <Label>RIB (Bank Account Number)</Label>
                  <div className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white font-mono">
                    {rib || 'Not set'}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Bank details are set during registration and cannot be changed. Contact support if you need to update them.
              </p>
            </div>

            {/* Instant Transfer Option */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="instant-transfer"
                  checked={isInstantTransfer}
                  onChange={(e) => setIsInstantTransfer(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="instant-transfer" className="text-sm font-medium text-blue-900 dark:text-blue-200 cursor-pointer">
                    Request Instant Transfer
                  </label>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                    {bankName === 'CIH' || bankName === 'ATTIJARI' 
                      ? 'Free instant transfer for CIH and Attijariwafa Bank accounts.' 
                      : 'Instant transfer fee: 20 DH (Free for CIH and Attijariwafa Bank)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !amount || !bankName || !rib || amountNum < MIN_WITHDRAWAL || amountNum > currentBalance}
            >
              {loading ? 'Processing...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawalModal;