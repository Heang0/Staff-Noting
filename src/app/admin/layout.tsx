'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      router.push('/');
    }
  }, [userRole, loading, router]);

  if (loading || userRole !== 'admin') {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div style={{ color: 'var(--text-secondary)' }}>កំពុងផ្ទៀងផ្ទាត់សិទ្ធិ... (Verifying access...)</div></div>;
  }

  return <>{children}</>;
}
