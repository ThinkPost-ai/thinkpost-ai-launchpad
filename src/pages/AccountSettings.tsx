import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Lock, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

const AccountSettings = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: t('accountSettings.emailUpdateRequested'),
        description: t('accountSettings.emailUpdateDescription'),
      });
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: t('accountSettings.error'),
        description: error.message || t('accountSettings.failedToUpdateEmail'),
        variant: "destructive"
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('accountSettings.error'),
        description: t('accountSettings.passwordsDoNotMatch'),
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('accountSettings.error'),
        description: t('accountSettings.passwordTooShort'),
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t('accountSettings.success'),
        description: t('accountSettings.passwordUpdated'),
      });
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: t('accountSettings.error'),
        description: error.message || t('accountSettings.failedToUpdatePassword'),
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Error",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    console.log('Starting account deletion process...');

    try {
      if (!user) {
        toast({
          title: "Error",
          description: "No user found",
          variant: "destructive"
        });
        return;
      }

      console.log('User ID to delete:', user.id);

      // Delete storage files first (before deleting user data)
      console.log('Deleting storage files...');
      try {
        // List and delete files from user's folder in different buckets
        const buckets = ['user-uploads', 'product-images', 'user-avatars', 'videos'];
        
        for (const bucketName of buckets) {
          try {
            const { data: files } = await supabase.storage
              .from(bucketName)
              .list(user.id);
            
            if (files && files.length > 0) {
              const filePaths = files.map(file => `${user.id}/${file.name}`);
              const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove(filePaths);
              
              if (deleteError) {
                console.error(`Error deleting files from ${bucketName}:`, deleteError);
              } else {
                console.log(`Successfully deleted ${files.length} files from ${bucketName}`);
              }
            }
          } catch (bucketError) {
            console.error(`Error accessing bucket ${bucketName}:`, bucketError);
          }
        }
      } catch (storageError) {
        console.error('Error deleting storage files:', storageError);
      }

      // Call the database function to delete user and all associated data
      console.log('Calling database function to delete user and data...');
      const { error: deleteError } = await supabase.rpc('delete_user_and_data', {
        user_id_to_delete: user.id
      });

      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        toast({
          title: "Error",
          description: "Failed to delete account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('Account deletion completed successfully');
      
      // Show success message immediately
      toast({
        title: "Success",
        description: "Account deleted successfully"
      });
      
      // Create a function to handle the redirect with timeout
      const handleRedirect = () => {
        console.log('Redirecting to home page...');
        navigate('/', { replace: true });
        
        // Additional cleanup - clear any local storage items
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token');
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing storage:', e);
        }
      };
      
      // Try to sign out, but don't wait too long
      try {
        console.log('Clearing session data...');
        
        // Set a timeout to ensure redirect happens
        const redirectTimeout = setTimeout(handleRedirect, 2000);
        
        // Try to sign out
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
        ]);
        
        // Clear the timeout if sign out was successful
        clearTimeout(redirectTimeout);
        
        // Call the signOut function from context
        await signOut();
        
        // Redirect immediately after successful sign out
        handleRedirect();
        
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
        // Still redirect even if sign out fails
        handleRedirect();
      }
      
    } catch (error) {
      console.error('Unexpected error during account deletion:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-4 px-4 sm:py-8 sm:px-6 lg:py-12">
      <div className="container mx-auto max-w-sm sm:max-w-md lg:max-w-2xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-3 sm:mb-4 text-deep-blue dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-10 sm:h-auto px-3 sm:px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">{t('accountSettings.back')}</span>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-deep-blue dark:text-white leading-tight">
            {t('accountSettings.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
            {t('accountSettings.description')}
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Current Account Info */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-deep-blue dark:text-white text-lg sm:text-xl">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('accountSettings.currentAccount')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('accountSettings.emailAddress')}</Label>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-all">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Update Email */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-deep-blue dark:text-white text-lg sm:text-xl">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('accountSettings.changeEmail')}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {t('accountSettings.changeEmailDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-sm font-medium">
                    {t('accountSettings.newEmailAddress')}
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t('accountSettings.enterNewEmail')}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail}
                  className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 h-11 sm:h-10 text-base sm:text-sm font-medium"
                >
                  {isUpdatingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('accountSettings.updating')}
                    </>
                  ) : (
                    t('accountSettings.updateEmail')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Update Password */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-deep-blue dark:text-white text-lg sm:text-xl">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('accountSettings.changePassword')}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {t('accountSettings.changePasswordDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    {t('accountSettings.newPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('accountSettings.enterNewPassword')}
                      className="h-11 sm:h-10 text-base sm:text-sm pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    {t('accountSettings.confirmNewPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('accountSettings.confirmNewPasswordPlaceholder')}
                      className="h-11 sm:h-10 text-base sm:text-sm pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                  className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 h-11 sm:h-10 text-base sm:text-sm font-medium"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('accountSettings.updating')}
                    </>
                  ) : (
                    t('accountSettings.updatePassword')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-red-600 dark:text-red-400 text-lg sm:text-xl">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('accountSettings.dangerZone')}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {t('accountSettings.dangerZoneDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-11 sm:h-10 text-base sm:text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('accountSettings.deleteAccount')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 sm:mx-0 max-w-sm sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg sm:text-xl">
                      {t('accountSettings.deleteConfirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm sm:text-base leading-relaxed">
                      {t('accountSettings.deleteConfirmDescription')}
                      <br /><br />
                      <strong>{t('accountSettings.deleteConfirmInstructions')}</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={t('accountSettings.deleteConfirmPlaceholder')}
                      className="border-red-300 focus:border-red-500 h-11 sm:h-10 text-base sm:text-sm"
                    />
                  </div>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel 
                      onClick={() => setDeleteConfirmation('')}
                      className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm order-2 sm:order-1"
                    >
                      {t('accountSettings.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-11 sm:h-10 text-base sm:text-sm font-medium order-1 sm:order-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('accountSettings.deleting')}
                        </>
                      ) : (
                        t('accountSettings.deleteAccount')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 