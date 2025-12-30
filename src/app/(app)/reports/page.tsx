"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now redirects to the default summary report page.
export default function ReportsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports/summary');
  }, [router]);

  return null;
}
