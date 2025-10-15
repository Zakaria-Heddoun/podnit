"use client";

import React from "react";
import ReturnDataTable from "@/components/DataTables/ReturnDataTable";
import { sampleReturns } from "@/data/sampleData";
import { Return } from "@/types/datatable";

export default function SellerReturns() {
  const handleSelectionChange = (selectedReturns: Return[]) => {
    console.log('Selected returns:', selectedReturns);
  };

  const handleBulkAction = (action: string, selectedReturns: Return[]) => {
    console.log(`Bulk action: ${action}`, selectedReturns);
    switch (action) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedReturns.length} returns?`)) {
          alert(`Deleted ${selectedReturns.length} returns`);
        }
        break;
      case 'export':
        alert(`Exporting ${selectedReturns.length} selected returns`);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };

  const handleView = (returnItem: Return) => {
    console.log('View return:', returnItem);
    alert(`Viewing return ${returnItem.returnNumber}`);
  };

  const handleDelete = (returnItem: Return) => {
    console.log('Delete return:', returnItem);
    if (confirm(`Are you sure you want to delete return ${returnItem.returnNumber}?`)) {
      alert(`Deleted return ${returnItem.returnNumber}`);
    }
  };

  const handleDownload = () => {
    console.log('Download all returns');
    alert('Downloading all returns as CSV...');
  };

  return (
    <div className="mx-auto max-w-screen-2xl">
      <ReturnDataTable
        data={sampleReturns}
        title="Seller Returns Management"
        enableSelection={true}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        onView={handleView}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
}