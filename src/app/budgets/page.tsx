'use client';
import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Send, Clock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function Budgets() {
  const { user, userRole } = useAuth();
  const [type, setType] = useState('equipment');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  if (userRole === 'admin') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          អ្នកគ្រប់គ្រងមិនចាំបាច់ប្រើទម្រង់នេះទេ។
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          (Admins do not need to request budgets. Please use the Admin tab to view staff requests.)
        </p>
      </div>
    );
  }

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'budget_requests'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side since we didn't create a composite index for where + orderBy
      items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHistory(items);
    } catch (error) {
      console.error("Error fetching budget history:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge badge-success">អនុម័ត (Approved)</span>;
    if (status === 'rejected') return <span className="badge badge-danger">បដិសេធ (Rejected)</span>;
    return <span className="badge badge-warning">កំពុងរង់ចាំ (Pending)</span>;
  };

  const getTypeLabel = (t: string) => {
    if (t === 'equipment') return 'ឧបករណ៍ / សម្ភារៈ';
    if (t === 'travel') return 'ការធ្វើដំណើរ';
    if (t === 'software') return 'កម្មវិធីកុំព្យូទ័រ';
    return 'ផ្សេងៗ';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');

    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const fullName = userDoc.exists() ? (userDoc.data().fullName || userDoc.data().username || 'No Name') : 'No Name';

      // 1. Save to Firebase
      await addDoc(collection(db, 'budget_requests'), {
        userId: user.uid,
        userEmail: user.email,
        type: type, // Ensure type is accurately saved
        amount: parseFloat(amount),
        reason,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Refresh History
      fetchHistory();

      // 3. Send Telegram Notification
      const selectedTypeLabel = getTypeLabel(type);
      const telegramMsg = `💰 <b>New Budget Request</b>\n\n👤 <b>Name:</b> ${fullName}\n📧 <b>Staff:</b> ${user.email}\n💵 <b>Amount:</b> $${amount}\n🏷 <b>Type:</b> ${selectedTypeLabel}\n📝 <b>Reason:</b> ${reason}`;
      
      try {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: telegramMsg })
        });
      } catch (tgError) {
        console.error("Failed to notify Telegram:", tgError);
        // We don't block the user flow if Telegram fails
      }

      setMessage('សំណើថវិការបស់អ្នកត្រូវបានបញ្ជូនដោយជោគជ័យ។ (Budget request submitted!)');
      setType('equipment');
      setAmount('');
      setReason('');
    } catch (error) {
      console.error("Error submitting budget: ", error);
      setMessage('មានបញ្ហាក្នុងការបញ្ជូនសំណើ។ (Error submitting request.)');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>ស្នើសុំថវិកា</h1>
        <p style={{ color: 'var(--text-secondary)' }}>ដាក់ស្នើការចំណាយ ឬការស្នើសុំថវិកាសម្រាប់គម្រោងដែលនឹងមកដល់។</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {/* Left Column: Form */}
        <div className="glass-card" style={{ flex: '1 1 300px', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} style={{ color: 'var(--accent)' }} />
            ទម្រង់ស្នើសុំថវិកា
          </h2>
          
          {message && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '16px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label>ប្រភេទចំណាយ</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)} style={{ appearance: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="equipment" style={{ background: 'var(--bg-primary)' }}>ឧបករណ៍ / សម្ភារៈ</option>
                <option value="travel" style={{ background: 'var(--bg-primary)' }}>ការធ្វើដំណើរ</option>
                <option value="software" style={{ background: 'var(--bg-primary)' }}>កម្មវិធីកុំព្យូទ័រ</option>
                <option value="other" style={{ background: 'var(--bg-primary)' }}>ផ្សេងៗ</option>
              </select>
            </div>

            <div className="input-group">
              <label>ចំនួនទឹកប្រាក់ ($)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="0.00" style={{ paddingLeft: '36px', width: '100%' }} />
              </div>
            </div>

            <div className="input-group">
              <label>ការពិពណ៌នា / ហេតុផល</label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" rows={4} placeholder="ពន្យល់ពីមូលហេតុដែលត្រូវការថវិកានេះ..."></textarea>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              <Send size={18} />
              {loading ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើ'}
            </button>
          </form>
        </div>

        {/* Right Column: History */}
        <div className="glass-panel" style={{ flex: '1.5 1 400px', alignSelf: 'start', overflowX: 'auto', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: 'var(--warning)' }} />
            ប្រវត្តិនៃការស្នើសុំ (Request History)
          </h2>
          
          {history.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              អ្នកមិនទាន់មានសំណើថវិកាណាមួយឡើយ។ (No budget requests yet.)
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: '400px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ប្រភេទ & មូលហេតុ</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ចំនួនទឹកប្រាក់</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 400 }}>ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500 }}>{getTypeLabel(item.type)}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.reason}</div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--success)' }}>
                      ${item.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
