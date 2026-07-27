'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect legacy chairperson dashboard to the unified member dashboard
export default function ChairpersonDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
