import Image from "next/image";
import LogoLight from "@/app/2.png";
import LogoDark from "@/app/3.png";
import { MapPin, Phone, Mail, Clock, HeartPulse } from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: MapPin,
    label: "Alamat",
    value: "Jl. Wonosari Km. 6, Depok, Yogyakarta",
    href: "https://maps.google.com",
  },
  {
    icon: Phone,
    label: "Telepon",
    value: "+62 274 XXX XXX",
    href: "tel:+62274xxxxxx",
  },
  {
    icon: Mail,
    label: "Email",
    value: "terapi@deepublish.co.id",
    href: "mailto:terapi@deepublish.co.id",
  },
  {
    icon: Clock,
    label: "Jam Operasional",
    value: "Senin – Jumat, 09.00 – 16.00 WIB",
    href: null,
  },
];

const QUICK_LINKS = [
  { label: "Reservasi", href: "#form-reservasi" },
  { label: "Admin Login", href: "/admin/login" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-border bg-card">
      {/* ── Top accent line (gradient) ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#165cab]/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">

          {/* ── Brand Column ── */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src={LogoLight}
                  alt="Logo Terapi Bio Elektrik Deepublish"
                  width={40}
                  height={40}
                  className="object-contain block dark:hidden"
                />
                <Image
                  src={LogoDark}
                  alt="Logo Terapi Bio Elektrik Deepublish"
                  width={40}
                  height={40}
                  className="object-contain hidden dark:block"
                />
              </div>
              <div>
                <p className="font-bold text-primary leading-tight">Terapi Bio Elektrik</p>
                <p className="text-xs text-muted-foreground">Deepublish</p>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#165cab]/10 border border-[#165cab]/20">
              <HeartPulse className="w-3.5 h-3.5 text-[#165cab]" />
              <span className="text-xs font-medium text-[#165cab]">Layanan Kesehatan Terpercaya</span>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Navigasi
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#3ab5ad] group-hover:scale-150 transition-transform duration-200" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact Info ── */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              Kontak
            </h3>
            <ul className="space-y-4">
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-start gap-3 group">
                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[#165cab]/10 flex items-center justify-center group-hover:bg-[#165cab]/20 transition-colors duration-200">
                      <Icon className="w-3.5 h-3.5 text-[#165cab]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {currentYear} Terapi Bio Elektrik Deepublish. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Dibuat dengan <span className="text-[#165cab]">♥</span> oleh Tim Deepublish
          </p>
        </div>
      </div>
    </footer>
  );
}
