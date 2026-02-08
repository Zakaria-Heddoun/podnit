"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  brand_name?: string;
  cin?: string;
  account_holder?: string;
  bank_name?: string;
  rib?: string;
  bio?: string;
}

export default function ProfilePage() {
  const { user, fetchUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    brand_name: '',
    cin: '',
    account_holder: '',
    bank_name: '',
    rib: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        brand_name: user.brand_name || '',
        cin: user.cin || '',
        account_holder: user.account_holder || '',
        bank_name: user.bank_name || '',
        rib: user.rib || '',
        bio: '' // We can add this to the user model later if needed
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const endpoint = user?.role === 'admin' ? '/api/user' : '/api/seller/profile';

      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (value !== undefined && value !== null) {
          submitData.append(key, value.toString());
        }
      });

      if (profileImage) {
        submitData.append('avatar', profileImage);
      }

      submitData.append('_method', 'PUT');

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: submitData
      });

      if (response.ok) {
        await fetchUserData();
        setProfileImage(null);
        setPreviewImage('');
        toast.success('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

      const response = await fetch(`${API_URL}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        setShowPasswordForm(false);
        toast.success('Password updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-270">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-270">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Profile Settings
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Main Profile Form */}
        <div className="col-span-5 xl:col-span-3">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Personal Information
              </h3>
            </div>
            <div className="p-7">
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white cursor-not-allowed"
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    disabled
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Please contact support if you need to update it.</p>
                </div>

                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="phone"
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Seller-specific fields */}
                {user.role === 'seller' && (
                  <>
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="brand_name">
                        Brand Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="brand_name"
                        id="brand_name"
                        placeholder="Enter your brand name"
                        value={formData.brand_name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="cin">
                        CIN (National ID)
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="cin"
                        id="cin"
                        placeholder="Enter your CIN"
                        value={formData.cin}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="bank_name">
                        Bank Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white cursor-not-allowed"
                        type="text"
                        name="bank_name"
                        id="bank_name"
                        value={formData.bank_name === 'CIH' ? 'CIH Bank' : formData.bank_name === 'ATTIJARI' ? 'Attijariwafa Bank' : formData.bank_name === 'BMCE' ? 'BMCE Bank' : formData.bank_name === 'BMCI' ? 'BMCI' : formData.bank_name === 'CREDIT_AGRICOLE' ? 'Crédit Agricole du Maroc' : formData.bank_name === 'SOCIETE_GENERALE' ? 'Société Générale' : formData.bank_name === 'CFG' ? 'CFG Bank' : formData.bank_name}
                        disabled
                        readOnly
                      />
                      <p className="mt-1 text-xs text-gray-500">Bank name cannot be changed for security reasons. Please contact support if needed.</p>
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="rib">
                        RIB (Bank Account Number)
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white cursor-not-allowed"
                        type="text"
                        name="rib"
                        id="rib"
                        value={formData.rib}
                        disabled
                        readOnly
                      />
                      <p className="mt-1 text-xs text-gray-500">RIB cannot be changed for security reasons. Please contact support if needed.</p>
                    </div>

                    {/* Display balance and points for sellers */}
                    <div className="mb-5.5 grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Current Balance
                        </label>
                        <div className="rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                          {user.balance ? Number(user.balance).toFixed(2) : '0.00'} DH
                        </div>
                      </div>
                      <div>
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                          Points
                        </label>
                        <div className="rounded border border-stroke bg-gray-2 py-3 px-4.5 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                          {user.points || 0}
                        </div>
                      </div>
                    </div>

                    {/* Referral Code */}
                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="referral_code">
                        Your Referral Code
                      </label>
                      <div className="relative">
                        <input
                          className="w-full rounded border border-stroke bg-gray-2 py-3 px-4.5 pr-24 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white cursor-not-allowed font-mono font-bold"
                          type="text"
                          name="referral_code"
                          id="referral_code"
                          value={user.referral_code || 'Generating...'}
                          disabled
                          readOnly
                        />
                        {user.referral_code && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(user.referral_code);
                              toast.success('Referral code copied to clipboard!');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90 transition-all"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Share this code with others to earn referral rewards.</p>
                    </div>
                  </>
                )}

                {/* Admin-specific or general bio field */}
                {user.role === 'admin' && (
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="bio">
                      Bio
                    </label>
                    <textarea
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      name="bio"
                      id="bio"
                      rows={4}
                      placeholder="Write your bio here"
                      value={formData.bio}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4.5">
                  <button
                    className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="col-span-5 xl:col-span-2">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Account Information
              </h3>
            </div>
            <div className="p-7">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-black dark:text-white">Role:</span>
                  <span className="ml-2 rounded bg-primary/10 px-2 py-1 text-sm text-primary">
                    {user.role === 'admin' ? 'Administrator' : 'Seller'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-black dark:text-white">Account Status:</span>
                  <span className="ml-2 rounded bg-green-100 px-2 py-1 text-sm text-green-600">
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-black dark:text-white">Member Since:</span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {user.role === 'seller' && user.referral_code && (
                  <div>
                    <span className="text-sm font-medium text-black dark:text-white">Referral Code:</span>
                    <span className="ml-2 font-mono text-sm text-primary">
                      {user.referral_code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}