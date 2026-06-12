'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        let currentRole = 'staff';
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          let username = '';
          if (docSnap.exists()) {
            currentRole = docSnap.data().role || 'staff';
            username = docSnap.data().username || '';
          }
          
          // If document doesn't exist, OR if we need to force admin, we write to the database!
          const isAdmin = currentUser.email?.toLowerCase().includes('admin') || username.toLowerCase() === 'admin';
          const finalRole = isAdmin ? 'admin' : (currentRole || 'staff');
          
          if (!docSnap.exists() || (isAdmin && currentRole !== 'admin')) {
            currentRole = finalRole;
            try {
              await setDoc(docRef, { 
                email: currentUser.email,
                fullName: username || currentUser.email?.split('@')[0] || 'Unknown',
                username: username || currentUser.email?.split('@')[0] || 'Unknown',
                role: currentRole
              }, { merge: true });
            } catch (e) {
              console.error("Auto-recovery failed to create user document:", e);
            }
          }
          
          setUserRole(currentRole);
        } catch (e) {
          console.error("Error fetching role:", e);
          setUserRole('staff');
        }
        
        if (pathname === '/login') {
          router.push(currentRole === 'admin' ? '/admin' : '/dashboard');
        }
      } else {
        setUserRole(null);
        // Only force login for specific private routes
        if (pathname === '/dashboard' || pathname === '/attendance' || pathname === '/admin/attendance' || pathname === '/budgets' || pathname === '/settings' || pathname === '/admin') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
