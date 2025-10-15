"use client";

import React from "react";
import TransactionDataTable from "@/components/DataTables/TransactionDataTable";

// Sample transaction data for table
const transactionsTableData = [
  {
    id: 1,
    transactionNo: "Tran-175819220B807",
    description: "Adding Balance To Your Account.",
    amount: "23 DH",
    createdAt: "2025-09-18",
    status: "DEPOSIT" as const,
    transactionState: "PENDING" as const
  },
  {
    id: 2,
    transactionNo: "Tran-175819220B808",
    description: "Withdrawal Request",
    amount: "150 DH",
    createdAt: "2025-09-17",
    status: "WITHDRAWAL" as const,
    transactionState: "COMPLETED" as const
  },
  {
    id: 3,
    transactionNo: "Tran-175819220B809",
    description: "Product Sale Commission",
    amount: "45 DH",
    createdAt: "2025-09-16",
    status: "DEPOSIT" as const,
    transactionState: "COMPLETED" as const
  },
  {
    id: 4,
    transactionNo: "Tran-175819220B810",
    description: "Refund Processing",
    amount: "75 DH",
    createdAt: "2025-09-15",
    status: "WITHDRAWAL" as const,
    transactionState: "PENDING" as const
  },
  {
    id: 5,
    transactionNo: "Tran-175819220B811",
    description: "Monthly Bonus",
    amount: "100 DH",
    createdAt: "2025-09-14",
    status: "DEPOSIT" as const,
    transactionState: "COMPLETED" as const
  },
  {
    id: 6,
    transactionNo: "Tran-175819220B812",
    description: "Service Fee Deduction",
    amount: "25 DH",
    createdAt: "2025-09-13",
    status: "WITHDRAWAL" as const,
    transactionState: "FAILED" as const
  }
];

export default function SellerTransactions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Transactions
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your earnings and payment history
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-center font-medium text-primary hover:bg-opacity-90">
            Request withdrawal
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90">
            Add deposit
          </button>
        </div>
      </div>
      
      {/* Transactions Table */}
      <TransactionDataTable 
        data={transactionsTableData} 
        title="Transaction History"
      />
    </div>
  );
}