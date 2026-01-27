'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  UserCircle,
  BellRing,
  Bell,
  Mail,
  ShieldAlert,
  KeyRound,
  LogOut,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // User profile states
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // TODO: Implement API call to backend for profile update
      console.log('Profile update will be sent to backend API:', {
        fullName,
        bio,
        company,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });

      setProfileSaved(true);

      // Reset the saved indicator after 3 seconds
      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // TODO: Implement API call to backend for notification settings
      console.log('Notification settings will be sent to backend API:', {
        emailNotifications,
        marketingEmails,
        productUpdates,
      });

      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Implement API call to backend for password change
      console.log('Password change will be sent to backend API');

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
    );

    if (!confirmDelete) return;

    try {
      setIsLoading(true);

      // TODO: Implement API call to backend for account deletion
      console.log('Account deletion request will be sent to backend API');

      toast({
        title: 'Account Deletion Request Sent',
        description:
          'We have received your request to delete your account. Our team will process it shortly.',
      });

      // Redirect to homepage after a short delay
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </motion.div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 gap-2">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <BellRing className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden md:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about your account via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and offers
                    </p>
                  </div>
                  <Switch
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new features and improvements
                    </p>
                  </div>
                  <Switch
                    checked={productUpdates}
                    onCheckedChange={setProductUpdates}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleUpdateNotifications}
                  disabled={isLoading}
                >
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Account ID</Label>
                  <div className="bg-muted p-2 rounded-md text-sm font-mono truncate">
                    {user?.id || 'Not available'}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Username</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.username || 'Not available'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email || 'Not available'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{user?.role || 'Not available'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Account Created</Label>
                  <div className="text-sm">
                    {user?.createdAt &&
                      `${new Date(user.createdAt).toLocaleDateString()}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Log out from all devices</h4>
                  <p className="text-sm text-muted-foreground">
                    This will sign you out from all devices where you're
                    currently logged in.
                  </p>
                  <Button variant="outline" className="mt-2" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out everywhere
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">
                    Delete Account
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all of your data. This
                    action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    className="mt-2"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
