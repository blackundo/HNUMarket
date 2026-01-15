'use client';

import { useState, useEffect } from 'react';

interface UseSidebarStateReturn {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  toggleExpanded: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
  toggleMobile: () => void;
  expandedMenus: string[];
  toggleMenu: (menuId: string) => void;
  isMenuExpanded: (menuId: string) => boolean;
}

/**
 * Custom hook to manage admin sidebar state
 * Handles expand/collapse, mobile drawer, and sub-menu states
 * Persists sidebar expanded state to localStorage
 */
export function useSidebarState(): UseSidebarStateReturn {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  // Load saved sidebar state on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('admin-sidebar-expanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }
  }, []);

  // Persist sidebar state when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('admin-sidebar-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, mounted]);

  // Toggle sidebar expanded state
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Toggle mobile drawer
  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  // Toggle sub-menu expanded state
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      }
      return [...prev, menuId];
    });
  };

  // Check if a menu is expanded
  const isMenuExpanded = (menuId: string) => {
    return expandedMenus.includes(menuId);
  };

  return {
    isExpanded,
    setIsExpanded,
    toggleExpanded,
    isMobileOpen,
    setIsMobileOpen,
    toggleMobile,
    expandedMenus,
    toggleMenu,
    isMenuExpanded,
  };
}
