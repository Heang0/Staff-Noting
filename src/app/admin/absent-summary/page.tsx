'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function AbsentSummary() {
  const { userRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  
  const monthsKhmer = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 
    'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 
    'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [currentDate, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap: any = {};
      usersSnap.forEach(d => {
        usersMap[d.id] = d.data();
      });

      const monthStr = String(month + 1).padStart(2, '0');
      const monthPrefix = `${year}-${monthStr}`;
      
      const attQ = query(
        collection(db, 'attendance'),
        where('date', '>=', `${monthPrefix}-01`),
        where('date', '<=', `${monthPrefix}-31`)
      );
      
      const attSnap = await getDocs(attQ);
      const attList: any[] = [];

      attSnap.forEach(d => {
        const data = d.data();
        // Only include attendance records if the user still exists in the system
        if (data.date.startsWith(monthPrefix) && usersMap[data.userId]) {
          attList.push({
            id: d.id,
            ...data,
            staffName: usersMap[data.userId]?.fullName || usersMap[data.userId]?.username || 'មិនស្គាល់',
            staffEmail: usersMap[data.userId]?.email || ''
          });
        }
      });
      
      attList.sort((a, b) => b.date.localeCompare(a.date));
      setAttendanceData(attList);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const filteredData = attendanceData.filter(record => 
    record.staffName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    record.staffEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedData = Object.values(filteredData.reduce((acc, curr) => {
    if (!acc[curr.userId]) {
      acc[curr.userId] = {
        userId: curr.userId,
        staffName: curr.staffName,
        staffEmail: curr.staffEmail,
        total: 0,
        records: []
      };
    }
    acc[curr.userId].total += 1;
    acc[curr.userId].records.push(curr);
    return acc;
  }, {} as Record<string, any>));

  // Sort by total absences descending
  groupedData.sort((a: any, b: any) => b.total - a.total);

  if (userRole !== 'admin' && userRole) {
    return <div style={{ padding: '24px', color: 'var(--danger)' }}>មិនមានសិទ្ធិអនុញ្ញាត (Unauthorized)</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="header-controls" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="header-title">
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--accent)' }}>សង្ខេបអវត្តមានប្រចាំខែ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>បញ្ជីសង្ខេបចំនួនថ្ងៃឈប់សម្រាក និងមូលហេតុរបស់បុគ្គលិកនីមួយៗ</p>
        </div>

        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <div className="search-box" style={{ position: 'relative', minWidth: '250px', flex: '1 1 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="ស្វែងរកបុគ្គលិក ឬ មូលហេតុ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px', marginBottom: 0, background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div className="date-picker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', flex: '1 1 auto' }}>
            <button onClick={handlePrevMonth} style={{ color: 'var(--text-primary)', padding: '4px' }}>
              <ChevronLeft size={24} />
            </button>
            <span style={{ fontWeight: 500, minWidth: '120px', textAlign: 'center' }}>
              {monthsKhmer[month]} {year}
            </span>
            <button onClick={handleNextMonth} style={{ color: 'var(--text-primary)', padding: '4px' }}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ...</div>
        ) : groupedData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>មិនមានទិន្នន័យឈប់សម្រាកសម្រាប់ខែនេះទេ</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', width: '25%' }}>ឈ្មោះបុគ្គលិក</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', width: '20%' }}>សរុបប្រចាំខែនេះ</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', width: '55%' }}>កាលបរិច្ឆេទ និងមូលហេតុ</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((staff: any, index: number) => (
                  <tr key={staff.userId} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 500 }}>{staff.staffName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.staffEmail}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                      <span style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
                        {staff.total} ថ្ងៃ
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {staff.records.map((r: any) => (
                          <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--danger)' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 500, minWidth: '90px' }}>{r.date}</span>
                            <span style={{ color: 'var(--text-primary)' }}>{r.reason || 'គ្មានមូលហេតុ'}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          .search-box, .date-picker {
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}} />
    </div>
  );
}
