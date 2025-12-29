"use client";

import React, { useState } from "react";

// Configuration interfaces
interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  timezone: string;
  language: string;
  currency: string;
  maintenance: boolean;
  referralPointsReferrer: number;
  pointsPerOrder: number;
  deliveryPrice: number;
  minDeposit: number;
  minWithdrawal: number;
}

interface PaymentSettings {
  paypal: {
    enabled: boolean;
    mode: "sandbox" | "live";
    clientId: string;
    clientSecret: string;
  };
  stripe: {
    enabled: boolean;
    mode: "test" | "live";
    publicKey: string;
    secretKey: string;
  };
  bankTransfer: {
    enabled: boolean;
    accountDetails: string;
  };
}

interface EmailSettings {
  provider: "smtp" | "sendgrid" | "mailgun";
  smtp: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: "tls" | "ssl" | "none";
  };
  fromEmail: string;
  fromName: string;
  templates: {
    welcome: boolean;
    orderConfirmation: boolean;
    passwordReset: boolean;
  };
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAttempts: number;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  ipWhitelist: string[];
  sslEnforced: boolean;
}

interface NotificationSettings {
  newOrder: boolean;
  lowStock: boolean;
  newUser: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function AdminConfiguration() {
  const [activeTab, setActiveTab] = useState<"general" | "payment" | "email" | "security" | "notifications">("general");
  const [isLoading, setIsLoading] = useState(false);

  // Default settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: "PODNIT",
    siteDescription: "E-commerce platform for print-on-demand products",
    siteUrl: "https://podnit.com",
    timezone: "UTC",
    language: "en",
    currency: "USD",
    maintenance: false,
    referralPointsReferrer: 100,
    pointsPerOrder: 10,
    deliveryPrice: 0,
    minDeposit: 100,
    minWithdrawal: 50
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paypal: {
      enabled: true,
      mode: "sandbox",
      clientId: "",
      clientSecret: ""
    },
    stripe: {
      enabled: true,
      mode: "test",
      publicKey: "",
      secretKey: ""
    },
    bankTransfer: {
      enabled: false,
      accountDetails: ""
    }
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: "smtp",
    smtp: {
      host: "",
      port: 587,
      username: "",
      password: "",
      encryption: "tls"
    },
    fromEmail: "noreply@podnit.com",
    fromName: "PODNIT",
    templates: {
      welcome: true,
      orderConfirmation: true,
      passwordReset: true
    }
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAttempts: 5,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireSpecialChars: true,
    ipWhitelist: [],
    sslEnforced: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newOrder: true,
    lowStock: true,
    newUser: false,
    systemAlerts: true,
    emailNotifications: true,
    pushNotifications: false
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    alert("Configuration saved successfully!");
  };

