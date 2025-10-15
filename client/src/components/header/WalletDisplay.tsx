"use client";
import React from "react";
import { WalletIcon } from "@/icons";

interface WalletDisplayProps {
  balance?: number;
  currency?: string;
  className?: string;
}

const WalletDisplay: React.FC<WalletDisplayProps> = ({
  balance = 0,
  currency = "USD",
  className = "",
}) => {
  // Format the balance with proper currency formatting
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-theme-xs hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800 ${className}`}
    >
      {/* Wallet Icon */}
      <div className="flex items-center justify-center w-8 h-8 bg-brand-50 rounded-lg dark:bg-brand-500/[0.12]">
        <WalletIcon className="text-brand-500 dark:text-brand-400" />
      </div>
      
      {/* Balance Display */}
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Wallet Balance
        </span>
        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {formatBalance(balance)}
        </span>
      </div>
    </div>
  );
};

export default WalletDisplay;