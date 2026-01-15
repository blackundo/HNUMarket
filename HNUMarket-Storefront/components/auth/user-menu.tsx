'use client';

import { User, LogOut, Package, LogIn } from 'lucide-react';
import type { User as UserType } from '@/types/auth';
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
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  // Menu cho user chưa đăng nhập
  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className='cursor-pointer' asChild>
            <Link href="/auth/login">
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Menu cho user đã đăng nhập
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden md:inline">{user.fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className='cursor-pointer'>
          <User className="w-4 h-4 mr-2" />
          Tài khoản
        </DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer' asChild>
          <Link href="/orders">
            <Package className="w-4 h-4 mr-2" />
            Đơn hàng
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
