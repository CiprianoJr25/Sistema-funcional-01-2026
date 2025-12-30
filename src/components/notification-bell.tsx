
"use client";

import { Bell, Ticket, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AppNotification } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Separator } from './ui/separator';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: () => void;
}

export function NotificationBell({ notifications, unreadCount, onMarkAsRead }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && unreadCount > 0) {
            // Automatically mark as read when opened
            onMarkAsRead();
        }
    }
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Abrir notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">Notificações</h4>
             {notifications.length > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={onMarkAsRead}>
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Marcar todas como lidas
                </Button>
             )}
          </div>
          <Separator />
          <ScrollArea className="h-80">
            <div className="space-y-2">
                {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                        <div key={notification.id}>
                            <Link 
                                href={notification.href} 
                                passHref
                                className="block p-3 rounded-md hover:bg-muted/50"
                                onClick={() => setIsOpen(false)} // Close popover on click
                            >
                                <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                        <Ticket className="h-5 w-5 text-muted-foreground"/>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                             {index < notifications.length - 1 && <Separator className="my-1" />}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10">
                        Nenhuma notificação por enquanto.
                    </div>
                )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
