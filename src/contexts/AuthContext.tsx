
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithTikTok: () => Promise<void>;
  checkUserProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign Up Failed", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithTikTok = async () => {
    // This is handled by the TikTokSignInButton component
    // The actual OAuth flow redirects to TikTok and back
    throw new Error('Use TikTokSignInButton component for TikTok authentication');
  };

  const checkUserProfile = async () => {
    if (!user) return;
    
    try {
      // This method can be used to refresh user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      console.log('User profile checked:', profile);
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  const value = {
    session,
    user,
    signOut,
    signIn,
    signUp,
    signInWithTikTok,
    checkUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
