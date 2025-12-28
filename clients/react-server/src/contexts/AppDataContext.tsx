import { supabase } from '@/lib/supabase';
import { createContext, useContext, ReactNode, JSX, useState } from 'react';

// Types based on Supabase schema
export interface PostResponse {
  id: string;
  user_id: string;
  title: string;
  content: string;
  slug: string;
  number: number;
  is_published: boolean;
  is_premium: boolean;
  thumbnail_url: string | null;
  audio_file_url: string | null;
  video_file_url: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface AppDataContextType {
  posts: PostResponse[] | null;
  singlePost: PostResponse | null;
  fetchPosts?: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  fetchSinglePost?: (postId: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
  children: ReactNode;
  initialPosts?: PostResponse[] | null;
  initialSinglePost?: PostResponse | null;
}

/**
 * App data provider component that manages data and provides data access methods.
 *
 * @param {AppDataProviderProps} props - The component props
 * @param {ReactNode} props.children - Child components to render
 * @param {PostResponse[] | null} props.initialPosts - Initial posts data
 * @param {PostResponse | null} props.initialSinglePost - Initial single post data
 * @returns {JSX.Element} The provider component
 */
export const AppDataProvider = ({
  children,
  initialPosts,
  initialSinglePost,
}: AppDataProviderProps): JSX.Element => {
  const [posts, setPosts] = useState<PostResponse[] | null>(initialPosts ?? null);
  const [singlePost, setSinglePost] = useState<PostResponse | null>(initialSinglePost ?? null);

  /**
   * Fetch posts from Supabase.
   */
  const fetchPosts = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data as PostResponse[]);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  };


  /**
   * Fetch a single post from Supabase.
   *
   * @param {string} postId - The ID of the post to fetch
   */
  const fetchSinglePost = async (postId: string): Promise<void> => {
    // Clear the current singlePost to avoid showing stale data
    setSinglePost(null);

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        return;
      }

      setSinglePost(data as PostResponse);
    } catch (error) {
      console.error('Error in fetchSinglePost:', error);
    }
  };

  const value = {
    posts,
    singlePost,
    fetchPosts,
    fetchSinglePost,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

/**
 * Custom hook to access app data context.
 *
 * @returns {AppDataContextType} The app data context
 * @throws {Error} When used outside of AppDataProvider
 */
export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
