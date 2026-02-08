import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileInput from '@/components/form/input/FileInput';
import { Upload } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

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

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bankDetails: BankDetails;
  settings?: any;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess, bankDetails, settings }) => {
  const [selectedBank, setSelectedBank] = useState<'CIH' | 'ATTIJARI' | ''>('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const MIN_DEPOSIT = settings?.min_deposit_amount?.value ? parseFloat(settings.min_deposit_amount.value) : 50;
  const MAX_DEPOSIT = settings?.max_deposit_amount?.value ? parseFloat(settings.max_deposit_amount.value) : 50000;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !receipt || !selectedBank) {
      toast.error('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < MIN_DEPOSIT || amountNum > MAX_DEPOSIT) {
      toast.error(`Amount must be between ${MIN_DEPOSIT} DH and ${MAX_DEPOSIT.toLocaleString()} DH`);
      return;
    }

    setLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('bank_name', selectedBank);
      formData.append('receipt_image', receipt);

      const response = await fetch(`${API_URL}/api/seller/deposits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format');
      }
      
      if (response.ok) {
        toast.success('Deposit request submitted successfully!');
        handleClose();
        onSuccess();
      } else {
        console.error('Deposit submission failed:', data);
        const errorMessage = data?.message || data?.errors || 'Failed to submit deposit request';
        toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        event.target.value = ''; // Clear the input
        return;
      }

      setReceipt(file);
    }
  };

  const handleClose = () => {
    setSelectedBank('');
    setAmount('');
    setReceipt(null);
    onClose();
  };

  const bankOptions = [
    { value: 'CIH', label: 'CIH Bank' },
    { value: 'ATTIJARI', label: 'Attijari Wafabank' }
  ];

  const selectedBankDetails = selectedBank ? bankDetails[selectedBank] : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Make a Deposit</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Transfer money to one of our bank accounts and upload your receipt for verification.
          </p>
        </div>

        <div className="space-y-6">
          {/* Important Notice */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Important Notice</h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  If your transfer was not instant, please wait until we receive the payment. Your deposit will be processed once the funds are confirmed in our account.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <Label htmlFor="bank-select">Choose Bank Account *</Label>
            <Select
              options={bankOptions}
              placeholder="Choose a bank account to deposit to"
              onChange={(value) => setSelectedBank(value as 'CIH' | 'ATTIJARI')}
              defaultValue={selectedBank}
            />
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Deposit Amount (DH) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Enter amount (min: ${MIN_DEPOSIT} DH, max: ${MAX_DEPOSIT.toLocaleString()} DH)`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_DEPOSIT.toString()}
              max={MAX_DEPOSIT.toString()}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum: {MIN_DEPOSIT} DH, Maximum: {MAX_DEPOSIT.toLocaleString()} DH</p>
          </div>

          {/* Receipt Upload */}
          <div>
            <Label htmlFor="receipt">Upload Transfer Receipt *</Label>
            <div className="mt-2">
              <FileInput
                onChange={handleFileUpload}
                accept="image/jpeg,image/jpg,image/png"
                className="mb-2"
              />
              {receipt && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <Upload className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">{receipt.name}</span>
                  <Button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="ml-auto text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Upload a clear photo of your transfer receipt. Max size: 5MB. Formats: JPG, PNG only
            </p>
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
              disabled={loading || !amount || !receipt || !selectedBank}
            >
              {loading ? 'Submitting...' : 'Submit Deposit Request'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DepositModal;