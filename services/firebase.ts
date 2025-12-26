
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateEmail, updatePassword } from 'firebase/auth';
// @ts-ignore
import { getFirestore, collection, query, onSnapshot, doc, setLogLevel, addDoc, updateDoc, deleteDoc, setDoc, writeBatch, getDoc } from 'firebase/firestore';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';

import { Firestore, Auth, User } from '../types';

declare global {
  interface Window {
    __app_id?: string;
    __firebase_config?: string;
    __initial_auth_token?: string;
    __supabase_config?: string;
  }
}

const LOCAL_STORAGE_USER_KEY = 'smart_electronics_user_session';
const CLOUD_PROVIDER_KEY = 'smart_cloud_provider'; 
const AUTH_CHANGE_EVENT = 'smart-auth-change';

// --- Provider Management ---
export const getCloudProvider = (): 'firebase' | 'supabase' | 'none' => {
  return (localStorage.getItem(CLOUD_PROVIDER_KEY) as any) || 'none';
};

export const setCloudProvider = (provider: 'firebase' | 'supabase' | 'none') => {
  localStorage.setItem(CLOUD_PROVIDER_KEY, provider);
};

// --- Supabase Setup ---
const customSupabaseConfigStr = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_config') : null;
const supabaseConfig = customSupabaseConfigStr ? JSON.parse(customSupabaseConfigStr) : null;

let supabase: any = null;
if (supabaseConfig && supabaseConfig.url && supabaseConfig.key) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.key);
}

// --- Firebase Setup ---
const customFirebaseConfigStr = typeof window !== 'undefined' ? localStorage.getItem('custom_firebase_config') : null;
const firebaseConfig = customFirebaseConfigStr ? JSON.parse(customFirebaseConfigStr) : null;
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'vyapar-lite-app';

// --- Universal Data Helpers ---

export const addEntry = async (db: Firestore | null, userId: string, collectionName: string, data: any) => {
  const provider = getCloudProvider();
  
  if (provider === 'firebase' && db) {
     const path = `artifacts/${appId}/users/${userId}/${collectionName}`;
     return await addDoc(collection(db, path), data);
  }
  
  if (provider === 'supabase' && supabase) {
     const { data: inserted, error } = await supabase
       .from(collectionName)
       .insert([{ user_id: userId, ...data }])
       .select()
       .single();
     if (error) throw error;
     return inserted;
  }

  const key = `smart_data_${userId}_${collectionName}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const newItem = { id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...data };
  list.push(newItem);
  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event('local-data-change'));
  return newItem;
};

export const updateEntry = async (db: Firestore | null, userId: string, collectionName: string, docId: string, data: any) => {
  const provider = getCloudProvider();

  if (provider === 'firebase' && db) {
     const path = `artifacts/${appId}/users/${userId}/${collectionName}`;
     return await setDoc(doc(db, path, docId), data, { merge: true });
  }

  if (provider === 'supabase' && supabase) {
     const { error } = await supabase
       .from(collectionName)
       .update(data)
       .eq('id', docId);
     if (error) throw error;
     return;
  }

  const key = `smart_data_${userId}_${collectionName}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const index = list.findIndex((i: any) => i.id === docId);
  if (index !== -1) {
      list[index] = { ...list[index], ...data };
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new Event('local-data-change'));
  }
};

