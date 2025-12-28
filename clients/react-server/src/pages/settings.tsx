import { JSX, useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Save } from 'lucide-react';
import MainLayout from '@/layouts/main';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import PxBorder from '@/components/px-border';

// Validation schemas
const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
});

const accountSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    },
  );

type ProfileFormData = z.infer<typeof profileSchema>;
type AccountFormData = z.infer<typeof accountSchema>;

/**
 * Settings page component with multiple sections for user preferences and account management.
 *
 * @returns {JSX.Element} The settings page
 */
const Settings = (): JSX.Element => {
  const { userProfile, refreshProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.display_name || '',
      description: userProfile?.description || '',
      avatarUrl: userProfile?.avatar_url || '',
      bannerUrl: userProfile?.banner_url || '',
    },
  });

  // Account form
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: userProfile?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update account form when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      accountForm.reset({
        email: userProfile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [userProfile?.email]);

  /**
   * Handles profile form submission.
   *
   * @param data - The profile form data
   */
  const onProfileSubmit = async (data: ProfileFormData): Promise<void> => {
    if (!userProfile) return;
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: data.displayName,
          avatar_url: data.avatarUrl || null,
          description: data.description || null,
          banner_url: data.bannerUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);
      if (error) throw error;
      await refreshProfile();
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles account form submission.
   *
   * @param data - The account form data
   */
  const onAccountSubmit = async (data: AccountFormData): Promise<void> => {
    if (!user) {
      setErrorMessage('You must be logged in to update your account.');
      return;
    }
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // Update email if changed
      if (data.email && data.email !== userProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (data.newPassword && data.currentPassword) {
        // First verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email || '',
          password: data.currentPassword,
        });
        if (signInError) {
          accountForm.setError('currentPassword', {
            message: 'Current password is incorrect',
          });
          throw signInError;
        }

        // If current password is correct, update to new password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword,
        });
        if (passwordError) throw passwordError;
      }

      setSuccessMessage('Account updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      accountForm.reset({
        email: userProfile?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating account:', error);
      setErrorMessage(error?.message || 'Failed to update account. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles account deletion.
   */
  const handleDeleteAccount = async (): Promise<void> => {
    if (!userProfile || !user) {
      setErrorMessage('You must be logged in to delete your account.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Delete user data from database (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userProfile.id);
      if (deleteError) throw deleteError;

      // Sign out and redirect to login
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrorMessage(error?.message || 'Failed to delete account. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-[50px] px-[100px]">
        <h1 className="mb-10 text-5xl">Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            {/* <TabsTrigger value="preferences">Preferences</TabsTrigger> */}
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-secondary-primary relative p-6">
              <PxBorder width={3} radius="lg" />
              <h2 className="mb-6 text-2xl font-bold">Profile Settings</h2>
              {successMessage && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-green-800">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800">
                  {errorMessage}
                </div>
              )}
              <Form {...profileForm}>
                <form
                  onSubmit={(e) => void profileForm.handleSubmit(onProfileSubmit)(e)}
                  className="space-y-6"
                >
                  {/* <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Banner Image</h3>
                      <p className="text-sm text-gray-600">
                        Upload a banner image for your profile
                      </p>
                    </div>
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                      {user?.bannerUrl ? (
                        <img
                          src={user.bannerUrl}
                          alt="Banner preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <p className="text-sm text-gray-500">No banner image</p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      shadow={false}
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      Upload Banner
                    </Button>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && userProfile) {
                          setIsLoading(true);
                          setErrorMessage(null);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
                            const filePath = `banners/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                              .from('banners')
                              .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: true,
                              });

                            if (uploadError) throw uploadError;

                            const { data: urlData } = supabase.storage.from('banners').getPublicUrl(filePath);
                            const bannerUrl = urlData.publicUrl;

                            profileForm.setValue('bannerUrl', bannerUrl);
                            setSuccessMessage('Banner uploaded successfully!');
                            setTimeout(() => setSuccessMessage(null), 3000);
                          } catch (error: any) {
                            console.error('Error uploading banner:', error);
                            setErrorMessage(error?.message || 'Failed to upload banner. Please try again.');
                            setTimeout(() => setErrorMessage(null), 5000);
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }}
                    />
                  </div> */}

                  {/* Avatar Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Profile Picture</h3>
                    </div>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={userProfile?.avatar_url || undefined}
                          alt={userProfile?.display_name || undefined}
                        />
                        <AvatarFallback>{userProfile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      shadow={false}
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      Upload Avatar
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && userProfile) {
                          setIsLoading(true);
                          setErrorMessage(null);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
                            const filePath = `avatars/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                              .from('avatars')
                              .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: true,
                              });

                            if (uploadError) throw uploadError;

                            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                            const avatarUrl = urlData.publicUrl;

                            // Update form with new avatar URL
                            profileForm.setValue('avatarUrl', avatarUrl);
                            setSuccessMessage('Avatar uploaded successfully!');
                            setTimeout(() => setSuccessMessage(null), 3000);
                          } catch (error: any) {
                            console.error('Error uploading avatar:', error);
                            setErrorMessage(error?.message || 'Failed to upload avatar. Please try again.');
                            setTimeout(() => setErrorMessage(null), 5000);
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem className="max-w-[400px]">
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your display name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="max-w-[400px]">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Tell us about yourself..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    containerClassName="w-full max-w-[400px]"
                  >
                    {isLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <div className="bg-secondary-primary relative p-6">
              <PxBorder width={3} radius="lg" />
              <h2 className="mb-6 text-2xl font-bold">Account Settings</h2>
              {successMessage && (
                <div className="mb-4 rounded-md bg-green-50 p-3 text-green-800">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-red-800">
                  {errorMessage}
                </div>
              )}
              <Form {...accountForm}>
                <form
                  onSubmit={(e) => void accountForm.handleSubmit(onAccountSubmit)(e)}
                  className="space-y-6"
                >
                  <FormField
                    control={accountForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="max-w-[400px]">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Change Password</h3>
                    <FormField
                      control={accountForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="max-w-[400px]">
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter current password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="max-w-[400px]">
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="max-w-[400px]">
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    containerClassName="w-full max-w-[400px]"
                  >
                    {isLoading ? 'Updating...' : 'Update Account'}
                    <Save className="ml-2 size-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* <TabsContent value="preferences" className="space-y-6">
            <div className="bg-secondary-primary relative p-6">
              <PxBorder width={3} radius="lg" />
              <h2 className="mb-6 text-2xl font-bold">Preferences</h2>
              <Form {...preferencesForm}>
                <form
                  onSubmit={(e) => void preferencesForm.handleSubmit(onPreferencesSubmit)(e)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <FormField
                      control={preferencesForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <div className="text-muted-foreground text-sm">
                              Receive email notifications for important updates
                            </div>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Push Notifications</FormLabel>
                            <div className="text-muted-foreground text-sm">
                              Receive push notifications in your browser
                            </div>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Marketing Emails</FormLabel>
                            <div className="text-muted-foreground text-sm">
                              Receive promotional emails and updates
                            </div>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Privacy</h3>
                    <FormField
                      control={preferencesForm.control}
                      name="profileVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Visibility</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2"
                              {...field}
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="showEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Email</FormLabel>
                            <div className="text-muted-foreground text-sm">
                              Display your email address on your profile
                            </div>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                    <Save className="ml-2 size-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent> */}

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6">
            <div className="bg-secondary-primary relative p-6">
              <PxBorder width={3} radius="lg" />
              <h2 className="mb-5 text-2xl">Danger Zone</h2>
              <div className="space-y-6">
                <h3 className="mb-2 text-lg">Delete Account</h3>
                <p className="mb-4 text-sm">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" containerClassName="w-max">
                      Delete Account
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-left">
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        This action cannot be undone. This will permanently delete your account and
                        remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex items-center">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button shadow={false} variant="destructive" onClick={handleDeleteAccount}>
                        Yes, delete my account
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
