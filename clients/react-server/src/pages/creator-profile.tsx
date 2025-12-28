import { JSX, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Heart, Users, DollarSign, Star, Crown, Mail, Globe, Twitter, Instagram, Youtube, ArrowLeft, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { PostResponse } from '@/contexts/AppDataContext';
import MainLayout from '@/layouts/main';
import PxBorder from '@/components/px-border';
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

interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_channel: string | null;
  total_earnings: number;
  supporters_count: number;
  followers_count: number;
  posts_count: number;
  likes_count: number;
}

interface CreatorUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  description: string | null;
  role: 'user' | 'creator' | 'admin';
  is_verified: boolean;
}

interface CreatorPost extends PostResponse {
  creator?: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
}

/**
 * Creator Profile Page - View a creator's profile, stats, and posts
 */
export const CreatorProfilePage = (): JSX.Element => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [creatorUser, setCreatorUser] = useState<CreatorUser | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportAmount, setSupportAmount] = useState('100');
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  // Check if viewing own profile
  const isOwnProfile = user?.id === creatorId;

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!creatorId) return;

      setIsLoading(true);
      try {
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .single();

        if (userError) throw userError;
        setCreatorUser(userData as CreatorUser);

        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', creatorId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine if user is not a creator
          console.warn('Creator profile not found:', profileError);
        } else if (profileData) {
          setCreatorProfile(profileData as CreatorProfile);
        }

        // Fetch creator's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', creatorId)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) throw postsError;

        // Transform posts with creator info
        const postsWithCreator: CreatorPost[] = (postsData || []).map((post) => ({
          ...post,
          creator: userData
            ? {
                id: userData.id,
                display_name: userData.display_name,
                photo_url: userData.avatar_url,
              }
            : undefined,
        }));

        setPosts(postsWithCreator);

        // Check if current user is following this creator
        if (user?.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', creatorId)
            .single();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorId, user?.id]);

  const handleFollow = async () => {
    if (!user || !creatorId) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId);

        if (error) throw error;
        setIsFollowing(false);
        if (creatorProfile) {
          setCreatorProfile({
            ...creatorProfile,
            followers_count: Math.max(0, creatorProfile.followers_count - 1),
          });
        }
      } else {
        // Follow
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: creatorId,
        });

        if (error) throw error;
        setIsFollowing(true);
        if (creatorProfile) {
          setCreatorProfile({
            ...creatorProfile,
            followers_count: creatorProfile.followers_count + 1,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleSupport = async () => {
    if (!user || !creatorId || !supportAmount) return;

    setIsSupporting(true);
    try {
      const amount = parseFloat(supportAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Create a supporter transaction
      const { error } = await supabase.from('supporter_transactions').insert({
        supporter_id: user.id,
        creator_id: creatorId,
        amount: amount,
        message: supportMessage || null,
        status: 'pending', // In a real app, this would be 'completed' after payment processing
        gateway: 'bank_transfer', // Default, can be changed based on payment method
      });

      if (error) throw error;

      // Update creator's total earnings (this would typically be done via a trigger)
      if (creatorProfile) {
        setCreatorProfile({
          ...creatorProfile,
          total_earnings: creatorProfile.total_earnings + amount,
          supporters_count: creatorProfile.supporters_count + 1,
        });
      }

      setShowSupportDialog(false);
      setSupportMessage('');
      setSupportAmount('100');
      // TODO: Show success toast
      alert(`Support of NPR ${amount.toLocaleString()} sent successfully!`);
    } catch (error) {
      console.error('Error supporting creator:', error);
      alert('Failed to send support. Please try again.');
    } finally {
      setIsSupporting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
            <p className="mt-4 text-gray-600">Loading creator profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!creatorUser) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Creator not found</h2>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const bio = creatorProfile?.bio || creatorUser.description || 'No bio available';
  const isCreator = creatorUser.role === 'creator' || creatorUser.role === 'admin';

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header with Back Button */}
        <div className="border-b bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="relative">
          {/* Banner */}
          <div className="h-64 w-full bg-gradient-to-r from-blue-500 to-purple-600">
            {creatorUser.banner_url && (
              <img
                src={creatorUser.banner_url}
                alt="Banner"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-20 flex flex-col md:flex-row md:justify-between gap-6 pb-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  <div className="relative h-32 w-32 rounded-full border-4 border-white bg-white dark:border-gray-900 dark:bg-gray-900">
                    {creatorUser.avatar_url ? (
                      <img
                        src={creatorUser.avatar_url}
                        alt={creatorUser.display_name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
                        {creatorUser.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  {isCreator && (
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-yellow-400 p-1">
                      <Crown className="h-5 w-5 text-yellow-800" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorUser.display_name}
                    </h1>
                    {creatorUser.is_verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{bio}</p>
                  {creatorProfile?.category && (
                    <Badge variant="outline" className="w-fit">
                      {creatorProfile.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 md:pt-0">
                {!isOwnProfile && (
                  <>
                    <Button
                      variant={isFollowing ? 'secondary' : 'default'}
                      onClick={handleFollow}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    {isCreator && (
                      <Button
                        onClick={() => setShowSupportDialog(true)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Support
                      </Button>
                    )}
                  </>
                )}
                {isOwnProfile && (
                  <Button onClick={() => navigate('/dashboard/creator')} variant="outline">
                    <Crown className="h-4 w-4 mr-2" />
                    Creator Dashboard
                  </Button>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(creatorProfile?.website_url ||
              creatorProfile?.twitter_handle ||
              creatorProfile?.instagram_handle ||
              creatorProfile?.youtube_channel) && (
              <div className="mb-6 flex items-center gap-4">
                {creatorProfile?.website_url && (
                  <a
                    href={creatorProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {creatorProfile?.twitter_handle && (
                  <a
                    href={`https://twitter.com/${creatorProfile.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-500 dark:text-gray-400"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {creatorProfile?.instagram_handle && (
                  <a
                    href={`https://instagram.com/${creatorProfile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-pink-500 dark:text-gray-400"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {creatorProfile?.youtube_channel && (
                  <a
                    href={`https://youtube.com/${creatorProfile.youtube_channel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-red-500 dark:text-gray-400"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats and Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Sidebar - Stats */}
            <div className="lg:col-span-1">
              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Stats</h3>
                <div className="space-y-4">
                  {creatorProfile && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Posts</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {creatorProfile.posts_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Followers</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {creatorProfile.followers_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Supporters</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {creatorProfile.supporters_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Earnings</span>
                        <span className="font-semibold text-green-600">
                          NPR {creatorProfile.total_earnings?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Likes</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {creatorProfile.likes_count || 0}
                        </span>
                      </div>
                    </>
                  )}
                  {!creatorProfile && (
                    <p className="text-sm text-gray-500">No creator stats available</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Main Content - Posts */}
            <div className="lg:col-span-2">
              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
                  Posts ({posts.length})
                </h3>
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} onPostClick={(id) => navigate(`/post/${id}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No posts yet.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Support Dialog */}
      <AlertDialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Support {creatorUser.display_name}</AlertDialogTitle>
            <AlertDialogDescription>
              Show your appreciation by supporting this creator. Your support helps them continue creating great content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (NPR)
              </label>
              <Input
                type="number"
                min="1"
                value={supportAmount}
                onChange={(e) => setSupportAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (Optional)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                rows={3}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Leave a message for the creator..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSupporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSupport}
              disabled={isSupporting || !supportAmount || parseFloat(supportAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSupporting ? 'Processing...' : `Support NPR ${parseFloat(supportAmount || '0').toLocaleString()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default CreatorProfilePage;

