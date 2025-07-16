import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Shield, Users, BarChart3, Settings, Database } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';

const AdminDashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    console.log('🏛️ AdminDashboard: State changed', { 
      loading, 
      userId: user?.id, 
      role,
      userExists: !!user 
    });
    
    // Wait for both auth loading to complete AND role to be determined
    if (!loading && user) {
      // If role is explicitly set to something other than admin, redirect
      if (role !== null && role !== 'admin') {
        console.log('🚫 AdminDashboard: Non-admin user, redirecting to user dashboard');
        navigate('/user-dashboard', { replace: true });
      } else if (role === 'admin') {
        console.log('✅ AdminDashboard: Admin user confirmed, showing dashboard');
      }
    }
    // If no user and not loading, redirect to home
    if (!loading && !user) {
      console.log('🚫 AdminDashboard: No user, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, role, loading, navigate]);

  // Show loading state if:
  // 1. Auth is still loading, OR
  // 2. No user, OR  
  // 3. User exists but role is still null (being fetched), OR
  // 4. User exists and role is determined but not admin
  if (loading || !user || role === null || (role !== null && role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-vibrant-purple" />
              <div>
                <h1 className="text-2xl font-bold text-deep-blue dark:text-white">
                  ThinkPost Admin
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Administrative Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-deep-blue dark:text-white">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:grid-cols-5 bg-white/50 dark:bg-gray-800/50">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg border p-8 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Platform analytics and insights coming soon...
              </p>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg border p-8 text-center">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Content moderation and AI management tools coming soon...
              </p>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg border p-8 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Integration Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Social media platform and API management coming soon...
              </p>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg border p-8 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">System Health</h3>
              <p className="text-gray-600 dark:text-gray-400">
                System monitoring and health checks coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard; 