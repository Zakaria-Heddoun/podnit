import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { Card, CardContent } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';

interface PointsExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPoints: number;
}

const PointsExchangeModal: React.FC<PointsExchangeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentPoints 
}) => {
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);

  const POINTS_PER_100DH = 1000; // 1000 points = 100 DH
  const MIN_POINTS = POINTS_PER_100DH; // Minimum 1000 points to exchange

  const calculateAmount = (pointsToExchange: number) => {
    return (pointsToExchange / POINTS_PER_100DH) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!points) {
      toast.error('Please enter points to exchange');
      return;
    }

    const pointsNum = parseInt(points);
    
    if (pointsNum < MIN_POINTS) {
      toast.error(`Minimum ${MIN_POINTS.toLocaleString()} points required for exchange`);
      return;
    }

    if (pointsNum > currentPoints) {
      toast.error('Points to exchange cannot exceed your current points balance');
      return;
    }

    if (pointsNum % POINTS_PER_100DH !== 0) {
      toast.error(`Points must be a multiple of ${POINTS_PER_100DH.toLocaleString()}`);
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/seller/points/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          points: pointsNum
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Successfully exchanged ${pointsNum.toLocaleString()} points for ${calculateAmount(pointsNum).toLocaleString()} DH!`);
        handleClose();
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to exchange points');
      }
    } catch (error) {
      console.error('Error exchanging points:', error);
      toast.error('Failed to exchange points');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPoints('');
    onClose();
  };

  const pointsNum = parseInt(points) || 0;
  const convertedAmount = calculateAmount(pointsNum);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exchange Points</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Convert your points to account balance. Exchange rate: 1,000 points = 100 DH
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Points */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Points</span>
                <Badge variant="light" color="primary">
                  {currentPoints.toLocaleString('en-MA')} pts
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Points Input */}
          <div>
            <Label htmlFor="points">Points to Exchange *</Label>
            <Input
              id="points"
              type="number"
              placeholder={`Enter points (min: ${MIN_POINTS.toLocaleString()}, multiples of ${POINTS_PER_100DH.toLocaleString()})`}
              defaultValue={points}
              onChange={(e) => setPoints(e.target.value)}
              min={MIN_POINTS.toString()}
              max={currentPoints.toString()}
              step={POINTS_PER_100DH.toString()}
            />
            <p className="mt-1 text-xs text-gray-500">
              Available: {currentPoints.toLocaleString('en-MA')} pts | 
              Min: {MIN_POINTS.toLocaleString()} pts | 
              Must be multiples of {POINTS_PER_100DH.toLocaleString()}
            </p>
          </div>

          {/* Conversion Summary */}
          {pointsNum > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Points to Exchange:</span>
                  <span className="font-semibold">{pointsNum.toLocaleString('en-MA')} pts</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Exchange Rate:</span>
                  <span>1,000 pts = 100 DH</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span>You Will Receive:</span>
                  <span className="text-green-600">{convertedAmount.toLocaleString('en-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Message */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Note:</strong> Points will be deducted from your account and converted to balance immediately. This action cannot be undone.
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
              className="flex-1 bg-primary"
              disabled={loading || !points || pointsNum < MIN_POINTS || pointsNum > currentPoints || pointsNum % POINTS_PER_100DH !== 0}
            >
              {loading ? 'Processing...' : 'Exchange Points'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PointsExchangeModal;