export const deleteEntry = async (db: Firestore | null, userId: string, collectionName: string, docId: string) => {
  const provider = getCloudProvider();

  if (provider === 'firebase' && db) {
     const path = `artifacts/${appId}/users/${userId}/${collectionName}`;
     return await deleteDoc(doc(db, path, docId));
  }

  if (provider === 'supabase' && supabase) {
     const { error } = await supabase
       .from(collectionName)
       .delete()
       .eq('id', docId);
     if (error) throw error;
     return;
  }

  const key = `smart_data_${userId}_${collectionName}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const filtered = list.filter((i: any) => i.id !== docId);
  localStorage.setItem(key, JSON.stringify(filtered));
  window.dispatchEvent(new Event('local-data-change'));
};

export const saveSettings = async (db: Firestore | null, userId: string, data: any) => {
    const provider = getCloudProvider();
    
    if (provider === 'firebase' && db) {
        const path = `artifacts/${appId}/users/${userId}/company_settings/profile`;
        return await setDoc(doc(db, path), data);
    }

    if (provider === 'supabase' && supabase) {
        const { error } = await supabase
          .from('company_settings')
          .upsert({ user_id: userId, profile: data });
        if (error) throw error;
        return;
    }

    const key = `smart_data_${userId}_settings`;
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-change'));
};

// --- Auth Dispatcher ---
const notifyAuthChange = () => {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    window.dispatchEvent(new Event('storage')); 
};

// --- Auth Mocking ---
export const mockLogin = async (email: string, pass: string) => {
  if (email === 'smartelectronics22111@gmail.com' && pass === 'Smart@2025') {
     const user = { email, uid: 'mock_admin_smart_electronics' };
     localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
     notifyAuthChange();
     return user;
  }
  const stored = localStorage.getItem('mock_user_' + email);
  if (!stored) throw { code: 'auth/user-not-found' };
  if (stored !== pass) throw { code: 'auth/wrong-password' };
  const user = { email, uid: 'mock_' + email };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  notifyAuthChange();
  return user;
};

export const mockRegister = async (email: string, pass: string) => {
  localStorage.setItem('mock_user_' + email, pass);
  const user = { email, uid: 'mock_' + email };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  notifyAuthChange();
  return user;
};

// --- Mock User Management for Master Admin ---
export const getAllMockUsers = () => {
    const users: {email: string}[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mock_user_')) {
            users.push({ email: key.replace('mock_user_', '') });
        }
    }
    return users;
};

export const updateMockUserPassword = (email: string, newPass: string) => {
    localStorage.setItem('mock_user_' + email, newPass);
};

export const deleteMockUser = (email: string) => {
    localStorage.removeItem('mock_user_' + email);
    const userId = 'mock_' + email;
    const collections = ['inventory', 'invoices', 'purchases', 'customers', 'quotations', 'settings'];
    collections.forEach(col => {
        localStorage.removeItem(`smart_data_${userId}_${col}`);
    });
};

export const login = async (auth: Auth, email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const register = async (auth: Auth, email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const logout = async (auth: Auth) => {
  const provider = getCloudProvider();
  try {
    if (provider === 'firebase' && auth) await signOut(auth);
    if (provider === 'supabase' && supabase) await supabase.auth.signOut();
  } catch (e) {
    console.warn("Cloud logout failed, clearing local session anyway.");
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  notifyAuthChange();
  
  // Force a full reload to clear all states and memory
  window.location.reload();
};

// --- Hooks ---

export const useFirebase = () => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const provider = getCloudProvider();

  const syncStateWithStorage = useCallback(() => {
    const storedSession = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (storedSession) {
      try {
        const user = JSON.parse(storedSession);
        setUserId(user.uid);
        setCurrentUser(user);
      } catch (e) {
        setUserId(null);
        setCurrentUser(null);
      }
    } else {
      setUserId(null);
      setCurrentUser(null);
    }
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    // Immediate listener setup
    window.addEventListener(AUTH_CHANGE_EVENT, syncStateWithStorage);
    window.addEventListener('storage', syncStateWithStorage);

    // Safety fallback: if auth takes too long, mark as ready anyway
    const safetyTimeout = setTimeout(() => {
      if (!isAuthReady) setIsAuthReady(true);
    }, 3000);

    if (provider === 'none') {
        syncStateWithStorage();
    } else if (provider === 'firebase' && firebaseConfig) {
        try {
            setLogLevel('silent');
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            setDb(firestore);
            setAuth(authInstance);
            const unsubscribe = onAuthStateChanged(authInstance, (user: any) => {
                if (user) {
                    setUserId(user.uid);
                    setCurrentUser(user);
                    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({ uid: user.uid, email: user.email }));
                } else {
                    syncStateWithStorage();
                }
                setIsAuthReady(true);
            });
            // Cleanup on switch
            return () => {
              unsubscribe();
              clearTimeout(safetyTimeout);
              window.removeEventListener(AUTH_CHANGE_EVENT, syncStateWithStorage);
              window.removeEventListener('storage', syncStateWithStorage);
            };
        } catch (e) {
            console.error("Firebase init failed", e);
            syncStateWithStorage();
        }
    } else if (provider === 'supabase' && supabase) {
        supabase.auth.getSession().then(({ data: { session } }: any) => {
            if (session?.user) {
                setUserId(session.user.id);
                setCurrentUser(session.user);
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({ uid: session.user.id, email: session.user.email }));
            } else {
                syncStateWithStorage();
            }
            setIsAuthReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            if (session?.user) {
                setUserId(session.user.id);
                setCurrentUser(session.user);
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({ uid: session.user.id, email: session.user.email }));
            } else {
                syncStateWithStorage();
            }
        });
        return () => {
          subscription.unsubscribe();
          clearTimeout(safetyTimeout);
          window.removeEventListener(AUTH_CHANGE_EVENT, syncStateWithStorage);
          window.removeEventListener('storage', syncStateWithStorage);
        };
    } else {
        // Fallback for no config or unknown provider
        syncStateWithStorage();
    }
    
    return () => {
        clearTimeout(safetyTimeout);
        window.removeEventListener(AUTH_CHANGE_EVENT, syncStateWithStorage);
        window.removeEventListener('storage', syncStateWithStorage);
    };
  }, [provider, syncStateWithStorage, isAuthReady]);

  return { db, auth, userId, currentUser, isAuthReady, appId, provider };
};

export const useFirestoreData = <T>(db: Firestore | null, userId: string | null, collectionName: string, isAuthReady: boolean) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const provider = getCloudProvider();

  useEffect(() => {
    if (!isAuthReady || !userId) {
        if (isAuthReady) {
          setData([]);
          setLoading(false);
        }
        return;
    }

    if (provider === 'none') {
        const key = `smart_data_${userId}_${collectionName}`;
        const local = localStorage.getItem(key);
        if (local) setData(JSON.parse(local));
        else setData([]);
        setLoading(false);
        const handle = () => {
            const updated = localStorage.getItem(key);
            if (updated) setData(JSON.parse(updated));
            else setData([]);
        };
        window.addEventListener('local-data-change', handle);
        return () => window.removeEventListener('local-data-change', handle);
    }

    if (provider === 'firebase' && db) {
        const path = `artifacts/${appId}/users/${userId}/${collectionName}`;
        const q = query(collection(db, path));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setData(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }

    if (provider === 'supabase' && supabase) {
        const fetchSupabase = async () => {
            const { data: items, error } = await supabase
                .from(collectionName)
                .select('*')
                .eq('user_id', userId);
            if (!error) setData(items || []);
            setLoading(false);
        };
        fetchSupabase();
        const channel = supabase.channel(`realtime_${collectionName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, fetchSupabase)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }
  }, [db, userId, isAuthReady, collectionName, provider]);

  return { data, loading };
};

