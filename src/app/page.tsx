'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Search, LogIn, LayoutDashboard } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { isOff: boolean, reason?: string }>>({});
  const [yearlyTotals, setYearlyTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewReasonModal, setViewReasonModal] = useState<{name: string, date: string, reason: string} | null>(null);

  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'មករា (January)', 'កុម្ភៈ (February)', 'មីនា (March)', 'មេសា (April)', 
    'ឧសភា (May)', 'មិថុនា (June)', 'កក្កដា (July)', 'សីហា (August)', 
    'កញ្ញា (September)', 'តុលា (October)', 'វិច្ឆិកា (November)', 'ធ្នូ (December)'
  ];

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users: any[] = [];
      usersSnap.forEach(d => {
        users.push({ id: d.id, ...d.data() });
      });
      users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      setStaffList(users);

      const yearStartStr = `${year}-01-01`;
      const yearEndStr = `${year}-12-31`;
      
      const attQ = query(
        collection(db, 'attendance'),
        where('date', '>=', yearStartStr),
        where('date', '<=', yearEndStr)
      );
      
      const attSnap = await getDocs(attQ);
      const attMap: Record<string, { isOff: boolean, reason?: string }> = {};
      const totals: Record<string, number> = {};

      attSnap.forEach(d => {
        const data = d.data();
        if (data.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
          attMap[`${data.userId}_${data.date}`] = { isOff: true, reason: data.reason || '' };
        }
        totals[data.userId] = (totals[data.userId] || 0) + 1;
      });
      
      setAttendance(attMap);
      setYearlyTotals(totals);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading && staffList.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{ color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ (Loading)...</div>
      </div>
    );
  }

  // Filter and Paginate
  const filteredStaff = staffList.filter(staff => 
    (staff.username || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (staff.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const currentStaff = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="animate-fade-in" style={{ padding: '16px', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <div className="header-controls" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="header-title">
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--accent)' }}>បញ្ជីអវត្តមានប្រចាំខែ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>តាមដានការឈប់សម្រាករបស់បុគ្គលិកទាំងអស់នៅទីនេះ</p>
        </div>

        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <Link href="/dashboard" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link href="/login" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <LogIn size={18} />
              <span>ចូលគណនី (Login)</span>
            </Link>
          )}

          <div className="search-box" style={{ position: 'relative', minWidth: '250px', flex: '1 1 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="ស្វែងរកបុគ្គលិក..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px', marginBottom: 0, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div className="date-picker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', flex: '1 1 auto' }}>
            <button onClick={handlePrevMonth} style={{ color: 'var(--text-primary)', padding: '4px' }}>
              <ChevronLeft size={24} />
            </button>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, minWidth: '150px', textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={handleNextMonth} style={{ color: 'var(--text-primary)', padding: '4px' }}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.6)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${daysInMonth * 40 + 200}px` }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', position: 'sticky', left: 0, zIndex: 10, minWidth: '150px' }}>
                ឈ្មោះបុគ្គលិក
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                សរុបប្រចាំឆ្នាំ
              </th>
              {daysArray.map(day => (
                <th key={day} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderRight: '1px solid rgba(255,255,255,0.05)', minWidth: '40px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentStaff.map((staff, index) => (
              <tr key={staff.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ position: 'sticky', left: 0, zIndex: 10, background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)', padding: '16px', borderRight: '1px solid var(--border)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 500 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{staff.fullName || staff.username || 'បុគ្គលិក'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.email}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  {yearlyTotals[staff.id] || 0}
                </td>
                {daysArray.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const key = `${staff.id}_${dateStr}`;
                  const cellData = attendance[key];

                  return (
                    <td 
                      key={day} 
                      onClick={() => {
                        if (cellData?.isOff && cellData.reason) {
                          setViewReasonModal({
                            name: staff.fullName || staff.username,
                            date: dateStr,
                            reason: cellData.reason
                          });
                        }
                      }}
                      title={cellData?.reason ? `មូលហេតុ: ${cellData.reason}` : undefined}
                      style={{ 
                        padding: '0', 
                        borderRight: '1px solid rgba(255,255,255,0.05)', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: (cellData?.isOff && cellData.reason) ? 'pointer' : 'default',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ 
                        height: '50px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: cellData?.isOff ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        borderLeft: cellData?.isOff ? '2px solid var(--danger)' : '2px solid transparent',
                      }}>
                        {cellData?.isOff ? <Check size={18} color="var(--danger)" /> : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewReasonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)', textAlign: 'center' }}>
              ព័ត៌មានលម្អិត
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>បុគ្គលិក:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{viewReasonModal.name}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>កាលបរិច្ឆេទ:</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{viewReasonModal.date}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>មូលហេតុ:</span>
                <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{viewReasonModal.reason}</p>
              </div>
            </div>
            <button onClick={() => setViewReasonModal(null)} className="btn-secondary" style={{ width: '100%' }}>
              បិទ
            </button>
          </div>
        </div>
      )}
      
      {/* Embedded Mobile Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .header-controls {
            flex-direction: column;
            gap: 16px !important;
          }
          .header-title h1 {
            font-size: 1.5rem !important;
          }
          .header-title p {
            font-size: 0.875rem !important;
          }
          .header-actions {
            width: 100% !important;
            flex-direction: column;
            align-items: stretch !important;
          }
          .header-actions .btn-primary {
            justify-content: center;
          }
          .search-box, .date-picker {
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}} />
    </div>
  );
}
