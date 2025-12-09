"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  brand_name?: string;
  cin?: string;
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.password_confirmation) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
        alert('Password updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
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
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
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
                      <select
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        name="bank_name"
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={handleSelectChange}
                      >
                        <option value="">Select Bank</option>
                        <option value="CIH">CIH Bank</option>
                        <option value="ATTIJARI">Attijariwafa Bank</option>
                        <option value="BMCE">BMCE Bank</option>
                        <option value="BMCI">BMCI</option>
                        <option value="CREDIT_AGRICOLE">Crédit Agricole du Maroc</option>
                        <option value="SOCIETE_GENERALE">Société Générale</option>
                        <option value="CFG">CFG Bank</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="mb-5.5">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="rib">
                        RIB (Bank Account Number)
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="rib"
                        id="rib"
                        placeholder="Enter your RIB"
                        value={formData.rib}
                        onChange={handleInputChange}
                      />
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

          {/* Security Settings */}
          <div className="mt-8 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Security Settings
              </h3>
            </div>
            <div className="p-7">
              {!showPasswordForm ? (
                <button
                  className="flex justify-center rounded bg-secondary px-6 py-2 font-medium text-white hover:bg-opacity-90"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="current_password">
                      Current Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="current_password"
                      id="current_password"
                      placeholder="Enter current password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="password">
                      New Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Enter new password"
                      value={passwordData.password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="password_confirmation">
                      Confirm New Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="password_confirmation"
                      id="password_confirmation"
                      placeholder="Confirm new password"
                      value={passwordData.password_confirmation}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ current_password: '', password: '', password_confirmation: '' });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="col-span-5 xl:col-span-2">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Profile Photo
              </h3>
            </div>
            <div className="p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-14 w-14 rounded-full overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : user.avatar ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.avatar}`}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-white font-bold text-xl">
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <span className="mb-1.5 text-black dark:text-white">
                    Edit your photo
                  </span>
                </div>
              </div>

              <div className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border border-dashed border-primary bg-gray px-4 py-4 dark:bg-meta-4 sm:py-7.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                    <svg
                      width="16"
                      height="13"
                      viewBox="0 0 16 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.99967 9.33337C2.36786 9.33337 2.66634 9.63185 2.66634 10V11.3334C2.66634 11.7016 2.9648 12 3.33301 12H12.6663C13.0345 12 13.333 11.7016 13.333 11.3334V10C13.333 9.63185 13.6315 9.33337 13.9997 9.33337C14.3679 9.33337 14.6663 9.63185 14.6663 10V11.3334C14.6663 12.4379 13.7708 13.3334 12.6663 13.3334H3.33301C2.22844 13.3334 1.33301 12.4379 1.33301 11.3334V10C1.33301 9.63185 1.63148 9.33337 1.99967 9.33337Z"
                        fill="#3C50E0"
                      />
                      <path
                        d="M7.99967 1.00003C8.36786 1.00003 8.66634 1.29851 8.66634 1.66669V6.66669L10.1663 5.16669C10.4392 4.89384 10.8781 4.89384 11.151 5.16669C11.4238 5.43954 11.4238 5.87846 11.151 6.15131L8.48434 8.81798C8.35014 8.95218 8.17274 9.00003 7.99967 9.00003C7.8266 9.00003 7.6492 8.95218 7.515 8.81798L4.84834 6.15131C4.57549 5.87846 4.57549 5.43954 4.84834 5.16669C5.12119 4.89384 5.56011 4.89384 5.83296 5.16669L7.33301 6.66669V1.66669C7.33301 1.29851 7.63148 1.00003 7.99967 1.00003Z"
                        fill="#3C50E0"
                      />
                    </svg>
                  </span>
                  <p>
                    <span className="text-primary">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="mt-1.5">SVG, PNG, JPG or GIF</p>
                  <p>(max, 800 X 800px)</p>
                </div>
              </div>

              <div className="flex justify-end gap-4.5">
                <button
                  className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                  type="button"
                  onClick={() => {
                    setProfileImage(null);
                    setPreviewImage('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                  type="button"
                  onClick={() => handleProfileSubmit()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-8 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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