export const useCompanySettings = (db: Firestore | null, userId: string | null, isAuthReady: boolean) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const provider = getCloudProvider();

  useEffect(() => {
    if (!isAuthReady || !userId) {
        if (isAuthReady) {
            setSettings(null);
            setLoading(false);
        }
        return;
    }

    if (provider === 'none') {
        const local = localStorage.getItem(`smart_data_${userId}_settings`);
        if (local) setSettings(JSON.parse(local));
        else setSettings(null);
        setLoading(false);
        return;
    }

    if (provider === 'firebase' && db) {
        const docPath = `artifacts/${appId}/users/${userId}/company_settings/profile`;
        const unsubscribe = onSnapshot(doc(db, docPath), (snap: any) => {
            if (snap.exists()) setSettings(snap.data());
            else setSettings(null);
            setLoading(false);
        });
        return () => unsubscribe();
    }

    if (provider === 'supabase' && supabase) {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('company_settings')
                .select('profile')
                .eq('user_id', userId)
                .single();
            if (!error && data) setSettings(data.profile);
            else setSettings(null);
            setLoading(false);
        };
        fetchSettings();
    }
  }, [db, userId, isAuthReady, provider]);

  return { settings, loading };
};

export const syncLocalToCloud = async (db: Firestore | null, userId: string) => {
    const provider = getCloudProvider();
    const collections = ['inventory', 'invoices', 'purchases', 'customers', 'quotations'];
    let count = 0;

    for (const col of collections) {
        const key = `smart_data_${userId}_${col}`;
        const localData = JSON.parse(localStorage.getItem(key) || '[]');
        if (localData.length > 0) {
            for (const item of localData) {
                const { id, ...cleanData } = item;
                await addEntry(db, userId, col, cleanData);
                count++;
            }
        }
    }
    
    const settingsKey = `smart_data_${userId}_settings`;
    const localSettings = localStorage.getItem(settingsKey);
    if (localSettings) {
        await saveSettings(db, userId, JSON.parse(localSettings));
        count++;
    }

    alert(`Synced ${count} records to ${provider === 'firebase' ? 'Firebase' : 'Supabase'}.`);
};
