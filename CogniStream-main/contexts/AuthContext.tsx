
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configura persistência local
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Busca perfil estendido no Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          try {
            const userDoc = await getDoc(userDocRef);
            let userData: UserProfile;

            if (!userDoc.exists()) {
              // Primeiro login: cria perfil no Firestore
              userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: 'user',
                createdAt: serverTimestamp()
              };
              await setDoc(userDocRef, userData);
            } else {
              userData = userDoc.data() as UserProfile;
            }
            setUser(userData);
          } catch (firestoreError) {
            // Firebase offline ou com erro — usar dados básicos do Auth
            console.warn("[Auth] Firestore indisponível, usando dados básicos:", firestoreError);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              createdAt: null
            });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("[Auth] Erro crítico no listener:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Limpeza imediata do estado local
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, data, { merge: true });
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, isAdmin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
