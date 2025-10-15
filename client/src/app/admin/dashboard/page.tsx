'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main admin page
    router.replace('/admin');
  }, [router]);

  return null;
}