'use client';
import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  
  // Extract username if available
  const displayName = user?.email?.split('@')[0] || 'ក្រុមការងារ';

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="mobile-menu-btn" onClick={onMenuClick} style={{ color: 'var(--text-primary)', padding: '4px' }}>
          <Menu size={24} />
        </button>
        <h2 className="header-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 400 }}>សូមស្វាគមន៍មកកាន់ក្រុមការងារ!</h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ color: 'var(--text-secondary)', padding: '8px', borderRadius: '50%', transition: 'all 0.2s', background: 'rgba(255,255,255,0.05)' }}>
          <Bell size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="white" />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>{displayName}</span>
        </div>
      </div>
    </header>
  );
}
