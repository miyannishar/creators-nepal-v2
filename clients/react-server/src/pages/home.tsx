import { Link2, PlusIcon } from 'lucide-react';
import MainLayout from '../layouts/main';
import { JSX } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PxBorder from '@/components/px-border';
import { Link, useNavigate, useSearchParams } from 'react-router';
import FocusRing from '@/components/focus-ring';
import UnderContruction from '@/components/under-contruction';
import { Customization } from '@/components/customization';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';

/**
 * @returns {JSX.Element} The Home component
 */
export const Home = (): JSX.Element => {
  const { userProfile } = useAuth();
  const { posts, fetchPosts } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const description = userProfile?.description || 'creating high quality content';
  const urlSlug = userProfile?.id?.substring(0, 8) || 'creator';
  const navigate = useNavigate();

  console.log('[Home] Rendering with userProfile:', { id: userProfile?.id, email: userProfile?.email });

  // Filter posts for this user
  const userPosts = posts?.filter((post) => post.user_id === userProfile?.id) || [];

  return (
    <MainLayout>
      <div className="bg-secondary-primary relative flex h-[300px] w-full items-center gap-[25px] border-b-5 border-b-black p-[50px] px-[100px]">
        <div className="relative m-[5px] size-[190px]">
          <img src={userProfile?.avatar_url ?? undefined} alt="pfp" className="size-full object-cover" />
          <PxBorder width={5} radius="lg" />
        </div>
        <div className="flex flex-col gap-5">
          <div className="relative m-[5px] w-max">
            <PxBorder width={5} radius="md" />
            <div className="bg-white px-[10px] py-[5px]">
              <h2 className="text-3xl">{userProfile?.display_name ?? undefined}</h2>
            </div>
          </div>
          <div className="relative m-[5px]">
            <PxBorder width={5} radius="md" />
            <div className="bg-white px-[10px] py-[5px]">
              <p className="text-lg">{description}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 mb-[5px] ml-[5px]">
          <div className="absolute -bottom-[5px] left-0 h-[5px] w-full bg-black" />
          <div className="absolute top-0 -left-[5px] h-full w-[5px] bg-black" />
          <div className="flex items-center gap-2.5 bg-white px-[10px] py-[5px]">
            <Link2 size={20} />
            <p className="text-base">creatorsnepal.com/{urlSlug}</p>
          </div>
        </div>
        <Customization initialData={userProfile ?? undefined} />
      </div>
      <main className="p-[50px] px-[100px]">
        <Tabs
          className="gap-10"
          value={activeTab}
          onValueChange={(value) => setSearchParams({ tab: value })}
        >
          <TabsList>
            <TabsTrigger value="all">Posts</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
          </TabsList>
          <TabsContent
            className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            value="all"
          >
            {!userPosts || userPosts.length === 0 ? (
              <div className="relative col-span-full flex flex-col items-center justify-center gap-5 bg-white p-10">
                <PxBorder width={3} radius="lg" />
                <h2 className="text-2xl">Welcome to your Creators Nepal page!</h2>
                <p className="text-lg">
                  Create your first post to start sharing content with your audience.
                </p>
                <Button
                  containerClassName="w-max"
                  onClick={() => navigate('/new-post', { viewTransition: true })}
                >
                  Create Your First Post
                      <PlusIcon size={20} />
                    </Button>
              </div>
            ) : (
              <>
                {userPosts.map((post) => (
                  <div
                    className="bg-secondary-primary relative flex h-full flex-col justify-between gap-5 p-5"
                    key={post.id}
                  >
                    <Link
                      className="group flex flex-col gap-4 outline-none"
                      to={`/post/${post.id}`}
                    >
                      <div className="bg-accent relative aspect-video">
                        <PxBorder width={3} radius="lg" />
                        {post.thumbnail_url ? (
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200">
                            <span className="text-gray-400">No thumbnail</span>
                          </div>
                        )}
                      </div>
                      <PxBorder width={3} radius="lg" />
                      <FocusRing width={3} />
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl">{post.title}</h3>
                        <p className="text-base line-clamp-2">{post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                      </div>
                    </Link>
                    <Button
                      className="w-full"
                      containerClassName="mt-0"
                      onClick={() => navigate(`/edit-post?id=${post.id}`, { viewTransition: true })}
                    >
                      Edit post
                      <PlusIcon size={20} />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
          <TabsContent className="gap-10" value="tiers">
            <UnderContruction />
          </TabsContent>
        </Tabs>
      </main>
    </MainLayout>
  );
};

export default Home;
