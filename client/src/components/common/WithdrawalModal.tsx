import React, { useState } from 'react';
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
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [rib, setRib] = useState('');
  const [swift, setSwift] = useState('');
  const [loading, setLoading] = useState(false);

  const WITHDRAWAL_FEE = 0.05; // 5% fee
  const MIN_WITHDRAWAL = 100;
  const MAX_WITHDRAWAL = 20000;

  const calculateFee = (amount: number) => {
    return Math.round(amount * WITHDRAWAL_FEE * 100) / 100;
  };

  const calculateNetAmount = (amount: number) => {
    return Math.round((amount - calculateFee(amount)) * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !bankName || !accountHolder || !rib) {
      alert('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < MIN_WITHDRAWAL || amountNum > MAX_WITHDRAWAL) {
      alert(`Amount must be between ${MIN_WITHDRAWAL} DH and ${MAX_WITHDRAWAL.toLocaleString()} DH`);
      return;
    }

    if (amountNum > currentBalance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/seller/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amountNum,
          bank_name: bankName,
          account_holder: accountHolder,
          rib: rib,
          swift: swift || undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Withdrawal request submitted successfully!');
        handleClose();
        onSuccess();
      } else {
        alert(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setBankName('');
    setAccountHolder('');
    setRib('');
    setSwift('');
    onClose();
  };

  const amountNum = parseFloat(amount) || 0;
  const fee = calculateFee(amountNum);
  const netAmount = calculateNetAmount(amountNum);

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
                <div className="flex justify-between text-sm text-red-600">
                  <span>Processing Fee (5%):</span>
                  <span>-{fee.toLocaleString('en-MA')} DH</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span>Net Amount:</span>
                  <span className="text-green-600">{netAmount.toLocaleString('en-MA')} DH</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank-name">Bank Name *</Label>
              <Input
                id="bank-name"
                type="text"
                placeholder="e.g., Banque Populaire, BMCE Bank"
                defaultValue={bankName}
                onChange={(e) => setBankName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="account-holder">Account Holder Name *</Label>
              <Input
                id="account-holder"
                type="text"
                placeholder="Full name as registered with bank"
                defaultValue={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="rib">RIB (Bank Account Number) *</Label>
              <Input
                id="rib"
                type="text"
                placeholder="24-digit RIB number"
                defaultValue={rib}
                onChange={(e) => setRib(e.target.value)}
              />
            </div>

            {/* SWIFT Code input removed */}
          </div>

          {/* Important Notes removed */}

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
              disabled={loading || !amount || !bankName || !accountHolder || !rib || amountNum < MIN_WITHDRAWAL || amountNum > currentBalance}
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