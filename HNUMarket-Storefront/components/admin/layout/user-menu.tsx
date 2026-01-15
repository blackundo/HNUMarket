'use client';

import { useRouter } from 'next/navigation';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-2 hover:bg-sidebar-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-admin-primary">
        <div className="w-8 h-8 rounded-full bg-admin-primary flex items-center justify-center text-white font-medium">
          A
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-admin">Admin Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer font-admin"
          onClick={() => router.push('/admin/profile')}
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer font-admin"
          onClick={() => router.push('/admin/settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer font-admin"
          onClick={() => router.push('/admin/help')}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer font-admin text-admin-error focus:text-admin-error"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
