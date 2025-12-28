import { JSX, useState } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Share2, MoreHorizontal, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { PostResponse } from '@/contexts/AppDataContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface PostCardProps {
  post: PostResponse & {
    creator?: {
      id: string;
      display_name: string;
      photo_url?: string | null;
      email?: string;
    };
  };
  onPostClick?: (postId: string) => void;
}

/**
 * PostCard component for displaying posts in the feed
 */
export const PostCard = ({ post, onPostClick }: PostCardProps): JSX.Element => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        // Like
        const { error } = await supabase.from('post_likes').insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (!error) {
          setIsLiked(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      // TODO: Show toast notification
    }
  };

  const handleCardClick = () => {
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  const formatContent = (content: string) => {
    if (content.length <= 300) return content;
    return content.substring(0, 300) + '...';
  };

  return (
    <Card
      className="w-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {post.creator && (
              <>
                <Link
                  to={`/creator/${post.creator.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  {(post.creator.avatar_url || post.creator.photo_url) ? (
                    <img
                      src={post.creator.avatar_url || post.creator.photo_url || ''}
                      alt={post.creator.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {post.creator.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </Link>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/creator/${post.creator.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {post.creator.display_name}
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    {post.is_premium && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Post Title */}
          <Link to={`/post/${post.id}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
              {post.title}
            </h2>
          </Link>

          {/* Post Content */}
          <div className="text-gray-700 whitespace-pre-wrap">
            {formatContent(post.content)}
            {post.content.length > 300 && (
              <Link
                to={`/post/${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:underline ml-1"
              >
                Read more
              </Link>
            )}
          </div>

          {/* Post Thumbnail/Image */}
          {post.thumbnail_url && (
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!user || isLiking}
                className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                {isLiking ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
                <span>{likesCount > 0 ? likesCount.toLocaleString() : ''}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-500"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-500"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>

            {/* View Post Button */}
            <Link to={`/post/${post.id}`} onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline">
                View Post
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

