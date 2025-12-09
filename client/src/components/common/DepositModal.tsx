import React, { useState } from 'react';
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
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess, bankDetails }) => {
  const [selectedBank, setSelectedBank] = useState<'CIH' | 'ATTIJARI' | ''>('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !receipt || !selectedBank || !transferReference) {
      alert('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 50 || amountNum > 50000) {
      alert('Amount must be between 50 DH and 50,000 DH');
      return;
    }

    setLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('bank_name', selectedBank);
      formData.append('receipt_image', receipt);
      formData.append('reference_number', transferReference);

      console.log('Submitting deposit request:', {
        amount,
        bank_name: selectedBank,
        reference_number: transferReference,
        receipt_name: receipt?.name
      });

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
        console.log('Raw response:', await response.clone().text());
        throw new Error('Invalid response format');
      }
      
      console.log('Deposit response:', { status: response.status, data });
      
      if (response.ok) {
        alert('Deposit request submitted successfully!');
        handleClose();
        onSuccess();
      } else {
        console.error('Deposit submission failed:', data);
        const errorMessage = data?.message || data?.errors || 'Failed to submit deposit request';
        alert(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG)');
        return;
      }
      
      setReceipt(file);
    }
  };

  const handleClose = () => {
    setSelectedBank('');
    setAmount('');
    setReceipt(null);
    setTransferReference('');
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
              placeholder="Enter amount (min: 50 DH, max: 50,000 DH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="50"
              max="50000"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum: 50 DH, Maximum: 50,000 DH</p>
          </div>

          {/* Transfer Reference */}
          <div>
            <Label htmlFor="reference">Transfer Reference Number *</Label>
            <Input
              id="reference"
              type="text"
              placeholder="Enter the reference number from your bank transfer"
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <Label htmlFor="receipt">Upload Transfer Receipt *</Label>
            <div className="mt-2">
              <FileInput
                onChange={handleFileUpload}
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
              Upload a clear photo of your transfer receipt. Max size: 5MB. Formats: JPG, PNG
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
              disabled={loading || !amount || !receipt || !selectedBank || !transferReference}
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