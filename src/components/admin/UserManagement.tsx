import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Eye, UserCheck, UserX, Trash2, Plus, Minus, Calendar, ShoppingBag, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
  id: string;
  full_name: string | null;
  email: string;
  caption_credits: number;
  remaining_credits: number;
  tiktok_connected: boolean;
  instagram_connected: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  restaurant?: {
    name: string;
    category: string;
    location: string;
  };
}

interface CreditAdjustmentProps {
  userId: string;
  currentCredits: number;
  onUpdate: () => void;
}

const CreditAdjustment: React.FC<CreditAdjustmentProps> = ({ userId, currentCredits, onUpdate }) => {
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAdjustCredits = async (action: 'add' | 'subtract') => {
    if (amount <= 0) return;
    
    setIsLoading(true);
    try {
      const newCredits = action === 'add' ? currentCredits + amount : Math.max(0, currentCredits - amount);
      
      const { error } = await supabase
        .from('profiles')
        .update({ remaining_credits: newCredits })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: t('admin.creditsUpdated'),
        description: t('admin.creditsUpdatedDescription'),
      });
      
      onUpdate();
      setAmount(0);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast({
        title: t('common.error'),
        description: t('admin.creditUpdateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          placeholder={t('admin.enterAmount')}
          min="0"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => handleAdjustCredits('add')}
          disabled={isLoading || amount <= 0}
          size="sm"
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('admin.addCredits')}
        </Button>
        <Button
          onClick={() => handleAdjustCredits('subtract')}
          disabled={isLoading || amount <= 0}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          <Minus className="w-4 h-4 mr-1" />
          {t('admin.subtractCredits')}
        </Button>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get user data from profiles 
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          caption_credits,
          remaining_credits,
          tiktok_connected,
          instagram_connected,
          role,
          updated_at
        `);

      if (profilesError) throw profilesError;

      // Get restaurant data
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('owner_id, name, category, location');

      if (restaurantsError) throw restaurantsError;

      // For now, we'll use profile data and simulate email from the profile ID
      // In a real admin setup, you'd need server-side access to auth.users
      const combinedUsers: UserData[] = profiles.map(profile => {
        const restaurant = restaurants?.find(r => r.owner_id === profile.id);
        
        return {
          ...profile,
          email: `user-${profile.id.substring(0, 8)}@thinkpost.app`, // Placeholder email
          created_at: profile.updated_at || new Date().toISOString(),
          last_sign_in_at: profile.updated_at || null,
          restaurant: restaurant ? {
            name: restaurant.name,
            category: restaurant.category,
            location: restaurant.location
          } : undefined
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t('common.error'),
        description: t('admin.fetchUsersFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Call the delete_user_and_data function
      const { error } = await supabase.rpc('delete_user_and_data', {
        user_id_to_delete: userId
      });

      if (error) throw error;

      toast({
        title: t('admin.userDeleted'),
        description: t('admin.userDeletedDescription'),
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t('common.error'),
        description: t('admin.userDeleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {t('admin.userManagement')}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('admin.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-semibold">{user.full_name || t('common.unnamed')}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  {user.restaurant && (
                    <div className="text-sm">
                      <span className="font-medium">{t('admin.brand')}: </span>
                      {user.restaurant.name} ({user.restaurant.category})
                    </div>
                  )}
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t('admin.credits')}: </span>
                  {user.caption_credits + user.remaining_credits}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('admin.social')}: </span>
                  {user.tiktok_connected && <Badge variant="outline">TikTok</Badge>}
                  {user.instagram_connected && <Badge variant="outline">Instagram</Badge>}
                </div>
                <div>
                  <span className="font-medium">{t('admin.joined')}: </span>
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </div>
                <div>
                  <span className="font-medium">{t('admin.lastLogin')}: </span>
                  {user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : t('admin.never')}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      {t('admin.viewProfile')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('admin.userProfile')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div><strong>{t('common.name')}: </strong>{user.full_name}</div>
                      <div><strong>{t('common.email')}: </strong>{user.email}</div>
                      <div><strong>{t('admin.role')}: </strong>{user.role}</div>
                      <div><strong>{t('admin.totalCredits')}: </strong>{user.caption_credits + user.remaining_credits}</div>
                      {user.restaurant && (
                        <div>
                          <strong>{t('admin.brandInfo')}: </strong>
                          <div className="mt-2 p-3 bg-muted rounded">
                            <div>{t('common.name')}: {user.restaurant.name}</div>
                            <div>{t('admin.category')}: {user.restaurant.category}</div>
                            <div>{t('admin.location')}: {user.restaurant.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('admin.adjustCredits')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('admin.adjustCredits')}</DialogTitle>
                    </DialogHeader>
                    <CreditAdjustment
                      userId={user.id}
                      currentCredits={user.caption_credits + user.remaining_credits}
                      onUpdate={fetchUsers}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('admin.deleteUser')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('admin.confirmDelete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('admin.deleteUserConfirmation')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noUsersFound')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;