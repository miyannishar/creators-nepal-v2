-- Helper functions for Patron app

-- =====================================================
-- DISCOVERY FEED FUNCTION
-- =====================================================
-- Get personalized discovery feed for a user
CREATE OR REPLACE FUNCTION public.get_discovery_feed(
  user_uuid uuid,
  feed_limit integer DEFAULT 20
)
RETURNS TABLE (
  post_id uuid,
  series_id uuid,
  series_title text,
  creator_id uuid,
  creator_name text,
  creator_avatar_url text,
  creator_verified boolean,
  post_title text,
  post_content text,
  post_number integer,
  post_thumbnail_url text,
  post_created_at timestamp with time zone,
  likes_count integer,
  comments_count integer,
  views_count integer,
  user_has_liked boolean,
  user_follows_creator boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS post_id,
    p.series_id,
    s.title AS series_title,
    p.user_id AS creator_id,
    u.display_name AS creator_name,
    u.avatar_url AS creator_avatar_url,
    u.is_verified AS creator_verified,
    p.title AS post_title,
    p.content AS post_content,
    p.number AS post_number,
    p.thumbnail_url AS post_thumbnail_url,
    p.created_at AS post_created_at,
    COALESCE(p.likes_count, 0)::integer AS likes_count,
    COALESCE(p.comments_count, 0)::integer AS comments_count,
    COALESCE(p.views_count, 0)::integer AS views_count,
    EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_uuid) AS user_has_liked,
    EXISTS(SELECT 1 FROM public.follows f WHERE f.following_id = p.user_id AND f.follower_id = user_uuid) AS user_follows_creator
  FROM
    public.posts p
  INNER JOIN public.users u ON p.user_id = u.id
  INNER JOIN public.series s ON p.series_id = s.id
  WHERE
    p.is_published = true
    AND p.deleted_at IS NULL
    AND s.deleted_at IS NULL
  ORDER BY
    p.created_at DESC
  LIMIT feed_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- SEARCH CREATORS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_creators(
  search_query text,
  search_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  description text,
  bio text,
  category text,
  is_verified boolean,
  followers_count integer,
  posts_count integer,
  series_count integer,
  total_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.display_name,
    u.avatar_url,
    u.description,
    cp.bio,
    cp.category,
    u.is_verified,
    COALESCE(cp.followers_count, 0)::integer AS followers_count,
    COALESCE(cp.posts_count, 0)::integer AS posts_count,
    COALESCE(cp.series_count, 0)::integer AS series_count,
    COALESCE(cp.total_earnings, 0) AS total_earnings
  FROM
    public.users u
  LEFT JOIN public.creator_profiles cp ON u.id = cp.user_id
  WHERE
    u.role IN ('creator', 'admin')
    AND (
      u.display_name ILIKE '%' || search_query || '%'
      OR u.description ILIKE '%' || search_query || '%'
      OR cp.bio ILIKE '%' || search_query || '%'
      OR cp.category ILIKE '%' || search_query || '%'
    )
  ORDER BY
    u.is_verified DESC,
    cp.followers_count DESC,
    u.display_name ASC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- SEARCH SERIES FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_series(
  search_query text,
  search_limit integer DEFAULT 20
)
RETURNS TABLE (
  series_id uuid,
  user_id uuid,
  creator_name text,
  creator_avatar_url text,
  title text,
  description text,
  slug text,
  category text,
  cover_image_url text,
  posts_count integer,
  is_published boolean,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS series_id,
    s.user_id,
    u.display_name AS creator_name,
    u.avatar_url AS creator_avatar_url,
    s.title,
    s.description,
    s.slug,
    s.category,
    s.cover_image_url,
    COALESCE(s.posts_count, 0)::integer AS posts_count,
    s.is_published,
    s.created_at
  FROM
    public.series s
  INNER JOIN public.users u ON s.user_id = u.id
  WHERE
    s.is_published = true
    AND s.deleted_at IS NULL
    AND (
      s.title ILIKE '%' || search_query || '%'
      OR s.description ILIKE '%' || search_query || '%'
      OR s.category ILIKE '%' || search_query || '%'
      OR u.display_name ILIKE '%' || search_query || '%'
    )
  ORDER BY
    s.posts_count DESC,
    s.created_at DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GET CREATOR STATS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_creator_stats(
  creator_uuid uuid
)
RETURNS TABLE (
  total_earnings numeric,
  total_supporters integer,
  active_subscriptions integer,
  total_posts integer,
  total_series integer,
  total_followers integer,
  total_likes integer,
  total_comments integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN st.status = 'completed' THEN st.amount ELSE 0 END), 0) AS total_earnings,
    COUNT(DISTINCT st.supporter_id)::integer AS total_supporters,
    COUNT(DISTINCT CASE WHEN sub.status = 'active' THEN sub.id END)::integer AS active_subscriptions,
    COUNT(DISTINCT p.id)::integer AS total_posts,
    COUNT(DISTINCT s.id)::integer AS total_series,
    COALESCE(cp.followers_count, 0)::integer AS total_followers,
    COALESCE(cp.likes_count, 0)::integer AS total_likes,
    COALESCE(SUM(p.comments_count), 0)::integer AS total_comments
  FROM
    public.users u
  LEFT JOIN public.creator_profiles cp ON u.id = cp.user_id
  LEFT JOIN public.supporter_transactions st ON u.id = st.creator_id
  LEFT JOIN public.subscriptions sub ON u.id = sub.creator_id
  LEFT JOIN public.posts p ON u.id = p.user_id AND p.deleted_at IS NULL
  LEFT JOIN public.series s ON u.id = s.user_id AND s.deleted_at IS NULL
  WHERE
    u.id = creator_uuid
  GROUP BY
    u.id, cp.followers_count, cp.likes_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GET USER FEED (Following creators)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_feed(
  user_uuid uuid,
  feed_limit integer DEFAULT 20,
  feed_offset integer DEFAULT 0
)
RETURNS TABLE (
  post_id uuid,
  series_id uuid,
  series_title text,
  creator_id uuid,
  creator_name text,
  creator_avatar_url text,
  creator_verified boolean,
  post_title text,
  post_content text,
  post_number integer,
  post_thumbnail_url text,
  post_created_at timestamp with time zone,
  likes_count integer,
  comments_count integer,
  user_has_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS post_id,
    p.series_id,
    s.title AS series_title,
    p.user_id AS creator_id,
    u.display_name AS creator_name,
    u.avatar_url AS creator_avatar_url,
    u.is_verified AS creator_verified,
    p.title AS post_title,
    p.content AS post_content,
    p.number AS post_number,
    p.thumbnail_url AS post_thumbnail_url,
    p.created_at AS post_created_at,
    COALESCE(p.likes_count, 0)::integer AS likes_count,
    COALESCE(p.comments_count, 0)::integer AS comments_count,
    EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_uuid) AS user_has_liked
  FROM
    public.posts p
  INNER JOIN public.users u ON p.user_id = u.id
  INNER JOIN public.series s ON p.series_id = s.id
  INNER JOIN public.follows f ON f.following_id = p.user_id AND f.follower_id = user_uuid
  WHERE
    p.is_published = true
    AND p.deleted_at IS NULL
    AND s.deleted_at IS NULL
  ORDER BY
    p.created_at DESC
  LIMIT feed_limit
  OFFSET feed_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- INCREMENT COUNTERS (for likes, views, etc.)
-- =====================================================

-- Increment post views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    
    -- Update creator profile likes count
    UPDATE public.creator_profiles cp
    SET likes_count = likes_count + 1
    FROM public.posts p
    WHERE p.id = NEW.post_id AND cp.user_id = p.user_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    
    -- Update creator profile likes count
    UPDATE public.creator_profiles cp
    SET likes_count = GREATEST(likes_count - 1, 0)
    FROM public.posts p
    WHERE p.id = OLD.post_id AND cp.user_id = p.user_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Update followers count
CREATE OR REPLACE FUNCTION public.update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER followers_count_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_followers_count();

-- Update series posts count
CREATE OR REPLACE FUNCTION public.update_series_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.series
    SET posts_count = posts_count + 1
    WHERE id = NEW.series_id;
    
    UPDATE public.creator_profiles
    SET posts_count = posts_count + 1
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.series
    SET posts_count = GREATEST(posts_count - 1, 0)
    WHERE id = OLD.series_id;
    
    UPDATE public.creator_profiles
    SET posts_count = GREATEST(posts_count - 1, 0)
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER series_posts_count_trigger
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_series_posts_count();

-- Update creator series count
CREATE OR REPLACE FUNCTION public.update_creator_series_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles
    SET series_count = series_count + 1
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles
    SET series_count = GREATEST(series_count - 1, 0)
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creator_series_count_trigger
  AFTER INSERT OR DELETE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_series_count();

