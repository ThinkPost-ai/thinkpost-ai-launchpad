
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type RestaurantCategory = Database['public']['Enums']['restaurant_category'];

interface RestaurantData {
  restaurantName: string;
  restaurantLocation: string;
  restaurantCategory: RestaurantCategory;
  restaurantVision?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasRestaurant: boolean | null;
  checkingProfile: boolean;
  signUp: (email: string, password: string, fullName: string, restaurantData?: RestaurantData) => Promise<{ error: any }>;
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

  const signUp = async (email: string, password: string, fullName: string, restaurantData?: RestaurantData) => {
    try {
      const metadata: any = {
        full_name: fullName
      };

      // Add restaurant data to metadata if provided
      if (restaurantData) {
        metadata.restaurant_name = restaurantData.restaurantName;
        metadata.restaurant_location = restaurantData.restaurantLocation;
        metadata.restaurant_category = restaurantData.restaurantCategory;
        metadata.restaurant_vision = restaurantData.restaurantVision;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata
        }
      });

      if (error) {
        // Don't show toast here, let the form handle it
        return { error };
      }

      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account before signing in."
      });

      return { error: null };
    } catch (error: any) {
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
