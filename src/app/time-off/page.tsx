'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Send } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function TimeOff() {
  const { user } = useAuth();
  const [type, setType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Balance calculation state
  const [usedDays, setUsedDays] = useState(0);
  const totalDays = 20;

  useEffect(() => {
    if (user) fetchUsedDays();
  }, [user]);

  const fetchUsedDays = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'time_off_requests'),
        where('userId', '==', user.uid),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      let totalUsed = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        totalUsed += (days > 0 ? days : 1);
      });
      setUsedDays(totalUsed);
    } catch (error) {
      console.error("Error fetching used days:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'time_off_requests'), {
        userId: user.uid,
        userEmail: user.email,
        type,
        startDate,
        endDate,
        reason,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setMessage('សំណើរបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ។ (Your request has been submitted successfully!)');
      setType('vacation');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (error) {
      console.error("Error submitting request: ", error);
      setMessage('មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ (Error submitting request.)');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>សុំច្បាប់សម្រាក</h1>
        <p style={{ color: 'var(--text-secondary)' }}>ដាក់ស្នើកាលបរិច្ឆេទឈប់សម្រាករបស់អ្នកដើម្បីសុំការអនុម័តពីអ្នកគ្រប់គ្រង។</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--accent)' }} />
            ទម្រង់ស្នើសុំ
          </h2>
          
          {message && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '16px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div className="input-group">
              <label>ប្រភេទនៃការឈប់សម្រាក</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)} style={{ appearance: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="vacation" style={{ background: 'var(--bg-primary)' }}>វិស្សមកាល / ការឈប់សម្រាកប្រចាំឆ្នាំ</option>
                <option value="sick" style={{ background: 'var(--bg-primary)' }}>ឈឺ</option>
                <option value="personal" style={{ background: 'var(--bg-primary)' }}>ហេតុផលផ្ទាល់ខ្លួន</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>កាលបរិច្ឆេទចាប់ផ្តើម</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>កាលបរិច្ឆេទបញ្ចប់</label>
                <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="input-group">
              <label>មូលហេតុ / មតិយោបល់</label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" rows={4} placeholder="ព័ត៌មានលម្អិតបន្ថែមសម្រាប់អ្នកគ្រប់គ្រងរបស់អ្នក..."></textarea>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              <Send size={18} />
              {loading ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើ'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
              ទិដ្ឋភាពទូទៅនៃសមតុល្យ
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>សរុបប្រចាំឆ្នាំ</span>
              <span style={{ fontWeight: 500 }}>{totalDays} ថ្ងៃ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>បានប្រើប្រាស់ (អនុម័តរួច)</span>
              <span style={{ fontWeight: 500 }}>{usedDays} ថ្ងៃ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>នៅសល់</span>
              <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{totalDays - usedDays} ថ្ងៃ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
