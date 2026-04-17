"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
  Menu,
  User,
  ChevronDown,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LogoLight from "../2.png";
import LogoDark from "../3.png";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Menu" },
  { href: "/admin/riwayat", label: "Riwayat Peserta", icon: Users, group: "Menu" },
  { href: "/admin/manage-jadwal", label: "Manage Jadwal", icon: CalendarDays, group: "Management" },
  { href: "/admin/manage-kuota", label: "Manage Kuota", icon: CalendarDays, group: "Management" },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "DASHBOARD",
  "/admin/riwayat": "RIWAYAT PESERTA",
  "/admin/manage-jadwal": "MANAGE JADWAL",
  "/admin/manage-kuota": "MANAGE KUOTA",
  "/admin/profile": "PROFILE ADMIN",
  "/admin/data-pengguna": "DATA PENGGUNA",
};

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
  const desktopAvatarMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileAvatarMenuRef = useRef<HTMLDivElement | null>(null);

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
      const target = event.target as Node;
      const clickedDesktop = desktopAvatarMenuRef.current?.contains(target);
      const clickedMobile = mobileAvatarMenuRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

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
  const pageTitle = PAGE_TITLES[pathname] ?? "ADMIN PANEL";

  const groupedLinks = ADMIN_LINKS.reduce<Record<string, typeof ADMIN_LINKS>>((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#dfe2eb]">
      <div className="flex min-h-screen w-full flex-col bg-[#f2f4fb] lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 border-b border-[#dde2f2] sticky top-0 z-50 w-full">
        <p className="text-sm font-bold tracking-[0.06em] text-[#185cab]">{pageTitle}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div ref={mobileAvatarMenuRef} className="relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
              onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
            >
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            </button>
            {isAvatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
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
        "fixed top-0 left-0 z-50 h-screen w-[82%] max-w-xs overflow-y-auto border-r border-[#e5e8f2] bg-white/90 backdrop-blur-md flex flex-col justify-between transform transition-transform duration-300 ease-out lg:relative lg:inset-auto lg:z-auto lg:h-auto lg:w-[260px] lg:max-w-none lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:p-3 lg:shrink-0 xl:w-[300px]",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
      >
        <div className="h-full p-5 lg:rounded-3xl lg:border lg:border-[#e2e6f2] lg:bg-white lg:p-6 lg:shadow-[0_10px_32px_rgba(67,89,148,0.08)]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-8">
            <Image
              src={LogoLight}
              alt="Logo Terapi"
              width={36}
              height={36}
              priority
              className="block dark:hidden"
            />
            <Image
              src={LogoDark}
              alt="Logo Terapi"
              width={36}
              height={36}
              priority
              className="hidden dark:block"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Terapi Desk</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </Link>
          {Object.entries(groupedLinks).map(([group, links]) => (
            <div key={group} className="mb-6">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group}
              </p>
              <nav className="mt-2 space-y-1.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-[#185cab] to-[#2f7ed6] text-white shadow-[0_0_0_1px_rgba(24,92,171,0.45),0_0_22px_rgba(24,92,171,0.48),0_10px_20px_rgba(24,92,171,0.34)]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-[#0f2650] bg-gradient-to-br from-[#091126] via-[#0b1835] to-[#10254f] p-4 text-white shadow-[0_12px_28px_rgba(8,19,44,0.45)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Sparkles className="h-4.5 w-4.5 text-[#9bc7ff]" />
            </div>
            <p className="text-sm font-semibold leading-5">Ada Kendala? Hubungi Tim PDSI</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-300">
              Tim kami siap membantu kendala penggunaan sistem admin.
            </p>
            <a
              href="https://wa.me/62882005874521"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#185cab] to-[#2f7ed6] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(24,92,171,0.45)] transition-all hover:-translate-y-0.5 hover:from-[#124c93] hover:to-[#276cb8]"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
        <div className="mb-4 hidden items-center justify-between sm:mb-6 lg:flex">
          <h1 className="text-2xl font-bold tracking-[0.08em] text-[#185cab]">{pageTitle}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div ref={desktopAvatarMenuRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white py-1 pr-2 pl-1 shadow-sm"
                onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
              >
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <div className="hidden text-left lg:block">
                  <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800">{profile.name}</p>
                  <p className="max-w-[130px] truncate text-[10px] text-slate-500">{profile.email || "Admin"}</p>
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", isAvatarMenuOpen && "rotate-180")} />
              </button>
              {isAvatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
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
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {children}
      </main>
      </div>
    </div>
  );
}
