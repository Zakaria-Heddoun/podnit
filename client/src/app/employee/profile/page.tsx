"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function EmployeeProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <p className="mt-1 text-gray-900 dark:text-white">{user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <p className="mt-1 text-gray-900 dark:text-white">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <p className="mt-1 text-gray-900 dark:text-white">{user?.role || 'N/A'}</p>
          </div>
          {user?.permissions && user.permissions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


