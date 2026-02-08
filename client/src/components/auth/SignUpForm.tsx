"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    brand_name: '',
    bank_name: '',
    rib: '',
    password: '',
    referred_by_code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    if (!formData.bank_name) {
      setError('Please select a bank');
      return;
    }

    if (formData.rib.length !== 24) {
      setError('RIB code must be exactly 24 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'seller' // Default role for registration
        }),
      });

      if (response.ok) {
        // Registration successful, redirect to signin
        router.push('/signin?message=Registration successful! Please sign in.');
      } else {
        // Handle validation errors
        const data = await response.json();
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          setError(errorMessages.join(', '));
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  {error}
                </div>
              )}
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="first_name"
                      placeholder="Enter your first name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="last_name"
                      placeholder="Enter your last name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                {/* <!-- Phone Number --> */}
                <div>
                  <Label>
                    Phone Number<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* <!-- Brand Name --> */}
                <div>
                  <Label>
                    Brand Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brand_name"
                    name="brand_name"
                    placeholder="Enter your brand name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* <!-- Bank Name --> */}
                <div>
                  <Label>
                    Bank Name<span className="text-error-500">*</span>
                  </Label>
                  <select
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    required
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
                {/* <!-- RIB Code --> */}
                <div>
                  <Label>
                    RIB Code<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="rib"
                    name="rib"
                    placeholder="Enter your 24-digit RIB code"
                    value={formData.rib}
                    onChange={handleInputChange}
                    minLength={24}
                    maxLength={24}
                    required
                  />
                </div>
                {/* <!-- Referral Code --> */}
                <div>
                  <Label>
                    Referral Code (Optional)
                  </Label>
                  <Input
                    type="text"
                    id="referred_by_code"
                    name="referred_by_code"
                    placeholder="Enter referral code if you have one"
                    value={formData.referred_by_code}
                    onChange={handleInputChange}
                  />
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-gray-800 shadow-theme-xs hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-800 dark:hover:bg-gray-200"
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-gray-800 hover:text-black dark:text-white dark:hover:text-gray-200"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
