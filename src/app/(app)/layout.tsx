"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarSeparator, SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptionalSidebar } from '@/components/ui/sidebar';


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const sidebar = useOptionalSidebar();
    const isMobile = useIsMobile();
   
    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [user, loading, router]);
    
    if (loading || !user) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }
  
    return (
      <>
        <Sidebar collapsible="icon" className='border-r'>
          <SidebarHeader className="p-4 justify-center mt-2 bg-muted/50">
              <Link href="/dashboard">
                <Logo />
              </Link>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent className="flex flex-col p-2">
              <NavLinks />
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className={cn("p-2", sidebar?.state === 'collapsed' && 'hidden')}>
              <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>&copy; {new Date().getFullYear()} Euroinfo</p>
                  <p>
                      Desenvolvido por{' '}
                      <Link
                      href="https://incodev.com.br"
                      target="_blank"
                      className="font-semibold text-foreground hover:underline"
                      >
                      Incode Dev
                      </Link>
                  </p>
              </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card dark:bg-muted/40 px-4 lg:h-[60px] lg:px-6">
             <div className="text-lg font-semibold text-muted-foreground hidden md:flex items-center gap-2">
                <span>Nexus Service</span>
                <SidebarTrigger />
             </div>
             <div className="flex-1 text-lg font-semibold text-muted-foreground md:hidden">Euroinfo</div>

            <div className="w-full flex-1" />
            
            <div className="flex items-center gap-2">
                <UserNav />
                <SidebarTrigger className="md:hidden"/>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 md:gap-6 md:pb-6 pb-4 p-4 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </>
    )
  }
  
  export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
      <SidebarProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </SidebarProvider>
    )
  }
