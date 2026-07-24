import { useEffect, useMemo } from "react";
import { 
  Check, Calendar, XCircle, AlertCircle, Bell, 
  FlaskConical, Clipboard, Microscope, Info, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Notification } from "@/types/database";

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60)    return 'Just now'
  if (seconds < 3600)  return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'appointment_confirmed': return { icon: Check, color: "bg-teal-100 text-teal-600" };
    case 'appointment_booked': return { icon: Calendar, color: "bg-blue-100 text-blue-600" };
    case 'appointment_cancelled': return { icon: XCircle, color: "bg-red-100 text-red-600" };
    case 'appointment_no_show': return { icon: AlertCircle, color: "bg-orange-100 text-orange-600" };
    case 'new_appointment_request': return { icon: Bell, color: "bg-purple-100 text-purple-600" };
    case 'lab_sample_date_set': return { icon: FlaskConical, color: "bg-teal-100 text-teal-600" };
    case 'lab_report_date_set': return { icon: Clipboard, color: "bg-[#0b1f3a]/10 text-[#0b1f3a]" };
    case 'new_lab_booking': return { icon: Microscope, color: "bg-blue-100 text-blue-600" };
    default: return { icon: Info, color: "bg-gray-100 text-gray-600" };
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch, isLoading } = useQuery({
    queryKey: ['notifications-all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as never).eq('id', id);
    refetch();
    // Also invalidate the navbar notifications
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('user_id', user!.id)
      .eq('is_read', false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    toast.success("All notifications marked as read");
  };

  const unreadList = notifications.filter(n => !n.is_read);

  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background page-fade">
        <Navbar />
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#0b1f3a] to-[#0f766e] text-white">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
            <div>
              <Skeleton className="h-5 w-24 mb-2 bg-white/20" />
              <Skeleton className="h-10 w-64 mb-1 bg-white/20" />
              <Skeleton className="h-5 w-48 bg-white/20" />
            </div>
            <Skeleton className="h-10 w-32 bg-white/20" />
          </div>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="grid gap-3 mt-14">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#0b1f3a] to-[#0f766e] text-white">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Stay Updated</p>
            <h1 className="mt-2 text-4xl font-bold flex items-center gap-3">
              Notifications
              {unreadList.length > 0 && (
                <span className="rounded-full bg-teal-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                  {unreadList.length} New
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Manage all your alerts and updates here.
            </p>
          </div>
          {unreadList.length > 0 && (
            <Button 
              variant="outline"
              onClick={markAllAsRead} 
              className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark all as read
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 flex-1">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadList.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">You have no notifications yet.</p>
              </div>
            ) : (
              <div className="grid gap-3 stagger" data-in="true" style={{ ["--stagger" as string]: "60ms" }}>
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} onClick={() => !n.is_read && markAsRead(n.id)} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="mt-6">
            {unreadList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-[#14b8a6]/40 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="grid gap-3 stagger" data-in="true" style={{ ["--stagger" as string]: "60ms" }}>
                {unreadList.map((n) => (
                  <NotificationRow key={n.id} notification={n} onClick={() => markAsRead(n.id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
      <Footer />
    </div>
  );
}

function NotificationRow({ notification, onClick }: { notification: Notification; onClick: () => void }) {
  const { icon: Icon, color } = getNotificationIcon(notification.type);
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "cursor-pointer hover-lift transition-all duration-300",
        !notification.is_read 
          ? "bg-teal-50 border-l-4 border-l-teal-500 hover:border-[#14b8a6]/50" 
          : "bg-white border-l-4 border-l-border hover:border-border/80 text-muted-foreground/80"
      )}
    >
      <CardContent className="flex items-center gap-4 p-4 md:p-5">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", color)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className={cn("text-base font-bold", !notification.is_read ? "text-[#0b1f3a]" : "text-muted-foreground")}>
              {notification.title}
            </h3>
            <span className="text-xs font-medium text-muted-foreground/70 shrink-0">
              {timeAgo(notification.created_at)}
            </span>
          </div>
          <p className={cn("text-sm", !notification.is_read ? "text-muted-foreground" : "text-muted-foreground/60")}>
            {notification.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
