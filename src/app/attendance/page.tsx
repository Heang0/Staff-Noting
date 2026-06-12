'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';

export default function Attendance() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { isOff: boolean, reason?: string }>>({}); 
  const [yearlyTotals, setYearlyTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{staffId: string, day: number} | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reasonModal, setReasonModal] = useState<{staffId: string, day: number} | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const pageSize = 10;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthsKhmer = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 
    'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 
    'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
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
        if (d.id === user?.uid) {
          users.push({ id: d.id, ...d.data() });
        }
      });
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
      console.error("Error fetching attendance data:", error);
    }
    setLoading(false);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleCellClick = async (staffId: string, day: number) => {
    if (!user || user.uid !== staffId) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${staffId}_${dateStr}`;
    const cellData = attendance[key];

    if (cellData?.isOff) {
      setConfirmDelete({ staffId, day });
      return;
    }

    setReasonModal({ staffId, day });
    setReasonInput('');
  };

  const confirmAddTick = async () => {
    if (!reasonModal) return;
    const { staffId, day } = reasonModal;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${staffId}_${dateStr}`;
    const finalReason = reasonInput.trim();

    setAttendance(prev => {
      const next = { ...prev };
      next[key] = { isOff: true, reason: finalReason };
      return next;
    });
    setYearlyTotals(prev => ({
      ...prev,
      [staffId]: (prev[staffId] || 0) + 1
    }));
    setReasonModal(null);

    try {
      await setDoc(doc(db, 'attendance', key), {
        userId: staffId,
        date: dateStr,
        status: 'absent',
        reason: finalReason
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      fetchData();
    }
  };

  const confirmRemoveTick = async () => {
    if (!confirmDelete) return;
    const { staffId, day } = confirmDelete;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${staffId}_${dateStr}`;
    
    setAttendance(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setYearlyTotals(prev => ({
      ...prev,
      [staffId]: Math.max(0, (prev[staffId] || 0) - 1)
    }));
    setConfirmDelete(null);

    try {
      await deleteDoc(doc(db, 'attendance', key));
    } catch (error) {
      console.error("Error updating attendance:", error);
      fetchData();
    }
  };

  if (loading && staffList.length === 0) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ (Loading)...</div>;
  }

  const currentStaff = staffList;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--accent)' }}>បញ្ជីអវត្តមានរបស់អ្នក</h1>
          <p style={{ color: 'var(--text-secondary)' }}>កត់ត្រា និងត្រួតពិនិត្យការឈប់សម្រាករបស់អ្នកនៅទីនេះ។</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
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

      <div className="glass-panel" style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.6)', padding: '16px 0' }}>
        <div style={{ padding: '0 16px', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          ← អូសទៅឆ្វេង ឬ ស្តាំ ដើម្បីមើលថ្ងៃបន្ថែម →
        </div>
        <table className="attendance-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${daysInMonth * 30 + 150}px` }}>
          <thead>
            <tr>
              <th className="sticky-col" style={{ padding: '16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', position: 'sticky', left: 0, zIndex: 10, minWidth: '150px' }}>
                ឈ្មោះបុគ្គលិក
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', minWidth: '80px' }}>
                សរុបប្រចាំឆ្នាំ
              </th>
              {daysArray.map(day => (
                <th className="day-col" key={day} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderRight: '1px solid rgba(255,255,255,0.05)', minWidth: '40px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentStaff.map((staff, index) => {
              const isCurrentUser = user && user.uid === staff.id;
              
              return (
                <tr key={staff.id} style={{ background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td className="sticky-col" style={{ position: 'sticky', left: 0, zIndex: 10, background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)', padding: '16px', borderRight: '1px solid var(--border)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {staff.fullName || staff.username || 'បុគ្គលិក'}
                        {isCurrentUser && <span style={{ fontSize: '0.7rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '12px' }}>អ្នក</span>}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.email}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', borderRight: '1px solid var(--border)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {yearlyTotals[staff.id] || 0}
                  </td>
                  {daysArray.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const key = `${staff.id}_${dateStr}`;
                    const cellData = attendance[key];

                    return (
                      <td 
                        key={day} 
                        onClick={() => handleCellClick(staff.id, day)}
                        title={cellData?.reason ? `មូលហេតុ: ${cellData.reason}` : undefined}
                        style={{ 
                          padding: '0', 
                          borderRight: '1px solid rgba(255,255,255,0.05)', 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: isCurrentUser ? 'pointer' : 'default',
                          transition: 'background 0.2s',
                          opacity: isCurrentUser ? 1 : 0.7
                        }}
                      >
                        <div className="check-box" style={{ 
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
              );
            })}
          </tbody>
        </table>
      </div>

      {reasonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
              ហេតុផលឈប់សម្រាក
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                សូមបញ្ចូលមូលហេតុ:
              </label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={reasonInput}
                onChange={e => setReasonInput(e.target.value)}
                placeholder="ឧ. ឈឺ, ជាប់ធុរៈគ្រួសារ..."
              />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setReasonModal(null)} className="btn-secondary" style={{ flex: 1 }}>
                បោះបង់
              </button>
              <button onClick={confirmAddTick} className="btn-primary" style={{ flex: 1 }} disabled={!reasonInput.trim()}>
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              តើអ្នកប្រាកដទេ?
            </h3>
            {confirmDelete && attendance[`${confirmDelete.staffId}_${year}-${String(month + 1).padStart(2, '0')}-${String(confirmDelete.day).padStart(2, '0')}`]?.reason && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'left' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>មូលហេតុ:</span>
                <p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>
                  {attendance[`${confirmDelete.staffId}_${year}-${String(month + 1).padStart(2, '0')}-${String(confirmDelete.day).padStart(2, '0')}`].reason}
                </p>
              </div>
            )}
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              តើអ្នកពិតជាចង់លុបការកត់ត្រាថ្ងៃឈប់សម្រាកនេះមែនទេ?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{ flex: 1 }}>
                បោះបង់
              </button>
              <button onClick={confirmRemoveTick} className="btn-primary" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                លុប
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Mobile Table Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .attendance-table th, .attendance-table td {
            padding: 8px 4px !important;
            font-size: 0.75rem !important;
          }
          .attendance-table th.sticky-col, .attendance-table td.sticky-col {
            min-width: 100px !important;
            padding: 8px !important;
          }
          .attendance-table .day-col {
            min-width: 30px !important;
          }
          .attendance-table .check-box {
            height: 30px !important;
          }
        }
      `}} />
    </div>
  );
}
