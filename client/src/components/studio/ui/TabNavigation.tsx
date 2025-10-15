"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TabNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'canvas', label: 'Design Canvas', path: '/seller/studio' }
  ];

  const getActiveTab = () => {
    return 'canvas';
  };

  const activeTab = getActiveTab();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;