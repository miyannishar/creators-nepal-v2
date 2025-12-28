import { JSX } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

/**
 *
 * @param {object} props - Props for the Layout component
 * @param {React.ReactNode} props.children - Child components to be rendered within the layout
 * @returns {React.ReactElement} The Layout component
 */
const MainLayout = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const { userProfile, user } = useAuth();

  // Check email verification status from Supabase Auth (source of truth)
  // Supabase uses email_confirmed_at to track email verification
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <>
          {user && !isEmailVerified && (
            <div className="bg-warning flex items-center justify-between gap-4 border-b-5 border-b-black px-6 py-3">
              <p className="text-lg">
                Your email is not verified, check the inbox for confirmation email.
              </p>
              <Button
                shadow={false}
                variant="secondary"
                containerClassName="w-max"
                onClick={async () => {
                  if (user?.email) {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: user.email,
                    });
                    if (error) {
                      console.error('Error resending confirmation email:', error);
                    } else {
                      console.log('Confirmation email resent successfully');
                    }
                  }
                }}
              >
                Resend confirmation email
              </Button>
            </div>
          )}
          {children}
        </>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
