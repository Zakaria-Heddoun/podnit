"use client";

import DataTablesLibrary from "@/components/DataTables/DataTablesLibrary";
import DataTablesExport, { DataTablesExportItem } from "@/components/DataTables/DataTablesExport";
import DataTablesHTML from "@/components/DataTables/DataTablesHTML";

// Sample data for basic DataTable
const basicTableData = [
  {
    id: 1,
    name: "Tiger Nixon",
    image: "/images/user/user-01.png",
    position: "System Architect",
    office: "Edinburgh",
    age: 61,
    startDate: "2011/04/25",
    salary: "$320,800"
  },
  {
    id: 2,
    name: "Garrett Winters",
    image: "/images/user/user-02.png",
    position: "Accountant",
    office: "Tokyo",
    age: 63,
    startDate: "2011/07/25",
    salary: "$170,750"
  },
  {
    id: 3,
    name: "Ashton Cox",
    image: "/images/user/user-03.png",
    position: "Junior Technical Author",
    office: "San Francisco",
    age: 66,
    startDate: "2009/01/12",
    salary: "$86,000"
  },
  {
    id: 4,
    name: "Cedric Kelly",
    image: "/images/user/user-04.png",
    position: "Senior Javascript Developer",
    office: "Edinburgh",
    age: 22,
    startDate: "2012/03/29",
    salary: "$433,060"
  },
  {
    id: 5,
    name: "Airi Satou",
    image: "/images/user/user-05.png",
    position: "Accountant",
    office: "Tokyo",
    age: 33,
    startDate: "2008/11/28",
    salary: "$162,700"
  },
  {
    id: 6,
    name: "Brielle Williamson",
    image: "/images/user/user-06.png",
    position: "Integration Specialist",
    office: "New York",
    age: 61,
    startDate: "2012/12/02",
    salary: "$372,000"
  },
  {
    id: 7,
    name: "Herrod Chandler",
    image: "/images/user/user-07.png",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 59,
    startDate: "2012/08/06",
    salary: "$137,500"
  },
  {
    id: 8,
    name: "Rhona Davidson",
    image: "/images/user/user-08.png",
    position: "Integration Specialist",
    office: "Tokyo",
    age: 55,
    startDate: "2010/10/14",
    salary: "$327,900"
  },
  {
    id: 9,
    name: "Colleen Hurst",
    image: "/images/user/user-09.png",
    position: "Javascript Developer",
    office: "San Francisco",
    age: 39,
    startDate: "2009/09/15",
    salary: "$205,500"
  },
  {
    id: 10,
    name: "Sonya Frost",
    image: "/images/user/user-10.png",
    position: "Software Engineer",
    office: "Edinburgh",
    age: 23,
    startDate: "2008/12/13",
    salary: "$103,600"
  }
];



// Sample data for export DataTable with departments
const exportTableData = basicTableData.map(item => ({
  ...item,
  status: "Active",
  department: "Engineering"
}));

const DataTablesPage = () => {


  const handleSelectionChange = (selectedItems: DataTablesExportItem[]) => {
    console.log('Selected items:', selectedItems);
  };

  const handleBulkAction = (action: string, selectedItems: DataTablesExportItem[]) => {
    console.log(`Bulk ${action} for:`, selectedItems);
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
        alert(`Bulk deleted ${selectedItems.length} items`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          DataTables Library Integration
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Advanced data tables with sorting, filtering, and pagination using DataTables library.
        </p>
      </div>

      {/* HTML Structure DataTable - Exact replica */}
      <div className="mb-8">
        <DataTablesHTML />
      </div>

      {/* Basic DataTable */}
      <div className="mb-8">
        <DataTablesLibrary
          data={basicTableData}
          title="Basic DataTable"
        />
      </div>

      {/* Export DataTable with Selection */}
      <div className="mb-8">
        <DataTablesExport
          data={exportTableData}
          title="DataTable with Export & Selection"
          enableSelection={true}
          onSelectionChange={handleSelectionChange}
          onBulkAction={handleBulkAction}
        />
      </div>
    </div>
  );
};

export default DataTablesPage;