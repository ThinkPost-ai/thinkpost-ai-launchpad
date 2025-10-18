import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminUserManagement, AdminUser } from '@/hooks/useAdminUserManagement';
import { 
  Users, 
  UserPlus, 
  Activity, 
  CreditCard, 
  Search, 
  Filter,
  Trash2,
  Edit,
  RefreshCw,
  Download
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

const UserManagement = () => {
  const {
    users,
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
    refreshUsers,
    defaultCredits,
    updateDefaultCredits
  } = useAdminUserManagement();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editCreditsDialogOpen, setEditCreditsDialogOpen] = useState(false);
  const [newCreditsAmount, setNewCreditsAmount] = useState<string>('');
  const [bulkResetDialogOpen, setBulkResetDialogOpen] = useState(false);
  const [bulkResetAmount, setBulkResetAmount] = useState<string>('30');
  const [defaultCreditsDialogOpen, setDefaultCreditsDialogOpen] = useState(false);
  const [newDefaultCredits, setNewDefaultCredits] = useState<string>('');

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleEditCredits = (user: AdminUser) => {
    setSelectedUser(user);
    setNewCreditsAmount((user.caption_credits).toString());
    setEditCreditsDialogOpen(true);
  };

  const confirmEditCredits = async () => {
    if (selectedUser && newCreditsAmount) {
      const credits = parseInt(newCreditsAmount);
      if (!isNaN(credits)) {
        await updateUserCredits(selectedUser.id, credits);
        setEditCreditsDialogOpen(false);
        setSelectedUser(null);
        setNewCreditsAmount('');
      }
    }
  };

  const handleBulkReset = async () => {
    const credits = parseInt(bulkResetAmount);
    if (!isNaN(credits)) {
      await bulkCreditReset(credits);
      setBulkResetDialogOpen(false);
    }
  };

  const handleDefaultCreditsDialog = () => {
    setNewDefaultCredits(defaultCredits.toString());
    setDefaultCreditsDialogOpen(true);
  };

  const handleUpdateDefaultCredits = async () => {
    const credits = parseInt(newDefaultCredits);
    if (!isNaN(credits)) {
      await updateDefaultCredits(credits);
      setDefaultCreditsDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Restaurant', 'Category', 'Credits', 'Uploads', 'Captions', 'Scheduled', 'Posted', 'TikTok', 'Instagram', 'Created'].join(','),
      ...users.map(user => [
        user.full_name || 'N/A',
        user.email || 'N/A',
        user.phone_number || 'N/A',
        user.restaurant_name || 'N/A',
        user.category || 'N/A',
        user.caption_credits,
        user.total_uploads,
        user.captions_generated,
        user.scheduled_posts_count,
        user.posted_count,
        user.tiktok_connected ? 'Yes' : 'No',
        user.instagram_connected ? 'Yes' : 'No',
        formatDate(user.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Signups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySignups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCredits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, restaurant, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filters */}
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Auth Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterConnected} onValueChange={setFilterConnected}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Connection Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="not_connected">Not Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={refreshUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportUsers} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleDefaultCreditsDialog} 
              variant="outline" 
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Default Credits ({defaultCredits})
            </Button>
            <Button 
              onClick={() => setBulkResetDialogOpen(true)} 
              variant="outline" 
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Bulk Reset Credits
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Uploads</TableHead>
                  <TableHead>Captions</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Connections</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-sm text-muted-foreground">{user.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.phone_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.restaurant_name || 'No Restaurant'}</div>
                          {user.category && (
                            <Badge variant="secondary" className="text-xs">
                              {user.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {user.caption_credits}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {user.total_uploads}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {user.captions_generated}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {user.scheduled_posts_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {user.posted_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.tiktok_connected && (
                            <Badge variant="default" className="text-xs">TT</Badge>
                          )}
                          {user.instagram_connected && (
                            <Badge variant="default" className="text-xs">IG</Badge>
                          )}
                          {!user.tiktok_connected && !user.instagram_connected && (
                            <Badge variant="outline" className="text-xs">None</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCredits(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{selectedUser?.full_name || selectedUser?.id}"? 
              This will permanently remove all their data including restaurants, products, images, and scheduled posts. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Credits Dialog */}
      <Dialog open={editCreditsDialogOpen} onOpenChange={setEditCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Credits</DialogTitle>
            <DialogDescription>
              Update credits for "{selectedUser?.full_name || selectedUser?.id}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Enter new credit amount"
              value={newCreditsAmount}
              onChange={(e) => setNewCreditsAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCreditsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEditCredits}>
              Update Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Credit Reset Dialog */}
      <Dialog open={bulkResetDialogOpen} onOpenChange={setBulkResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Credit Reset</DialogTitle>
            <DialogDescription>
              Reset all users' credits to a specific amount. This will update all {stats.totalUsers} users.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Enter credit amount"
              value={bulkResetAmount}
              onChange={(e) => setBulkResetAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkReset}>
              Reset All Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Default Credits Dialog */}
      <Dialog open={defaultCreditsDialogOpen} onOpenChange={setDefaultCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Default Credits</DialogTitle>
            <DialogDescription>
              Set the default number of credits that new users will receive when they sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Enter default credit amount"
              value={newDefaultCredits}
              onChange={(e) => setNewDefaultCredits(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDefaultCreditsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDefaultCredits}>
              Update Default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;