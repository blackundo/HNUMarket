'use client';

import { NotificationProvider } from '@refinedev/core';
import { toast } from 'sonner';

export const notificationProvider: NotificationProvider = {
  open: ({ message, type, description, key }) => {
    const content = description || message;

    switch (type) {
      case 'success':
        toast.success(content);
        break;
      case 'error':
        toast.error(content);
        break;
      case 'progress':
        toast.loading(content);
        break;
      default:
        toast.info(content);
    }
  },
  close: (key) => {
    toast.dismiss(key);
  },
};

