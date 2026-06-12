'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function StaffAbsentSummary() {
  const { user } = useAuth();
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
    if (user) {
      fetchData();
    }
  }, [currentDate, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const monthStr = String(month + 1).padStart(2, '0');
      const monthPrefix = `${year}-${monthStr}`;
      
      // Query all attendance for this user
      const attQ = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid)
      );
      
      const attSnap = await getDocs(attQ);
      const attList: any[] = [];

      attSnap.forEach(d => {
        const data = d.data();
        // Client-side filter by month prefix to avoid needing a composite index
        if (data.date.startsWith(monthPrefix)) {
          attList.push({
            id: d.id,
            ...data
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
    (record.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="header-controls" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="header-title">
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--accent)' }}>សង្ខេបអវត្តមានរបស់អ្នក</h1>
          <p style={{ color: 'var(--text-secondary)' }}>បញ្ជីសង្ខេបចំនួនថ្ងៃឈប់សម្រាក និងមូលហេតុរបស់អ្នក</p>
        </div>

        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <div className="search-box" style={{ position: 'relative', minWidth: '250px', flex: '1 1 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="ស្វែងរកតាមមូលហេតុ..." 
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
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>មិនមានទិន្នន័យឈប់សម្រាកសម្រាប់ខែនេះទេ</div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ចំនួនថ្ងៃឈប់សម្រាកសរុបខែនេះ:</span>
              <span style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
                {filteredData.length} ថ្ងៃ
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', width: '30%' }}>កាលបរិច្ឆេទ</th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', width: '70%' }}>មូលហេតុ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record, index) => (
                    <tr key={record.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{record.date}</span>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {record.reason || 'គ្មានមូលហេតុ'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
