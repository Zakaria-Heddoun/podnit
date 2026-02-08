"use client";

import React, { useState } from "react";
import { toast } from "sonner";

// Configuration interfaces
interface GeneralSettings {
  siteName: string;
  maintenance: boolean;
  referralPointsReferrer: number;
  pointsPerOrder: number;
  deliveryPrice: number;
  minDeposit: number;
  minWithdrawal: number;
  packagingPrice: number;
  shippingCasablanca: number;
  shippingOther: number;
}

export default function AdminConfiguration() {
  const [isLoading, setIsLoading] = useState(false);
  const [testMailEmail, setTestMailEmail] = useState("");
  const [testMailLoading, setTestMailLoading] = useState(false);
  const [testMailMessage, setTestMailMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Default settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: "PODNIT",
    maintenance: false,
    referralPointsReferrer: 100,
    pointsPerOrder: 10,
    deliveryPrice: 0,
    minDeposit: 100,
    minWithdrawal: 50,
    packagingPrice: 5.00,
    shippingCasablanca: 20.00,
    shippingOther: 40.00
  });

  const fetchSettings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const s = result.data;
          setGeneralSettings(prev => ({
            ...prev,
            pointsPerOrder: parseInt(s.points_per_order?.value) || 10,
            referralPointsReferrer: parseInt(s.referral_points_referrer?.value) || 100,
            minDeposit: parseFloat(s.min_deposit_amount?.value) || 100,
            minWithdrawal: parseFloat(s.min_withdrawal_amount?.value) || 50,
            packagingPrice: parseFloat(s.packaging_price?.value) || 5.00,
            shippingCasablanca: parseFloat(s.shipping_casablanca?.value) || 20.00,
            shippingOther: parseFloat(s.shipping_other?.value) || 40.00,
            deliveryPrice: parseFloat(s.delivery_price?.value) || 0,
            siteName: s.site_name?.value || "PODNIT",
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const response = await fetch(`${API_URL}/api/admin/settings/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          settings: {
            points_per_order: generalSettings.pointsPerOrder,
            referral_points_referrer: generalSettings.referralPointsReferrer,
            min_deposit_amount: generalSettings.minDeposit,
            min_withdrawal_amount: generalSettings.minWithdrawal,
            packaging_price: generalSettings.packagingPrice,
            shipping_casablanca: generalSettings.shippingCasablanca,
            shipping_other: generalSettings.shippingOther,
            delivery_price: generalSettings.deliveryPrice,
            site_name: generalSettings.siteName,
          }
        }),
      });

      if (response.ok) {
        toast.success("Configuration saved successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save failure:", errorData);
        toast.error(`Failed to save configuration: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMail = async () => {
    if (!testMailEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testMailEmail)) {
      setTestMailMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setTestMailLoading(true);
    setTestMailMessage(null);
    const token = localStorage.getItem("token");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const response = await fetch(`${API_URL}/api/test-mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ email: testMailEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestMailMessage({ type: 'success', text: data.message || 'Test email sent successfully!' });
        setTestMailEmail('');
      } else {
        setTestMailMessage({ type: 'error', text: data.message || 'Failed to send test email' });
      }
    } catch (err) {
      console.error("Error sending test email:", err);
      setTestMailMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setTestMailLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          General Settings
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Manage general system settings and configurations
        </p>
      </div>

      {/* Full Width Card with General Settings */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Points & Financials</h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Points per Order
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={generalSettings.pointsPerOrder}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, pointsPerOrder: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Points a seller earns for each order they place.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Referral Bonus (per order)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={generalSettings.referralPointsReferrer}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, referralPointsReferrer: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Points the referrer earns when their referred seller places an order.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Delivery Price
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.deliveryPrice}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, deliveryPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minimum Deposit
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.minDeposit}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, minDeposit: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minimum Withdrawal
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.minWithdrawal}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, minWithdrawal: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Packaging Price (DH)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.packagingPrice}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, packagingPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Shipping Casablanca (DH)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.shippingCasablanca}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, shippingCasablanca: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Shipping Other Cities (DH)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={generalSettings.shippingOther}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, shippingOther: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-white">Maintenance Mode</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Put the site in maintenance mode for updates</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={generalSettings.maintenance}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maintenance: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                    </label>
                  </div>
                </div>

        {/* Test Mail Section */}
        <div className="mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Test Email Configuration</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Send a test email to verify your Resend configuration is working properly.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={testMailEmail}
                onChange={(e) => setTestMailEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={handleTestMail}
              disabled={testMailLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800"
            >
              {testMailLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {testMailLoading ? "Sending..." : "Send Test Email"}
            </button>
          </div>
          {testMailMessage && (
            <div className={`mt-3 p-3 text-sm rounded-lg ${
              testMailMessage.type === 'success' 
                ? 'text-green-600 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                : 'text-red-600 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}>
              {testMailMessage.text}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
