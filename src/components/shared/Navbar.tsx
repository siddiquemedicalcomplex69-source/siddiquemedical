import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, Stethoscope, LogOut, User as UserIcon, CalendarCheck, Phone, FlaskConical, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { getGlobalSettings } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { AnnouncementTicker } from "./AnnouncementTicker";
import { supabase } from "@/lib/supabase";
import { Notification } from "@/types/database";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/doctors", label: "Find a Doctor" },
  { to: "/lab-tests", label: "Lab Tests" },
] as const;

export function Navbar() {
  const { user, signOut, ready } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  const { data: settings } = useQuery({
    queryKey: ["globalSettings"],
    queryFn: getGlobalSettings,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <>
      {settings?.banner_enabled && settings.banner_text && (
        <AnnouncementTicker text={settings.banner_text} />
      )}
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300",
          scrolled
            ? "border-border/60 bg-white/85 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(11,31,58,0.15)]"
            : "border-transparent bg-white/70 backdrop-blur",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl items-center justify-between px-4 transition-all duration-300",
            scrolled ? "h-14" : "h-[72px]",
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0b1f3a] to-[#14b8a6] text-white shadow-md transition-transform duration-300 group-hover:rotate-6">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-[#0b1f3a]">
                {settings?.hospital_name || "Siddique Medical Complex"}
              </span>
              <span className="text-[11px] text-muted-foreground">Expert care, easy booking</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                data-active={isActive(n.to) ? "true" : "false"}
                className="link-underline text-sm font-medium text-[#0b1f3a]/80 hover:text-[#0b1f3a]"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={`tel:${settings?.contact_number || "+924212345678"}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#0b1f3a] hover:text-[#14b8a6] transition-colors"
            >
              <Phone className="h-4 w-4" />
              {settings?.contact_number || "042-1234-5678"}
            </a>
            {ready && !user && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-[#14b8a6] hover:bg-[#0d9488] text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                  onClick={() => navigate("/doctors")}
                >
                  Book Appointment
                </Button>
              </>
            )}
            {ready && user && (
              <>
                {user.role === 'patient' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/appointments")}>
                    <CalendarCheck className="mr-1.5 h-4 w-4" />
                    My Appointments
                  </Button>
                )}
                {user.role === 'doctor' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/schedule")}>
                    <CalendarCheck className="mr-1.5 h-4 w-4" />
                    My Schedule
                  </Button>
                )}
                {user.role === 'admin' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
                    <CalendarCheck className="mr-1.5 h-4 w-4" />
                    Admin Dashboard
                  </Button>
                )}
                {user.role === 'lab_staff' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/lab/portal")}>
                    <FlaskConical className="mr-1.5 h-4 w-4" />
                    Lab Portal
                  </Button>
                )}
                
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserIcon className="h-4 w-4" />
                      {user.full_name.split(" ")[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" /> My Profile
                    </DropdownMenuItem>
                    {user.role === 'patient' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/appointments")}>
                          <CalendarCheck className="mr-2 h-4 w-4" /> Appointments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/my-tests")}>
                          <FlaskConical className="mr-2 h-4 w-4" /> My Lab Tests
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/notifications")}>
                          <Bell className="mr-2 h-4 w-4" /> Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'doctor' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/schedule")}>
                          <CalendarCheck className="mr-2 h-4 w-4" /> My Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/availability")}>
                          <CalendarCheck className="mr-2 h-4 w-4" /> Availability
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/notifications")}>
                          <Bell className="mr-2 h-4 w-4" /> Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                          <CalendarCheck className="mr-2 h-4 w-4" /> Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/admin/tests")}>
                          <FlaskConical className="mr-2 h-4 w-4" /> Manage Lab Tests
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/notifications")}>
                          <Bell className="mr-2 h-4 w-4" /> Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'lab_staff' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/lab/portal")}>
                          <FlaskConical className="mr-2 h-4 w-4" /> Lab Portal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/notifications")}>
                          <Bell className="mr-2 h-4 w-4" /> Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => { signOut(); navigate("/"); }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {ready && user && <NotificationBell />}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                {ready && !user && (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent">Login</Link>
                    <Link to="/register" onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent">Create account</Link>
                  </>
                )}
                {ready && user && (
                  <>
                    <Link to="/profile" onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent">My Profile</Link>
                    {user.role === 'patient' && (
                      <>
                        <Link to="/appointments" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">My Appointments</Link>
                        <Link to="/my-tests" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">My Lab Tests</Link>
                      </>
                    )}
                    {user.role === 'doctor' && (
                      <>
                        <Link to="/schedule" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">My Schedule</Link>
                        <Link to="/availability" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">Availability</Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin/dashboard" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">Admin Dashboard</Link>
                        <Link to="/admin/tests" onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm hover:bg-accent">Manage Lab Tests</Link>
                      </>
                    )}
                    {user.role === 'lab_staff' && (
                      <Link to="/lab/portal" onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2 text-sm hover:bg-accent">Lab Portal</Link>
                    )}
                    <button
                      onClick={() => { setOpen(false); signOut(); navigate("/"); }}
                      className="rounded-md px-3 py-2 text-left text-sm hover:bg-accent text-destructive"
                    >Sign out</button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as never).eq('id', id);
    refetchNotifications();
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('notifications').update({ is_read: true } as never).eq('user_id', user!.id).eq('is_read', false);
    refetchNotifications();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-bold text-[#0b1f3a]">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488]">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={cn(
                    "cursor-pointer px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.is_read ? "bg-teal-50/50" : ""
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn("text-sm font-semibold", !n.is_read ? "text-[#0b1f3a]" : "text-muted-foreground")}>{n.title}</span>
                    <span className="text-[10px] text-muted-foreground/70 shrink-0 ml-2">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className={cn("text-xs line-clamp-2", !n.is_read ? "text-muted-foreground" : "text-muted-foreground/60")}>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488]" onClick={() => { setOpen(false); navigate("/notifications"); }}>
            View all notifications →
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
