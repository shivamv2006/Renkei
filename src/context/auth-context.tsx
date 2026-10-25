'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { normalizeUsername } from '@/lib/validation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MOCK_CURRENT_USER, MOCK_USERS } from '@/lib/mock-data';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  signupWithEmail: (
    email: string,
    password: string,
    displayName: string,
    username?: string
  ) => Promise<{ error?: string; requiresVerification?: boolean }>;
  resetPasswordEmail: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updateUserPassword: (newPassword: string) => Promise<{ error?: string; success?: boolean }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  switchDemoUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      // Supabase credentials not yet provided -> Run in Demo/Evaluation mode
      setIsDemoMode(true);
      const savedUserId = typeof window !== 'undefined'
        ? localStorage.getItem('genzoku_demo_user')
        : null;
      const foundUser = MOCK_USERS.find((u) => u.id === savedUserId) || MOCK_CURRENT_USER;
      setUser(foundUser);
      setIsLoading(false);
      return;
    }

    setIsDemoMode(false);

    // Safety timeout to prevent infinite loading screen if network is slow
    const initTimeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn('[GENZOKU] Auth session check timed out, unblocking loading screen');
          setUser(null);
          return false;
        }
        return false;
      });
    }, 2000);

    // Initial Supabase Session Check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        clearTimeout(initTimeout);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(initTimeout);
        console.warn('[GENZOKU] Auth getSession error:', err);
        setUser(null);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(initTimeout);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser(data as UserProfile);
      } else {
        // Fallback to auth metadata if profile row creation was delayed
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const rawUsername = authUser.user_metadata?.username || `user_${authUser.id.slice(0, 8)}`;
          const fallbackProfile: UserProfile = {
            id: authUser.id,
            username: normalizeUsername(rawUsername),
            display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'GENZOKU Member',
            email: authUser.email || null,
            phone_number: authUser.phone || null,
            status_text: 'Active on GENZOKU',
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(fallbackProfile);

          // Upsert into profiles table
          await supabase.from('profiles').upsert({
            id: authUser.id,
            username: fallbackProfile.username,
            display_name: fallbackProfile.display_name,
            email: fallbackProfile.email,
          }, { onConflict: 'id' });
        }
      }
    } catch (err) {
      console.error('[GENZOKU] Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const loginWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Demo mode fallback
      const matching = MOCK_USERS.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (matching) {
        setUser(matching);
        localStorage.setItem('genzoku_demo_user', matching.id);
        return {};
      }
      return { error: 'In demo mode, try kenji@genzoku.app, aoi@genzoku.app, or ren@genzoku.app' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { error: error.message };
    return {};
  };

  const loginWithGoogle = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Supabase credentials are not configured.' };
    }

    const redirectUrl = typeof window !== 'undefined'
      ? (window.location.origin.includes('localhost') && !window.location.origin.includes(':3000')
          ? 'https://localhost'
          : `${window.location.origin}`)
      : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    username?: string
  ) => {
    const cleanDisplayName = displayName.trim();
    const finalUsername = normalizeUsername(
      username && username.trim().length > 0
        ? username
        : `user_${Date.now().toString().slice(-6)}`
    );

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Demo mode signup
      const newUser: UserProfile = {
        id: `demo-${Date.now()}`,
        username: finalUsername,
        display_name: cleanDisplayName,
        email: email.trim().toLowerCase(),
        status_text: 'Active on GENZOKU',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('genzoku_demo_user', newUser.id);
      return {};
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', finalUsername)
      .maybeSingle();

    if (existingUser) {
      return { error: 'Username is already taken. Please choose another username.' };
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          username: finalUsername,
          display_name: cleanDisplayName,
        },
      },
    });

    if (error) return { error: error.message };

    // Duplicate email check: Supabase returns identities: [] when email exists and confirmation is active
    if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    // Insert profile row
    if (signUpData?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          username: finalUsername,
          display_name: cleanDisplayName,
          email: email.trim().toLowerCase(),
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('[GENZOKU] Initial profile upsert notification:', profileErr);
      }
    }

    const requiresVerification = !signUpData?.session;
    return { requiresVerification };
  };

  const resetPasswordEmail = async (email: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { success: true };
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });

    if (error) return { error: error.message };
    return { success: true };
  };

  const updateUserPassword = async (newPassword: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { success: true };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('genzoku_demo_user');
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'Not authenticated' };
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', user.id);
      } catch (err) {
        console.error('[GENZOKU] Profile deletion notice:', err);
      }
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('genzoku_demo_user');
    }
    return {};
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser({ ...user, ...updates });
      return {};
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) return { error: error.message };
    setUser({ ...user, ...updates });
    return {};
  };

  const switchDemoUser = (userId: string) => {
    const target = MOCK_USERS.find((u) => u.id === userId);
    if (target) {
      setUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('genzoku_demo_user', target.id);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        loginWithEmail,
        loginWithGoogle,
        signupWithEmail,
        resetPasswordEmail,
        updateUserPassword,
        logout,
        deleteAccount,
        updateProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
