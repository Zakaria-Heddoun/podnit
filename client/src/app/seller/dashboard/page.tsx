'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SellerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main seller page
    router.replace('/seller');
  }, [router]);

  return null;
}