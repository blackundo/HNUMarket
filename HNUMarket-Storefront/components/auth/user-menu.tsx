'use client';

import { useState, useEffect } from 'react';
import { User, LogOut, Package, LogIn, Heart, Settings } from 'lucide-react';
import type { User as UserType } from '@/types/auth';
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserMenuProps {
  user?: UserType | null;
  onLogout?: () => void;
  customTrigger?: boolean;
}

export function UserMenu({ user, onLogout, customTrigger }: UserMenuProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      }
    };

    checkAdmin();
  }, [user, supabase]);

  // Common content for dropdown
  const content = (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem className='cursor-pointer' asChild>
        <Link href="/wishlist">
          <Heart className="w-4 h-4 mr-2" />
          Yêu thích
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem className='cursor-pointer' asChild>
        <Link href="/orders">
          <Package className="w-4 h-4 mr-2" />
          Đơn hàng
        </Link>
      </DropdownMenuItem>
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className='cursor-pointer' asChild>
            <Link href="/admin">
              <Settings className="w-4 h-4 mr-2" />
              Quản trị
            </Link>
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
        <LogOut className="w-4 h-4 mr-2" />
        Đăng xuất
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  // Custom trigger for Navbar redesign
  if (customTrigger) {
    if (!user) {
      return (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Link href="/auth/login" className="hover:text-primary transition-colors">Đăng nhập</Link>
          <span>&</span>
          <Link href="/auth/register" className="hover:text-primary transition-colors">Đăng ký</Link>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{user.fullName}</span>
          </div>
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>
    );
  }

  // Menu cho user chưa đăng nhập (Mobile/Default)
  // if (!user) {
  //   return (
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button variant="ghost" className="flex items-center gap-2">
  //           <User className="w-4 h-4" />
  //         </Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent align="end" className="w-48">
  //         <DropdownMenuItem className='cursor-pointer' asChild>
  //           <Link href="/auth/login">
  //             <LogIn className="w-4 h-4 mr-2" />
  //             Đăng nhập
  //           </Link>
  //         </DropdownMenuItem>
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   );
  // }

  // Menu cho user đã đăng nhập (Mobile/Default)
  // return (
  //   <DropdownMenu>
  //     <DropdownMenuTrigger asChild>
  //       <Button variant="ghost" className="flex items-center gap-2">
  //         <User className="w-4 h-4" />
  //         <span className="hidden md:inline">{user.fullName}</span>
  //       </Button>
  //     </DropdownMenuTrigger>
  //     {content}
  //   </DropdownMenu>
  // );
}
