'use client';
import { Home, Calendar, CreditCard, Settings, LogOut, Shield, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { logout, userRole } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (userRole === 'admin') {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setTotalUsers(snapshot.size);
      });
      return () => unsub();
    }
  }, [userRole]);

  const navItems: any[] = [];

  if (userRole === 'admin') {
    navItems.push({ icon: Settings, label: 'ផ្ទាំងគ្រប់គ្រង', href: '/admin' });
    navItems.push({ icon: Calendar, label: 'បញ្ជីអវត្តមាន', href: '/admin/attendance' });
    navItems.push({ icon: FileText, label: 'សង្ខេបអវត្តមាន', href: '/admin/absent-summary' });
    navItems.push({ icon: Shield, label: 'បុគ្គលិកទាំងអស់', href: '/admin/users' });
  } else {
    navItems.push({ icon: Home, label: 'ផ្ទាំងគ្រប់គ្រង', href: '/dashboard' });
    navItems.push({ icon: Calendar, label: 'បញ្ជីអវត្តមាន', href: '/attendance' });
    navItems.push({ icon: FileText, label: 'ស្នើសុំថវិកា', href: '/budgets' });
  }

  return (
    <aside style={{
      width: '260px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '1rem' }}>✦</span>
          </div>
          គេហទំព័រ
        </h1>
        <button className="mobile-menu-btn" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
      </div>

      {userRole === 'admin' && (
        <div style={{ padding: '0 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Shield size={16} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 500 }}>បុគ្គលិកសរុប: {totalUsers}</span>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link key={i} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'all 0.2s',
              fontWeight: 400,
              textDecoration: 'none'
            }}>
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '0 24px', marginTop: 'auto' }}>
        <button 
          onClick={logout}
          style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--danger)',
          fontWeight: 400,
          width: '100%',
          padding: '12px 0',
          cursor: 'pointer'
        }}>
          <LogOut size={20} />
          ចាកចេញ
        </button>
      </div>
    </aside>
  );
}
