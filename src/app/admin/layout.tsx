"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CalendarDays, LogOut, Menu, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LogoLight from "../2.png";
import LogoDark from "../3.png";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/manage-kuota", label: "Manage Kuota", icon: CalendarDays },
  { href: "/admin/riwayat", label: "Riwayat Peserta", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "",
    avatar: DEFAULT_ADMIN_AVATAR,
  });
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;

    const loadProfile = async () => {
      const res = await fetch("/api/admin/profile");
      const json = await res.json();
      if (!res.ok || !json.success) return;
      setProfile({
        name: json.data.name || "Admin",
        email: json.data.email || "",
        avatar: json.data.avatar || DEFAULT_ADMIN_AVATAR,
      });
    };
    void loadProfile();
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!avatarMenuRef.current) return;
      if (!avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsAvatarMenuOpen(false);
    setIsMobileMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // If login page, don't show layout navigation
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-muted/20 flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen lg:h-screen bg-muted/10 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image
            src={LogoLight}
            alt="Logo Terapi"
            width={32}
            height={32}
            priority
            className="block dark:hidden"
          />
          <Image
            src={LogoDark}
            alt="Logo Terapi"
            width={32}
            height={32}
            priority
            className="hidden dark:block"
          />
          <span className="font-bold text-lg text-primary">Admin Panel</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile/Tablet Backdrop */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
        "fixed top-0 left-0 z-50 h-screen w-[82%] max-w-xs bg-card border-r border-border flex flex-col justify-between transform transition-transform duration-300 ease-out lg:relative lg:w-64 lg:max-w-none lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 lg:shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
      >
        <div className="p-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8">
            <Image
              src={LogoLight}
              alt="Logo Terapi"
              width={40}
              height={40}
              priority
              className="block dark:hidden"
            />
            <Image
              src={LogoDark}
              alt="Logo Terapi"
              width={40}
              height={40}
              priority
              className="hidden dark:block"
            />
            <span className="text-xl font-bold text-primary">Terapi Admin</span>
          </Link>
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
          <div ref={avatarMenuRef} className="relative">
            <button
              type="button"
              className="w-full rounded-xl border border-border p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
            >
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover border border-border"
              />
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email || "Admin"}</p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isAvatarMenuOpen && "rotate-180")} />
            </button>
            {isAvatarMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-full rounded-xl border border-border bg-card shadow-lg p-1">
                <button
                  type="button"
                  className="w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 hover:bg-muted/50"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    setIsMobileMenuOpen(false);
                    router.push("/admin/profile");
                  }}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 text-red-500 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
