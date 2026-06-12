'use client';
import { useState, useEffect } from 'react';
import { Users, Search, Mail, Shield, ShieldAlert, User, MoreVertical, Trash2, Edit2, Key } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  
  const [editModal, setEditModal] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ fullName: '', username: '', role: '' });
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => {
        data.push({ id: d.id, ...d.data() });
      });
      // Sort admins first, then by username
      data.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return (a.username || '').localeCompare(b.username || '');
      });
      // Assign clean sequential IDs
      data.forEach((u, idx) => {
        u.displayId = String(idx + 1).padStart(4, '0');
      });
      setUsers(data);

      // Fetch yearly totals
      const year = new Date().getFullYear();
      const yearStartStr = `${year}-01-01`;
      const yearEndStr = `${year}-12-31`;
      const attSnap = await getDocs(query(collection(db, 'attendance'), where('date', '>=', yearStartStr), where('date', '<=', yearEndStr)));
      
      const totals: Record<string, number> = {};
      attSnap.forEach(d => {
        const userId = d.data().userId;
        totals[userId] = (totals[userId] || 0) + 1;
      });
      setYearlyTotals(totals);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'users', confirmDelete.id));
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleEditClick = (user: any) => {
    setEditModal(user);
    setEditFormData({
      fullName: user.fullName || '',
      username: user.username || '',
      role: user.role || 'staff'
    });
    setResetMessage({ type: '', text: '' });
  };

  const handleUpdateUser = async () => {
    if (!editModal) return;
    try {
      await updateDoc(doc(db, 'users', editModal.id), {
        fullName: editFormData.fullName,
        username: editFormData.username,
        role: editFormData.role
      });
      setEditModal(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!editModal?.email) return;
    setIsSendingReset(true);
    setResetMessage({ type: '', text: '' });
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, editModal.email);
      setResetMessage({ type: 'success', text: 'បានផ្ញើតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ថ្មីទៅអ៊ីមែលនេះហើយ!' });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setResetMessage({ type: 'error', text: 'បរាជ័យក្នុងការផ្ញើអ៊ីមែល សូមព្យាយាមម្តងទៀត។' });
    }
    setIsSendingReset(false);
  };

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>គ្រប់គ្រងបុគ្គលិក</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            មើលបញ្ជីឈ្មោះបុគ្គលិកទាំងអស់ដែលមានក្នុងប្រព័ន្ធ។
          </p>
        </div>

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="ស្វែងរកឈ្មោះ ឬអ៊ីមែល..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '44px', marginBottom: 0, background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>កំពុងផ្ទុកទិន្នន័យ...</div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 500 }}>ឈ្មោះអ្នកប្រើប្រាស់</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 500 }}>អ៊ីមែល</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 500 }}>អវត្តមានសរុប</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 500 }}>តួនាទី</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', fontWeight: 500 }}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    រកមិនឃើញបុគ្គលិកទេ
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: u.role === 'admin' ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                          {u.role === 'admin' ? <Shield size={20} color="var(--accent)" /> : <User size={20} color="var(--text-secondary)" />}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{u.fullName || u.username || 'គ្មានឈ្មោះ'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>ID: {u.displayId}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={16} />
                        {u.email}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: (yearlyTotals[u.id] || 0) > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {yearlyTotals[u.id] || 0}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {u.role === 'admin' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                          អ្នកគ្រប់គ្រង
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', border: '1px solid var(--border)' }}>
                          បុគ្គលិក
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditClick(u)}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--accent)', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}
                          className="hover:bg-indigo-500/10"
                          title="កែប្រែគណនី"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(u)}
                          disabled={u.role === 'admin'}
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: u.role === 'admin' ? 'rgba(255,255,255,0.1)' : 'var(--danger)', 
                            cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}
                          className={u.role !== 'admin' ? 'hover:bg-red-500/10' : ''}
                          title={u.role === 'admin' ? 'មិនអាចលុប Admin បានទេ' : 'លុបគណនី'}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <ShieldAlert size={32} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              តើអ្នកប្រាកដទេ?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              តើអ្នកពិតជាចង់លុបគណនីរបស់ <strong>{confirmDelete.username}</strong> មែនទេ?
            </p>
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '24px' }}>
              ចំណាំ៖ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ!
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary" style={{ flex: 1 }}>
                បោះបង់
              </button>
              <button onClick={handleDeleteUser} className="btn-primary" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                លុបចេញ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={24} color="var(--accent)" />
              កែប្រែគណនី
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="input-group">
                <label>ឈ្មោះពេញ</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editFormData.fullName}
                  onChange={e => setEditFormData({...editFormData, fullName: e.target.value})}
                  placeholder="ឈ្មោះពេញ"
                />
              </div>
              <div className="input-group">
                <label>ឈ្មោះអ្នកប្រើប្រាស់</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editFormData.username}
                  onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                  placeholder="ឈ្មោះអ្នកប្រើប្រាស់"
                />
              </div>
              <div className="input-group">
                <label>តួនាទី</label>
                <select 
                  className="input-field" 
                  value={editFormData.role}
                  onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                >
                  <option value="staff">បុគ្គលិក</option>
                  <option value="admin">អ្នកគ្រប់គ្រង</option>
                </select>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>សុវត្ថិភាព</label>
                <button 
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  className="btn-secondary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Key size={18} />
                  {isSendingReset ? 'កំពុងផ្ញើ...' : 'ផ្ញើអ៊ីមែលកំណត់ពាក្យសម្ងាត់ថ្មី'}
                </button>
                {resetMessage.text && (
                  <p style={{ 
                    marginTop: '8px', 
                    fontSize: '0.875rem', 
                    color: resetMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    textAlign: 'center'
                  }}>
                    {resetMessage.text}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setEditModal(null)} className="btn-secondary" style={{ flex: 1 }}>
                បោះបង់
              </button>
              <button onClick={handleUpdateUser} className="btn-primary" style={{ flex: 1 }}>
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
