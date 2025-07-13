import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      setLoading(true);
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (!error) {
        setUserCount(count ?? 0);
      }
      setLoading(false);
    };
    fetchUserCount();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Dashboard</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="text-lg text-center">Total Users: <span className="font-semibold">{userCount}</span></div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 