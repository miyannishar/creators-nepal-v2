import { JSX, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Heart, Users, DollarSign, Star, Search, Filter, TrendingUp, Crown, Settings, User, Compass, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { PostResponse } from '@/contexts/AppDataContext';
import MainLayout from '@/layouts/main';
import PxBorder from '@/components/px-border';

interface FeedPost extends PostResponse {
  creator?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    email?: string;
  };
}

/**
 * Supporter Dashboard - Main dashboard showing feed, discover, search, and profile panels
 */
export const FeedDashboard = (): JSX.Element => {
  const { user, userProfile, creatorProfile, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePanel = searchParams.get('panel') || 'feed';
  
  // If no panel is specified, default to feed
  useEffect(() => {
    if (!searchParams.get('panel')) {
      setSearchParams({ panel: 'feed' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCreators, setSearchCreators] = useState<any[]>([]);
  const [searchCreatorsLoading, setSearchCreatorsLoading] = useState(false);
  const [followingCreators, setFollowingCreators] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSupported: 0,
    creatorsSupported: 0,
    thisMonth: 0,
    favoriteCreators: 0,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch feed posts
  useEffect(() => {
    const fetchFeedPosts = async () => {
      if (!isAuthenticated) {
        console.log('[FeedDashboard] Not authenticated, skipping post fetch');
        return;
      }

      console.log('[FeedDashboard] Fetching feed posts...');
      setPostsLoading(true);
      try {
        // Fetch all published posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (postsError) {
          console.error('[FeedDashboard] Error fetching posts:', postsError);
          throw postsError;
        }

        console.log('[FeedDashboard] Posts fetched:', {
          count: postsData?.length || 0,
          posts: postsData?.map(p => ({ id: p.id, title: p.title, is_published: p.is_published }))
        });

        if (!postsData || postsData.length === 0) {
          console.log('[FeedDashboard] No posts found');
          setPosts([]);
          setPostsLoading(false);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(postsData.map((p) => p.user_id))];

        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, email')
          .in('id', userIds);

        // Create lookup map
        const usersMap = new Map((usersData || []).map((u) => [u.id, u]));

        // Transform the data
            const transformedPosts: FeedPost[] = postsData.map((post) => ({
              ...post,
              creator: usersMap.get(post.user_id)
                ? {
                    id: usersMap.get(post.user_id)!.id,
                    display_name: usersMap.get(post.user_id)!.display_name,
                    avatar_url: usersMap.get(post.user_id)!.avatar_url,
                    email: usersMap.get(post.user_id)!.email,
                  }
                : undefined,
            }));

        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching feed posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchFeedPosts();
  }, [isAuthenticated]);

  // Fetch following creators and stats
  useEffect(() => {
    const fetchFollowingAndStats = async () => {
      if (!user || !isAuthenticated) return;

      try {
        // Fetch following creators
        const { data: follows } = await supabase
          .from('follows')
          .select(
            `
            following_id,
            creator_profiles!follows_following_id_fkey(
              *,
              users!inner(id, display_name, photo_url)
            )
          `
          )
          .eq('follower_id', user.id);

        if (follows) {
          const creators = follows.map((f: any) => ({
            id: f.creator_profiles?.user_id || f.following_id,
            name: f.creator_profiles?.users?.display_name || 'Unknown',
            category: f.creator_profiles?.category || 'Creator',
            avatar: f.creator_profiles?.users?.photo_url,
            supporters: f.creator_profiles?.followers_count || 0,
            isVerified: f.creator_profiles?.is_verified || false,
            posts_count: f.creator_profiles?.posts_count || 0,
          }));
          setFollowingCreators(creators);
          setStats((prev) => ({
            ...prev,
            creatorsSupported: creators.length,
            favoriteCreators: creators.length,
          }));
        }

        // Fetch support stats
        let transactions: any[] | null = null;
        try {
          const { data, error } = await supabase
            .from('supporter_transactions')
            .select('amount, created_at')
            .eq('supporter_id', user.id)
            .eq('status', 'completed');
          
          if (!error) {
            transactions = data;
          }
        } catch (err) {
          console.log('[FeedDashboard] supporter_transactions table may not exist, skipping stats');
        }

        if (transactions && transactions.length > 0) {
          const totalSupported = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          const thisMonthSupport = transactions
            .filter((t: any) => new Date(t.created_at) >= thisMonth)
            .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

          setStats((prev) => ({
            ...prev,
            totalSupported,
            thisMonth: thisMonthSupport,
          }));
        }
      } catch (error) {
        console.error('Error fetching following and stats:', error);
      }
    };

    fetchFollowingAndStats();
  }, [user, isAuthenticated]);

  // Discover panel now shows posts instead of series

  // Show loading while checking auth
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </MainLayout>
    );
  }

  // If not authenticated after loading, don't render (will redirect)
  if (!isAuthenticated) {
    return <></>;
  }

  // Search for creators when search query changes
  useEffect(() => {
    const searchForCreators = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchCreators([]);
        return;
      }

      setSearchCreatorsLoading(true);
      try {
        const { data: creatorsData, error } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, description, role')
          .or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .in('role', ['creator', 'admin'])
          .limit(10);

        if (error) throw error;
        setSearchCreators(creatorsData || []);
      } catch (error) {
        console.error('Error searching creators:', error);
        setSearchCreators([]);
      } finally {
        setSearchCreatorsLoading(false);
      }
    };

    searchForCreators();
  }, [searchQuery]);

  // Filter posts by search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.creator?.display_name.toLowerCase().includes(query)
    );
  });

  // Render different panels based on activePanel
  const renderPanel = () => {
    switch (activePanel) {
      case 'feed':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Following</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.creatorsSupported}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {stats.thisMonth.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Supported</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {stats.totalSupported.toLocaleString()}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </Card>

              <Card className="p-6 relative">
                <PxBorder width={3} radius="lg" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.favoriteCreators}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </div>

            {/* Posts Feed */}
            <Card className="p-6 relative">
              <PxBorder width={3} radius="lg" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} onPostClick={(id) => navigate(`/post/${id}`)} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'No posts found matching your search.' : 'No posts available yet.'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'discover':
        return (
          <div className="space-y-6">
            <Card className="p-6 relative">
              <PxBorder width={3} radius="lg" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover Posts</h2>
                <Button className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </Button>
              </div>
              
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} onPostClick={(id) => navigate(`/post/${id}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No posts found
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Explore trending posts and find new content to follow
                  </p>
                </div>
              )}
            </Card>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <Card className="p-6 relative">
              <PxBorder width={3} radius="lg" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Search</h2>
              <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search creators and posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <div className="space-y-6">
                  {/* Creators Results */}
                  {searchCreators.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Creators</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchCreators.map((creator) => (
                          <Card
                            key={creator.id}
                            className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                            onClick={() => navigate(`/creator/${creator.id}`)}
                          >
                            <PxBorder width={2} radius="md" />
                            <div className="flex items-center gap-3">
                              {creator.avatar_url ? (
                                <img
                                  src={creator.avatar_url}
                                  alt={creator.display_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {creator.display_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {creator.display_name}
                                </h4>
                                {creator.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {creator.description}
                                  </p>
                                )}
                              </div>
                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Results */}
                  {filteredPosts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Posts</h3>
                      <div className="space-y-4">
                        {filteredPosts.map((post) => (
                          <PostCard key={post.id} post={post} onPostClick={(id) => navigate(`/post/${id}`)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && searchCreators.length === 0 && filteredPosts.length === 0 && !searchCreatorsLoading && (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400">No results found.</p>
                    </div>
                  )}

                  {/* Loading */}
                  {searchCreatorsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                  )}
                </div>
              )}
              {!searchQuery && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Start typing to search for creators and posts.</p>
                </div>
              )}
            </Card>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <Card className="p-6 relative">
              <PxBorder width={3} radius="lg" />
              <div className="flex items-center space-x-4 mb-6">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name || 'Profile'}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userProfile?.display_name || 'User'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{userProfile?.email}</p>
                  {creatorProfile && (
                    <Badge variant="secondary" className="mt-2">
                      Creator
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <Button onClick={() => navigate('/settings')} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                {creatorProfile ? (
                  <Button
                    onClick={() => navigate('/dashboard/creator')}
                    className="w-full"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Go to Creator Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/dashboard/creator')}
                    variant="outline"
                    className="w-full"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Become a Creator
                  </Button>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="p-[50px] px-[100px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Welcome back, {userProfile?.display_name || 'User'}
            </p>
          </div>
          {creatorProfile && (
            <Button
              onClick={() => navigate('/dashboard/creator')}
              className="flex items-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Go to Creator Dashboard</span>
            </Button>
          )}
        </div>

        {renderPanel()}
      </div>
    </MainLayout>
  );
};

export default FeedDashboard;