  const tabs = [
    { id: "general", name: "General", icon: "🔧" },
    { id: "payment", name: "Payment", icon: "💳" },
    { id: "email", name: "Email", icon: "📧" },
    { id: "security", name: "Security", icon: "🔒" },
    { id: "notifications", name: "Notifications", icon: "🔔" }
  ];

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          System Configuration
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Manage system settings, payment methods, security, and notifications
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Navigation Tabs */}
        <div className="col-span-12 xl:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Configuration Sections
              </h3>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTab === tab.id
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                      }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">

            {/* General Settings */}
            {activeTab === "general" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                  General Settings
                </h3>
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
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Site URL
                      </label>
                      <input
                        type="url"
                        value={generalSettings.siteUrl}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Site Description
                    </label>
                    <textarea
                      rows={3}
                      value={generalSettings.siteDescription}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
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
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === "payment" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                  Payment Settings
                </h3>
                <div className="space-y-6">
                  {/* PayPal */}
                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <span className="text-sm">💳</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 dark:text-white">PayPal</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Accept payments via PayPal</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.paypal.enabled}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            paypal: { ...paymentSettings.paypal, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                      </label>
                    </div>
                    {paymentSettings.paypal.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mode
                          </label>
                          <select
                            value={paymentSettings.paypal.mode}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              paypal: { ...paymentSettings.paypal, mode: e.target.value as "sandbox" | "live" }
                            })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="sandbox">Sandbox (Test)</option>
                            <option value="live">Live</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Client ID
                            </label>
                            <input
                              type="text"
                              value={paymentSettings.paypal.clientId}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                paypal: { ...paymentSettings.paypal, clientId: e.target.value }
                              })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={paymentSettings.paypal.clientSecret}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                paypal: { ...paymentSettings.paypal, clientSecret: e.target.value }
                              })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stripe */}
                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <span className="text-sm">🔷</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 dark:text-white">Stripe</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Accept credit card payments via Stripe</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.stripe.enabled}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            stripe: { ...paymentSettings.stripe, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                      </label>
                    </div>
                    {paymentSettings.stripe.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mode
                          </label>
                          <select
                            value={paymentSettings.stripe.mode}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              stripe: { ...paymentSettings.stripe, mode: e.target.value as "test" | "live" }
                            })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="test">Test Mode</option>
                            <option value="live">Live Mode</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Publishable Key
                            </label>
                            <input
                              type="text"
                              value={paymentSettings.stripe.publicKey}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                stripe: { ...paymentSettings.stripe, publicKey: e.target.value }
                              })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Secret Key
                            </label>
                            <input
                              type="password"
                              value={paymentSettings.stripe.secretKey}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                stripe: { ...paymentSettings.stripe, secretKey: e.target.value }
                              })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Transfer */}
                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <span className="text-sm">🏦</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 dark:text-white">Bank Transfer</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Accept manual bank transfers</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={paymentSettings.bankTransfer.enabled}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            bankTransfer: { ...paymentSettings.bankTransfer, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                      </label>
                    </div>
                    {paymentSettings.bankTransfer.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Account Details
                        </label>
                        <textarea
                          rows={4}
                          value={paymentSettings.bankTransfer.accountDetails}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            bankTransfer: { ...paymentSettings.bankTransfer, accountDetails: e.target.value }
                          })}
                          placeholder="Enter your bank account details for customers..."
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                  Email Settings
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">SMTP Configuration</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            value={emailSettings.smtp.host}
                            onChange={(e) => setEmailSettings({
                              ...emailSettings,
                              smtp: { ...emailSettings.smtp, host: e.target.value }
                            })}
                            placeholder="smtp.gmail.com"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SMTP Port
                          </label>
                          <input
                            type="number"
                            value={emailSettings.smtp.port}
                            onChange={(e) => setEmailSettings({
                              ...emailSettings,
                              smtp: { ...emailSettings.smtp, port: parseInt(e.target.value) }
                            })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={emailSettings.smtp.username}
                            onChange={(e) => setEmailSettings({
                              ...emailSettings,
                              smtp: { ...emailSettings.smtp, username: e.target.value }
                            })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            value={emailSettings.smtp.password}
                            onChange={(e) => setEmailSettings({
                              ...emailSettings,
                              smtp: { ...emailSettings.smtp, password: e.target.value }
                            })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Encryption
                        </label>
                        <select
                          value={emailSettings.smtp.encryption}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings,
                            smtp: { ...emailSettings.smtp, encryption: e.target.value as "tls" | "ssl" | "none" }
                          })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Email Templates</h4>
                    <div className="space-y-4">
                      {Object.entries(emailSettings.templates).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Auto-send {key.replace(/([A-Z])/g, ' $1').toLowerCase()} emails
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setEmailSettings({
                                ...emailSettings,
                                templates: { ...emailSettings.templates, [key]: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                  Security Settings
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Authentication</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white">Two-Factor Authentication</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for admin access</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.twoFactorAuth}
                              onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Max Login Attempts
                          </label>
                          <input
                            type="number"
                            value={securitySettings.loginAttempts}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <input
                            type="number"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                            min="5"
                            max="480"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Password Policy</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Length
                          </label>
                          <input
                            type="number"
                            value={securitySettings.passwordMinLength}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                            min="6"
                            max="32"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white">Require Special Characters</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Require symbols in passwords</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.requireSpecialChars}
                              onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChars: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white">Enforce SSL</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Force HTTPS connections</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={securitySettings.sslEnforced}
                              onChange={(e) => setSecuritySettings({ ...securitySettings, sslEnforced: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                  Notification Settings
                </h3>
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Admin Notifications</h4>
                    <div className="space-y-4">
                      {Object.entries(notificationSettings).map(([key, enabled]) => {
                        if (key === 'emailNotifications' || key === 'pushNotifications') return null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Get notified about {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setNotificationSettings({
                                  ...notificationSettings,
                                  [key]: e.target.checked
                                })}
                                className="sr-only peer"
                              />
                              <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Delivery Methods</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-800 dark:text-white">Email Notifications</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              emailNotifications: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-800 dark:text-white">Push Notifications</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser push notifications</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushNotifications}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              pushNotifications: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
      </div>
    </div>
  );
}
