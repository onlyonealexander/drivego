import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        return {
          id:    authUser.id,
          email: authUser.email,
          name:  authUser.user_metadata?.name || authUser.email.split('@')[0],
          role:  authUser.user_metadata?.role || 'renter',
        };
      }

      return {
        id:    authUser.id,
        email: authUser.email,
        name:  data.name  || authUser.email.split('@')[0],
        role:  data.role  || 'renter',
        phone: data.phone || '',
        city:  data.city  || '',
        avatar_url: data.avatar_url || '',
      };
    } catch {
      return {
        id:    authUser.id,
        email: authUser.email,
        name:  authUser.user_metadata?.name || authUser.email.split('@')[0],
        role:  authUser.user_metadata?.role || 'renter',
      };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, name, role, city) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, city: city || '' },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}