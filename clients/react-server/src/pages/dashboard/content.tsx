import { JSX, useRef, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { PostResponse } from '@/contexts/AppDataContext';

import MainLayout from '@/layouts/main';
import { Input } from '@/components/ui/input';
import { DataTable, createSimpleColumn, createActionsColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/contexts/AppDataContext';
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
import { supabase } from '@/lib/supabase';

/**
 * Content dashboard page component.
 * Displays content management interface for creators.
 *
 * @returns {JSX.Element} The content dashboard page
 */
const Content = (): JSX.Element => {
  const navigate = useNavigate();
  const postsFilterRef = useRef<HTMLInputElement>(null);
  const [deletingPost, setDeletingPost] = useState<PostResponse | undefined>(undefined);
  const [lastDeletingPost, setLastDeletingPost] = useState<PostResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get data from context (fetched on server side)
  const { posts, fetchPosts } = useAppData();
  const currentDeletingPost = deletingPost || lastDeletingPost;

  // Update lastDeletingPost when deletingPost is set
  useEffect(() => {
    if (deletingPost) {
      setLastDeletingPost(deletingPost);
    }
  }, [deletingPost]);

  // Clear lastDeletingPost after dialog closes
  useEffect(() => {
    if (!deletingPost) {
      const timer = setTimeout(() => {
        setLastDeletingPost(null);
      }, 300); // Match dialog animation duration
      return () => clearTimeout(timer);
    }
  }, [deletingPost]);

  /**
   * Handles the deletion of a post after confirmation.
   *
   * @returns {Promise<void>}
   */
  const handleDeletePost = async (): Promise<void> => {
    if (!currentDeletingPost) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', currentDeletingPost.id);
      if (error) throw error;
      setDeletingPost(undefined);
      // Refresh posts after deletion
      if (fetchPosts) {
        await fetchPosts();
      } else {
        navigate(0);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Column definitions for posts
  const postsColumns: ColumnDef<PostResponse>[] = [
    createSimpleColumn('postNumber', '#', true),
    createSimpleColumn('title', 'Title', false),
    createSimpleColumn('createdAt', 'Created At', true, ({ row }) => {
      const value = row.getValue('createdAt');
      if (!value) return <div>-</div>;

      const date = value instanceof Date ? value : new Date(value as string);
      if (isNaN(date.getTime())) return <div>Invalid date</div>;

      return <div>{date.toLocaleDateString()}</div>;
    }),
    createActionsColumn<PostResponse>([
      {
        label: 'Edit post',
        icon: Edit,
        onClick: (post) => navigate(`/edit-post?id=${post.id}`),
      },
      {
        label: 'View post',
        icon: Eye,
        onClick: (post) => navigate(`/post/${post.id}`),
      },
      {
        label: 'Delete post',
        icon: Trash2,
        destructive: true,
        onClick: (post) => setDeletingPost(post),
      },
    ]),
  ];

  return (
    <MainLayout>
      <div className="p-[50px] px-[100px]">
        <h1 className="mb-[50px] text-5xl">Content</h1>

        <div className="w-full">
          {posts && posts.length > 0 ? (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <Input
                      ref={postsFilterRef}
                      placeholder="Search posts..."
                      className="md:text-base"
                    />

                    <Button onClick={() => navigate('/new-post')}>
                      New post
                      <Plus />
                    </Button>
                  </div>
                  <DataTable
                    columns={postsColumns}
                    data={posts || []}
                    enableSorting={true}
                    enableCheckboxes={false}
                    enablePagination={true}
                    enableColumnFilters={true}
                    filterColumn="title"
                    filterInputRef={postsFilterRef}
                  />
                </>
              ) : (
                <div className="relative m-[3px] flex flex-col items-center justify-center gap-5 bg-white p-10">
              <PxBorder width={3} radius="lg" />
                  <div className="text-lg">You haven't created any posts yet.</div>
                  <Button onClick={() => navigate('/new-post')} containerClassName="w-max">
                    New post
                    <Plus />
                  </Button>
              </div>
            )}
        </div>
      </div>

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPost}
        onOpenChange={(open) => !open && setDeletingPost(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentDeletingPost?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Content;
