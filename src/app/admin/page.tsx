'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchRequests();
    }
  }, [userRole, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const budgetQ = query(collection(db, 'budget_requests'), where('status', '==', activeTab));
      const budgetSnap = await getDocs(budgetQ);
      const items: any[] = budgetSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort client-side by date if it exists
      items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setRequests(items);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (collectionName: string, id: string, status: 'approved' | 'rejected') => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, { status });
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (authLoading || userRole !== 'admin') return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ (Loading)...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--accent)' }}>អ្នកគ្រប់គ្រង</h1>
          <p style={{ color: 'var(--text-secondary)' }}>ពិនិត្យ និងគ្រប់គ្រងសំណើទាំងអស់របស់បុគ្គលិក។</p>
        </div>
        <button onClick={fetchRequests} className="btn-secondary">
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 500, background: activeTab === 'pending' ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: activeTab === 'pending' ? 'white' : 'var(--text-secondary)' }}
        >
          កំពុងរង់ចាំ
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 500, background: activeTab === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === 'approved' ? 'var(--success)' : 'var(--text-secondary)' }}
        >
          បានអនុម័ត
        </button>
        <button 
          onClick={() => setActiveTab('rejected')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 500, background: activeTab === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === 'rejected' ? 'var(--danger)' : 'var(--text-secondary)' }}
        >
          បានបដិសេធ
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} style={{ color: activeTab === 'pending' ? 'var(--warning)' : activeTab === 'approved' ? 'var(--success)' : 'var(--danger)' }} />
          បញ្ជីសំណើថវិកា
        </h2>
        
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>កំពុងផ្ទុក...</p>
        ) : requests.length === 0 ? (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            មិនមានសំណើនៅក្នុងផ្នែកនេះទេ។
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>បុគ្គលិក</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ចំនួនទឹកប្រាក់</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>មូលហេតុ</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 400, textAlign: 'right' }}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    <div>{item.userEmail}</div>
                    {item.type && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ប្រភេទ: {item.type}</div>}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--success)' }}>${item.amount.toFixed(2)}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.reason}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {activeTab === 'pending' ? (
                      <>
                        <button onClick={() => handleUpdateStatus('budget_requests', item.id, 'approved')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={16} /> អនុម័ត
                        </button>
                        <button onClick={() => handleUpdateStatus('budget_requests', item.id, 'rejected')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <XCircle size={16} /> បដិសេធ
                        </button>
                      </>
                    ) : (
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.875rem',
                        background: activeTab === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: activeTab === 'approved' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {activeTab === 'approved' ? 'បានអនុម័ត' : 'បានបដិសេធ'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
