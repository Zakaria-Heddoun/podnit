"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DatePickerCalendar } from "../ui/DatePickerCalendar";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlySalesChartProps {
  userRole?: 'admin' | 'seller';
}

export default function MonthlySalesChart({ userRole = 'seller' }: MonthlySalesChartProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
  const [monthlySales, setMonthlySales] = useState<number[]>(Array(12).fill(0));
  const [dailySales, setDailySales] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });
  const [viewType, setViewType] = useState<'monthly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // helpers: parse YYYY-MM-DD to local Date and format a Date to local YYYY-MM-DD
  const parseISOToLocal = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const formatLocalISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleCustomDateSearch = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // use shared helpers parseISOToLocal and formatLocalISO defined above

    try {
      const endpoint = userRole === 'admin' ? '/api/admin/orders' : '/api/seller/orders';
      const res = await fetch(`${API_URL}${endpoint}?per_page=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const orders = data?.data?.data || data?.data || [];

      const startDateObj = parseISOToLocal(startDate);
      const endDateObj = new Date(parseISOToLocal(endDate).getFullYear(), parseISOToLocal(endDate).getMonth(), parseISOToLocal(endDate).getDate(), 23, 59, 59, 999);

      // Build daily sales for the selected range (local dates)
      const days: { [key: string]: number } = {};
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        days[key] = 0;
      }

      // Filter orders by date range and sum sales (use local date keys)
      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const y = orderDate.getFullYear();
        const m = String(orderDate.getMonth() + 1).padStart(2, '0');
        const day = String(orderDate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${day}`;

        if (orderDate >= startDateObj && orderDate <= endDateObj) {
          const revenue = userRole === 'admin'
            ? (Number(order.total_amount) || 0)
            : ((Number(order.selling_price) || 0) * (Number(order.quantity) || 0));
          if (days[dateKey] !== undefined) days[dateKey] += revenue;
        }
      });

      const dailyLabels = Object.keys(days).map(key => {
        const [yy, mm, dd] = key.split('-').map(Number);
        const d = new Date(yy, mm - 1, dd);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      setDailySales({ labels: dailyLabels, data: Object.values(days) });
    } catch (err) {
      console.error("Failed to load daily sales for range", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMonthlySales = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const endpoint = userRole === 'admin' ? '/api/admin/orders' : '/api/seller/orders';
        const res = await fetch(`${API_URL}${endpoint}?per_page=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const orders = data?.data?.data || data?.data || [];

        // Calculate monthly sales
        const salesByMonth = Array(12).fill(0);
        const currentYear = new Date().getFullYear();

        // Calculate daily sales for last 14 days
        const last14Days: { [key: string]: number } = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = formatLocalISO(d);
          last14Days[key] = 0;
        }

        orders.forEach((order: any) => {
          const orderDate = new Date(order.created_at);
          const revenue = userRole === 'admin'
            ? (Number(order.total_amount) || 0)
            : ((Number(order.selling_price) || 0) * (Number(order.quantity) || 0));

          // Monthly
          if (orderDate.getFullYear() === currentYear) {
            const month = orderDate.getMonth();
            salesByMonth[month] += revenue;
          }

          // Daily
          const dateKey = formatLocalISO(orderDate);
          if (last14Days[dateKey] !== undefined) {
            last14Days[dateKey] += revenue;
          }
        });

        setMonthlySales(salesByMonth);

        const dailyLabels = Object.keys(last14Days).map(key => {
          const [yy, mm, dd] = key.split('-').map(Number);
          const d = new Date(yy, mm - 1, dd);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        setDailySales({
          labels: dailyLabels,
          data: Object.values(last14Days)
        });
      } catch (err) {
        console.error("Failed to load monthly sales", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, [API_URL, userRole]);

  // When switching to daily view or when date range changes, fetch daily data automatically
  useEffect(() => {
    if (viewType !== 'daily') return;
    // call the same handler used by the Search button
    handleCustomDateSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType, startDate, endDate]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: viewType === 'monthly' ? [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ] : dailySales.labels,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val.toFixed(2)} MAD`,
      },
    },
  };

  const series = [
    {
      name: userRole === 'admin' ? "Revenue" : "Sales",
      data: viewType === 'monthly' ? monthlySales : dailySales.data,
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {viewType === 'monthly' ? 'Monthly Sales ' + new Date().getFullYear() : 'Daily Sales'}
            {viewType === 'daily' && (
              <span className="ml-2 text-sm text-gray-500 font-medium">
                ({new Date(startDate.split('-').map(Number)[0], Number(startDate.split('-')[1]) - 1, Number(startDate.split('-')[2])).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {new Date(endDate.split('-').map(Number)[0], Number(endDate.split('-')[1]) - 1, Number(endDate.split('-')[2])).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})
              </span>
            )}
          </h3>
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setViewType('monthly')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${viewType === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('daily')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${viewType === 'daily'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
            >
              Daily
            </button>
          </div>
          {viewType === 'daily' && (
            <div className="flex items-center gap-2 ml-3 flex-wrap">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">From:</span>
              <div className="w-32">
                <DatePickerCalendar 
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">To:</span>
              <div className="w-32">
                <DatePickerCalendar 
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <button
                onClick={handleCustomDateSearch}
                className="rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 transition font-medium"
              >
                Search
              </button>
            </div>
          )}
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  );
}
