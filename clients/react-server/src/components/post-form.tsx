import { JSX, useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Save } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PxBorder from '@/components/px-border';
import { supabase } from '@/lib/supabase';
import { PostResponse } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

type CreatePostRequest = {
  title: string;
  content: string;
  slug: string;
  number: number;
  isPublished?: boolean;
  isPremium?: boolean;
  thumbnailUrl?: string;
};

type UpdatePostRequest = Partial<CreatePostRequest>;
import { Editor } from '@tinymce/tinymce-react';
import { useAppData } from '@/contexts/AppDataContext';

import '../styling/tinymce.css';

interface PostFormProps {
  /**
   * Existing post data for editing (optional)
   */
  existingPost?: PostResponse;
  /**
   * Whether this is edit mode
   */
  isEditMode?: boolean;
}

/**
 * Reusable post form component for creating or editing posts.
 *
 * @param {PostFormProps} props - The component props
 * @returns {JSX.Element} The post form component
 */
const PostForm = ({ existingPost, isEditMode = false }: PostFormProps): JSX.Element => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingPost?.thumbnail_url || null,
  );
  const [isImageDialogOpen, setIsImageDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const editorRef = useRef<any>(null);

  const { fetchPosts } = useAppData();

  /**
   * Form instance for post creation/editing with default values and validation rules.
   */
  const form = useForm<CreatePostRequest>({
    defaultValues: {
      title: existingPost?.title || '',
      content: existingPost?.content || '',
      postNumber: existingPost?.number || 1,
      isPublished: existingPost?.is_published ?? true, // Default to published for new posts
      thumbnailUrl: existingPost?.thumbnail_url || undefined,
    },
  });


  /**
   * Handles the submission of the post form.
   *
   * @param {CreatePostRequest} formData - The form data containing all post information
   * @returns {void}
   */
  const handleSubmit = async (formData: CreatePostRequest): Promise<void> => {
    try {
      setIsLoading(true);

      // Get content from TinyMCE editor
      const editorContent = editorRef.current?.getContent() || '';

      // Validate editor content
      if (!editorContent || editorContent.trim() === '' || editorContent === '<p></p>') {
        form.setError('content', {
          type: 'manual',
          message: 'Content is required',
        });
        setIsLoading(false);
        return;
      }

      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      if (!userProfile) {
        throw new Error('User not authenticated');
      }

      if (isEditMode && existingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
          title: formData.title,
          content: editorContent,
          slug: slug,
            number: formData.postNumber,
            is_published: formData.isPublished,
            thumbnail_url: formData.thumbnailUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPost.id);
        if (error) throw error;
        console.log('Post updated successfully');
      } else {
        // Create new post
        const { error } = await supabase.from('posts').insert({
          user_id: userProfile.id,
          title: formData.title,
          content: editorContent,
          slug: slug,
          number: formData.postNumber,
          is_published: formData.isPublished ?? true, // Default to published
          is_premium: false,
          thumbnail_url: formData.thumbnailUrl || null,
        });
        if (error) throw error;
        console.log('Post created successfully');
      }

      // Refresh posts data
      await fetchPosts?.();

      // Navigate back to content dashboard
      navigate('/dashboard/content');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} post:`, error);
      form.setError('title', {
        type: 'manual',
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? 'update' : 'create'} post`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Opens the image upload dialog.
   *
   * @returns {void}
   */
  const openImageDialog = (): void => {
    setIsImageDialogOpen(true);
  };

  /**
   * Closes the image upload dialog.
   *
   * @returns {void}
   */
  const closeImageDialog = (): void => {
    setIsImageDialogOpen(false);
  };

  /**
   * Handles file selection for image upload.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event
   * @returns {void}
   */
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        form.setValue('thumbnailUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title and Series Row */}
            <div className="flex items-center gap-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Post Number */}
              <FormField
                control={form.control}
                name="postNumber"
                rules={{ required: 'Post number is required', min: 1 }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="w-[100px]"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Content Editor */}
            <FormField
              control={form.control}
              name="content"
              render={() => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <div className="relative m-[3px] bg-white">
                      <PxBorder className="z-10" width={3} radius="lg" />
                      <Editor
                        apiKey="oja86xbqgcds3rxbw50q4thormz7y3np8vsw1tg2xpm3d60i"
                        // eslint-disable-next-line max-params
                        onInit={(_evt, editor) => {
                          editorRef.current = editor;
                        }}
                        initialValue={existingPost?.content || ''}
                        init={{
                          height: 500,
                          menubar: false,
                          plugins: [
                            'importcss',
                            'autolink',
                            'lists',
                            'link',
                            'image',
                            'anchor',
                            'searchreplace',
                            'fullscreen',
                            'code',
                          ],
                          promotion: false,
                          onboarding: false,
                          statusbar: false,
                          icons_url: '/tinymce/icons/custom/icons.js',
                          icons: 'custom',
                          block_formats:
                            'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4',
                          object_resizing: false,
                          image_description: false,
                          image_dimensions: false,
                          link_default_target: false,
                          toolbar:
                            'undo redo blocks bold italic underline strikethrough bullist numlist link image quote triangleUp',
                          content_css: [
                            '../styling/inner-tinymce.css',
                            'https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,100..900;1,100..900&display=swap',
                          ],
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thumbnail Image */}
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Thumbnail Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={openImageDialog}
                        className="w-full"
                        shadow={false}
                      >
                        <Upload className="h-4 w-4" />
                        {imagePreview ? 'Change Image' : 'Add Image'}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Publish Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? undefined}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Publish this post immediately</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard/content')}
                shadow={false}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4" />
                {isLoading
                  ? `${isEditMode ? 'Updating' : 'Creating'} Post...`
                  : `${isEditMode ? 'Update' : 'Create'} Post`}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Series is now optional - removed the "Create a series first" modal */}

      {/* Image Upload Dialog */}
      <AlertDialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Thumbnail Image</AlertDialogTitle>
            <AlertDialogDescription>
              Select an image for your post. Image should be in 16:9 aspect ratio.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center gap-2">
            <input
              id="post-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview && (
              <div className="relative aspect-video w-2/3">
                <PxBorder width={3} radius="lg" />
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => document.getElementById('post-image-upload')?.click()}
              shadow={false}
              className="mx-auto w-max"
            >
              <Upload />
              Choose Image File
            </Button>
          </div>

          <AlertDialogFooter>
            <Button type="button" variant="secondary" onClick={closeImageDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                closeImageDialog();
              }}
              disabled={!imagePreview}
            >
              Save Image
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostForm;
