"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  ListChecks,
  Receipt,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home, gradient: "stat-purple" },
  { name: "Household", href: "/dashboard/household", icon: Users, gradient: "stat-blue" },
  { name: "Tasks", href: "/dashboard/todos", icon: ListChecks, gradient: "stat-green" },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt, gradient: "stat-pink" },
  { name: "Shopping", href: "/dashboard/shopping", icon: ShoppingCart, gradient: "stat-orange" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-muted/30 bg-pattern">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out lg:translate-x-0",
          "bg-background/95 backdrop-blur-xl border-r",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl stat-purple flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Flatmates</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-muted group-hover:bg-background"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : ""
                  )} />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t p-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/settings"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            Settings
          </Link>

          {session?.user && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(session.user.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top nav */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-muted-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 ring-2 ring-muted">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getInitials(session.user.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
