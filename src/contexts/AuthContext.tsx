import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasRestaurant: boolean | null;
  checkingProfile: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkUserProfile: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const { toast } = useToast();

  const checkUserProfile = async () => {
    if (!user) {
      setHasRestaurant(null);
      return;
    }

    setCheckingProfile(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setHasRestaurant(!!data);
    } catch (error) {
      console.error('Error checking user profile:', error);
      setHasRestaurant(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check profile when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            checkUserProfile();
          }, 0);
        } else if (!session?.user) {
          setHasRestaurant(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkUserProfile();
        }, 0);
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🚀 AuthContext: Starting signup process...', { email, fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      console.log('📡 AuthContext: Supabase signUp response:', { 
        data: data ? {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at
          } : null,
          session: data.session ? 'session_exists' : null
        } : null,
        error 
      });

      if (error) {
        console.error('❌ AuthContext: Signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('❌ AuthContext: No user returned from signup');
        return { error: { message: 'Failed to create user account' } };
      }

      // If user was created but no session was returned, sign them in
      if (!data.session) {
        console.log('🔄 AuthContext: User created but no session, attempting sign-in...');
        
        // Wait for the database trigger to process the user confirmation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Attempt to sign in with the credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('❌ AuthContext: Auto sign-in failed:', signInError);
          
          // If sign-in fails, try to get the current session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('✅ AuthContext: Found existing session after signup');
            toast({
              title: "Welcome to ThinkPost!",
              description: "Your account has been created and you're now signed in."
            });
            return { error: null };
          }
          
          return { error: signInError };
        }

        if (signInData.user && signInData.session) {
          console.log('✅ AuthContext: Auto sign-in successful');
          toast({
            title: "Welcome to ThinkPost!",
            description: "Your account has been created and you're now signed in."
          });
        } else {
          console.error('❌ AuthContext: Sign-in succeeded but no session created');
          return { error: { message: 'Failed to create session after signup' } };
        }
      } else {
        // User was created and session exists (immediate confirmation)
        console.log('✅ AuthContext: User created and auto-confirmed with session');
        toast({
          title: "Welcome to ThinkPost!",
          description: "Your account has been created and you're now signed in."
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ AuthContext: Unexpected signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Don't show toast here, let the form handle it
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setHasRestaurant(null);
        toast({
          title: "Signed out",
          description: "You have been signed out successfully."
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    hasRestaurant,
    checkingProfile,
    signUp,
    signIn,
    signOut,
    checkUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
