'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // If it doesn't contain an '@', treat it as a username and add a dummy domain for Firebase
    const loginIdentifier = email.includes('@') ? email : `${email}@staff.portal`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, loginIdentifier, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, loginIdentifier, password);
        // Automatically save new users as 'staff' in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fullName: fullName.trim() || email.split('@')[0],
          username: email.includes('@') ? email.split('@')[0] : email,
          email: loginIdentifier,
          role: 'staff',
          createdAt: new Date()
        });
      }
    } catch (err: any) {
      setError(err.message || 'ការចូលប្រើប្រាស់បានបរាជ័យ');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <span style={{ color: 'white', fontSize: '1.5rem' }}>✦</span>
        </div>
        
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
          {isLogin ? 'សូមស្វាគមន៍មកកាន់ការចូលប្រើ' : 'បង្កើតគណនីថ្មី'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'ចូលគណនីដើម្បីចូលទៅកាន់ផ្ទាំងគ្រប់គ្រងរបស់អ្នក' : 'ចុះឈ្មោះដើម្បីស្នើសុំការឈប់សម្រាក និងថវិកា'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {!isLogin && (
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>ឈ្មោះពេញ (Full Name)</label>
              <input 
                type="text" 
                className="input-field" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ឧទាហរណ៍៖ Sok Heang"
                required={!isLogin}
              />
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>ឈ្មោះអ្នកប្រើប្រាស់ (Username)</label>
            <input 
              type="text" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              placeholder="ឧទាហរណ៍៖ heang0"
              required 
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>ពាក្យសម្ងាត់</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '12px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'កំពុងដំណើរការ...' : (isLogin ? <><LogIn size={18} /> ចូលគណនី</> : <><UserPlus size={18} /> ចុះឈ្មោះ</>)}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "មិនទាន់មានគណនីមែនទេ? " : "មានគណនីរួចហើយ? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: 'var(--accent)', fontWeight: 500, padding: '0 4px' }}
          >
            {isLogin ? 'ចុះឈ្មោះនៅទីនេះ' : 'ចូលគណនីនៅទីនេះ'}
          </button>
        </div>
      </div>
    </div>
  );
}
