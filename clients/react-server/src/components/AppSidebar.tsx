import { LayoutDashboard, Library, ChartBar, Users, DollarSign, Home, Crown, Search, User, Compass } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { UserDropdown } from './user-dropdown';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Supporter dashboard items (for all users)
const supporterItems = [
  {
    title: 'Feed',
    url: '/dashboard?panel=feed',
    icon: Home,
  },
  {
    title: 'Discover',
    url: '/dashboard?panel=discover',
    icon: Compass,
  },
  {
    title: 'Search',
    url: '/dashboard?panel=search',
    icon: Search,
  },
  {
    title: 'Profile',
    url: '/dashboard?panel=profile',
    icon: User,
  },
];

// Creator dashboard items (for creators)
const creatorItems = [
  {
    title: 'Creator Dashboard',
    url: '/dashboard/creator',
    icon: Crown,
  },
  {
    title: 'Content',
    url: '/dashboard/content',
    icon: Library,
  },
  {
    title: 'Insights',
    url: '/dashboard/insights',
    icon: ChartBar,
  },
  {
    title: 'Audience',
    url: '/dashboard/audience',
    icon: Users,
  },
  {
    title: 'Payouts',
    url: '/dashboard/payouts',
    icon: DollarSign,
  },
];

/**
 * @returns {JSX.Element} The AppSidebar component
 */
export const AppSidebar = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { creatorProfile } = useAuth();

  // Determine which items to show based on current route
  const isCreatorDashboard = location.pathname.startsWith('/dashboard/creator') ||
    location.pathname.startsWith('/dashboard/content') ||
    location.pathname.startsWith('/dashboard/insights') ||
    location.pathname.startsWith('/dashboard/audience') ||
    location.pathname.startsWith('/dashboard/payouts') ||
    location.pathname.startsWith('/new-post') ||
    location.pathname.startsWith('/edit-post');

  const items = isCreatorDashboard ? creatorItems : supporterItems;

  // Add Creator Dashboard link to supporter sidebar if user is a creator
  const supporterItemsWithCreator = creatorProfile
    ? [
        ...supporterItems,
        {
          title: 'Creator Dashboard',
          url: '/dashboard/creator',
          icon: Crown,
        },
      ]
    : supporterItems;

  const finalItems = isCreatorDashboard ? creatorItems : supporterItemsWithCreator;

  return (
    <Sidebar collapsible="icon">
      <SidebarTrigger className="absolute top-[calc((100vh-36px)/2)] -right-6 z-10" />

      <SidebarHeader>
        <SidebarMenu className="flex group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="w-max">
            <Link to="/dashboard">
              <img src="/logo.svg" alt="logo" className="size-8" />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {finalItems.map((item) => {
                const IconComponent = item.icon;
                // Check if active - handle query params for supporter dashboard
                let isActive = false;
                if (item.url.includes('?')) {
                  isActive = location.pathname + location.search === item.url;
                } else if (item.url === '/dashboard') {
                  // Feed is active when on /dashboard with no panel or panel=feed
                  isActive = location.pathname === '/dashboard' && (!location.search || location.search === '?panel=feed');
                } else {
                  isActive = location.pathname === item.url;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url, { viewTransition: true })}
                      isActive={isActive}
                    >
                      <IconComponent />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
};
