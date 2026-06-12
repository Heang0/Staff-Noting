'use client';
import { useState, useEffect } from 'react';
import { Calendar, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Stats
  const [usedDays, setUsedDays] = useState(0);
  const totalDays = 20;
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedBudget, setApprovedBudget] = useState(0);
  
  // Recent Activity
  const [activity, setActivity] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (userRole === 'admin') {
      router.push('/admin');
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, userRole, router]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // 1. Fetch Attendance (Days Off) for this user
      const timeQ = query(collection(db, 'attendance'), where('userId', '==', user.uid));
      const timeSnap = await getDocs(timeQ);
      
      const year = new Date().getFullYear();
      const yearStartStr = `${year}-01-01`;
      const yearEndStr = `${year}-12-31`;

      let uDays = 0;
      let timeItems: any[] = [];
      
      timeSnap.forEach((doc) => {
        const data = doc.data();
        
        // Filter by current year in JavaScript to avoid Firebase index error
        if (data.date >= yearStartStr && data.date <= yearEndStr) {
          uDays += 1;
          
          timeItems.push({
            id: doc.id,
            category: 'ថ្ងៃឈប់សម្រាក (Day Off)',
            title: 'កត់ត្រាអវត្តមាន',
            dateOrAmount: data.date,
            status: 'approved', // Ticked days are automatically approved
            timestamp: new Date(data.date).getTime()
          });
        }
      });

      // 2. Fetch Budget Requests
      const budgetQ = query(collection(db, 'budget_requests'), where('userId', '==', user.uid));
      const budgetSnap = await getDocs(budgetQ);
      
      let aBudget = 0;
      let pCount = 0;
      let budgetItems: any[] = [];
      
      budgetSnap.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'approved') {
          aBudget += data.amount;
        } else if (data.status === 'pending') {
          pCount++;
        }
        
        budgetItems.push({
          id: doc.id,
          category: 'សំណើថវិកា (Budget)',
          title: data.reason,
          dateOrAmount: `$${data.amount.toFixed(2)}`,
          status: data.status,
          timestamp: data.createdAt?.toMillis() || Date.now()
        });
      });

      setUsedDays(uDays);
      setPendingCount(pCount);
      setApprovedBudget(aBudget);
      
      // Merge and sort activity
      const allActivity = [...timeItems, ...budgetItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      setActivity(allActivity);
      
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge badge-success">អនុម័ត (Approved)</span>;
    if (status === 'rejected') return <span className="badge badge-danger">បដិសេធ (Rejected)</span>;
    return <span className="badge badge-warning">កំពុងរង់ចាំ (Pending)</span>;
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ (Loading)...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>ផ្ទាំងគ្រប់គ្រង (Dashboard)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>ទិដ្ឋភាពទូទៅនៃសំណើនិងសមតុល្យរបស់អ្នក។</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {userRole !== 'admin' && (
            <Link href="/budgets" className="btn-secondary">ស្នើសុំថវិកា</Link>
          )}
          <Link href="/attendance" className="btn-primary">បញ្ជីអវត្តមាន</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Balance Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>សមតុល្យថ្ងៃឈប់សម្រាក</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 500 }}>{totalDays - usedDays}</span>
            <span style={{ color: 'var(--text-secondary)' }}>ថ្ងៃដែលនៅសល់ (Days Left)</span>
          </div>
        </div>

        {/* Pending Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)' }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>សំណើដែលកំពុងរង់ចាំ</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 500 }}>{pendingCount}</span>
            <span style={{ color: 'var(--text-secondary)' }}>រង់ចាំការអនុម័ត (Pending)</span>
          </div>
        </div>

        {/* Budget Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
              <CreditCard size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem' }}>ថវិកាដែលបានអនុម័ត</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 500 }}>${approvedBudget.toFixed(2)}</span>
            <span style={{ color: 'var(--text-secondary)' }}>សរុប (Total)</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>សកម្មភាពថ្មីៗ (Recent Activity)</h2>
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        {activity.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>មិនមានសកម្មភាពថ្មីៗទេ។ (No recent activity)</p>
        ) : (
          <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ប្រភេទ</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>កាលបរិច្ឆេទ / ចំនួនទឹកប្រាក់</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500 }}>{item.category}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.title}</div>
                  </td>
                  <td style={{ padding: '16px' }}>{item.dateOrAmount}</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
