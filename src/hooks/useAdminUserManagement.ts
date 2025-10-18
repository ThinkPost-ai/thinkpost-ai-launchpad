import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  caption_credits: number;
  tiktok_connected: boolean | null;
  instagram_connected: boolean | null;
  total_uploads: number;
  captions_generated: number;
  created_at: string;
  updated_at: string;
  auth_provider: string | null;
  restaurant_name: string | null;
  category: string | null;
  role: string;
  scheduled_posts_count: number;
  posted_count: number;
}

export interface UserStats {
  totalUsers: number;
  todaySignups: number;
  activeUsers: number;
  avgCredits: number;
}

export const useAdminUserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    todaySignups: 0,
    activeUsers: 0,
    avgCredits: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterConnected, setFilterConnected] = useState<string>('all');
  const [defaultCredits, setDefaultCredits] = useState<number>(15);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting to fetch admin users data...');
      
      // Use a database function to get users with proper created_at from auth.users
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_admin_users_data');

      console.log('📊 Users data result:', { usersData, usersError });
      if (usersError) throw usersError;

      // Get upload and caption counts from products table (where actual uploads are stored)
      console.log('🖼️ Fetching product stats from products table...');
      const { data: productStats, error: productError } = await supabase
        .from('products')
        .select('user_id, caption');

      console.log('📷 Product stats fetched:', { 
        totalProducts: productStats?.length, 
        error: productError 
      });
      if (productError) {
        console.error('❌ Error fetching product stats:', productError);
        throw productError;
      }

      // Process the data
      const processedUsers: AdminUser[] = (usersData || []).map(user => {
        // Get all products for this user
        const userProducts = productStats?.filter(p => p.user_id === user.id) || [];
        
        // Uploads = total number of products (each product is an upload)
        const totalUploads = userProducts.length;
        
        // Captions = how many products have captions
        const totalCaptions = userProducts.filter(p => p.caption !== null && p.caption !== '').length;
        
        console.log(`📊 User ${user.email}: ${totalUploads} uploads (products), ${totalCaptions} captions`);
        
        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || null,
          caption_credits: user.caption_credits,
          tiktok_connected: user.tiktok_connected,
          instagram_connected: user.instagram_connected,
          total_uploads: totalUploads,
          captions_generated: totalCaptions,
          created_at: user.created_at, // Now using real created_at from auth.users
          updated_at: user.updated_at,
          auth_provider: user.auth_provider,
          restaurant_name: user.restaurant_name || null,
          category: user.category || null,
          role: user.role || 'user',
          scheduled_posts_count: user.scheduled_posts_count || 0,
          posted_count: user.posted_count || 0
        };
      });

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todaySignups = processedUsers.filter(user => 
        user.created_at.startsWith(today)
      ).length;

      const activeUsers = processedUsers.filter(user => 
        user.total_uploads > 0 || user.captions_generated > 0
      ).length;

      const avgCredits = processedUsers.length > 0 
        ? processedUsers.reduce((sum, user) => sum + user.caption_credits, 0) / processedUsers.length
        : 0;

      setStats({
        totalUsers: processedUsers.length,
        todaySignups,
        activeUsers,
        avgCredits: Math.round(avgCredits * 10) / 10
      });

      console.log('✅ Successfully processed user data:', { 
        totalUsers: processedUsers.length, 
        todaySignups, 
        activeUsers, 
        avgCredits: Math.round(avgCredits * 10) / 10 
      });

    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Call the Edge Function using Supabase client for better error handling
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: data?.message || "User deleted successfully and logged out from all devices"
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
      console.log('💳 Attempting to update credits:', { userId, newCredits });
      
      // Check current user role first
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('👤 Current user:', currentUser?.user?.id);
      
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser?.user?.id)
        .single();
      
      console.log('🔑 Current user role:', currentProfile?.role);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ caption_credits: newCredits })
        .eq('id', userId)
        .select();

      console.log('📊 Update result:', { data, error });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "User credits updated successfully"
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('❌ Error updating credits:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update credits",
        variant: "destructive"
      });
    }
  };

  const bulkCreditReset = async (creditAmount: number = 30) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ caption_credits: creditAmount })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users

      if (error) throw error;

      toast({
        title: "Success",
        description: `All users' credits reset to ${creditAmount}`
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error resetting credits:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset credits",
        variant: "destructive"
      });
    }
  };

  const getDefaultCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_caption_credits')
        .single();

      if (error) throw error;
      
      const credits = parseInt(data.setting_value);
      setDefaultCredits(credits);
      return credits;
    } catch (error: any) {
      console.error('Error getting default credits:', error);
      return 15; // fallback
    }
  };

  const updateDefaultCredits = async (newDefaultCredits: number) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: newDefaultCredits.toString() })
        .eq('setting_key', 'default_caption_credits');

      if (error) throw error;

      setDefaultCredits(newDefaultCredits);
      toast({
        title: "Success",
        description: `Default credits for new users updated to ${newDefaultCredits}`
      });
    } catch (error: any) {
      console.error('Error updating default credits:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to update default credits",
        variant: "destructive"
      });
    }
  };

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply provider filter
    if (filterProvider !== 'all') {
      filtered = filtered.filter(user => user.auth_provider === filterProvider);
    }

    // Apply connection filter
    if (filterConnected !== 'all') {
      if (filterConnected === 'connected') {
        filtered = filtered.filter(user => user.tiktok_connected || user.instagram_connected);
      } else if (filterConnected === 'not_connected') {
        filtered = filtered.filter(user => !user.tiktok_connected && !user.instagram_connected);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterProvider, filterConnected]);

  useEffect(() => {
    fetchUsers();
    getDefaultCredits();
  }, []);

  return {
    users: filteredUsers,
    loading,
    stats,
    searchTerm,
    setSearchTerm,
    filterProvider,
    setFilterProvider,
    filterConnected,
    setFilterConnected,
    deleteUser,
    updateUserCredits,
    bulkCreditReset,
    refreshUsers: fetchUsers,
    defaultCredits,
    getDefaultCredits,
    updateDefaultCredits
  };
}; 