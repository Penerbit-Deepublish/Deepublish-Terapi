"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CalendarDays, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/manage-kuota", label: "Manage Kuota", icon: CalendarDays },
  { href: "/admin/riwayat", label: "Riwayat Peserta", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // If login page, don't show layout navigation
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-muted/20 flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <h1 className="font-bold text-lg text-primary">Admin Panel</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "w-full md:w-64 bg-card border-r border-border flex-col justify-between hidden md:flex",
        isMobileMenuOpen ? "flex" : ""
      )}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary mb-8 hidden md:block">Terapi Admin</h2>
          <nav className="space-y-2">
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
