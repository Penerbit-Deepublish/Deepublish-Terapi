"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Package, ShoppingCart, UsersRound, Activity } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardResponse {
  stats: {
    total_peserta_bulan_ini: number;
    sisa_kuota_hari_ini: number;
    total_sesi_hari_ini: number;
  };
  charts: {
    tren_reservasi_harian: Array<{ tanggal: string; total: number }>;
    penggunaan_kuota_per_sesi: Array<{ jam: string; terpakai: number; sisa: number }>;
  };
}

type MetricCard = {
  title: string;
  value: string;
  note: string;
  delta: string;
  tone?: "primary" | "plain";
  icon: (props: { className?: string }) => JSX.Element;
};

function RingLayer({ size, value, color }: { size: number; value: number; color: string }) {
  return (
    <div
      className="absolute inset-0 m-auto rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${value}%, #d9deee 0%)`,
      }}
    >
      <div
        className="absolute inset-0 m-auto rounded-full bg-[#f4f6fd]"
        style={{ width: size - 16, height: size - 16 }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-44 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="h-[340px] rounded-2xl bg-slate-200" />
        </div>
        <div className="space-y-5">
          <div className="h-[470px] rounded-2xl bg-slate-200" />
          <div className="h-[295px] rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    const load = async () => {
      setIsLoading(true);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat dashboard");
        setIsLoading(false);
        return;
      }
      setData(json.data);
      setError("");
      setIsLoading(false);
    };

    void load();
  }, []);

  const dailyData = data?.charts.tren_reservasi_harian ?? [];
  const sesiData = data?.charts.penggunaan_kuota_per_sesi ?? [];
  const totalBookingHariIni = sesiData.reduce((sum, item) => sum + item.terpakai, 0);
  const totalSisaPerSesi = sesiData.reduce((sum, item) => sum + item.sisa, 0);

  const lastTwoDays = dailyData.slice(-2);
  const yesterdayCount = lastTwoDays[0]?.total ?? 0;
  const todayCount = lastTwoDays[1]?.total ?? 0;
  const growthPercent = yesterdayCount > 0
    ? (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)
    : todayCount > 0
      ? "100.0"
      : "0.0";

  const topSessions = [...sesiData]
    .sort((a, b) => b.terpakai - a.terpakai)
    .slice(0, 3)
    .map((item, idx) => {
      const colors = ["#185cab", "#3b82f6", "#6aa8e6"] as const;
      const percent = totalBookingHariIni > 0 ? Math.round((item.terpakai / totalBookingHariIni) * 100) : 0;
      return {
        ...item,
        label: item.jam,
        amount: `${item.terpakai}/${item.terpakai + item.sisa}`,
        percent,
        color: colors[idx] ?? colors[2],
      };
    });

  const bubbleData = dailyData.slice(-4);

  const metrics: MetricCard[] = [
    {
      title: "Peserta Bulan Ini",
      value: `${(data?.stats.total_peserta_bulan_ini ?? 0).toLocaleString("id-ID")}`,
      note: "Total data peserta bulan berjalan",
      delta: `${Number(growthPercent) >= 0 ? "+" : ""}${growthPercent}%`,
      tone: "primary",
      icon: Package,
    },
    {
      title: "Booking Hari Ini",
      value: `${totalBookingHariIni.toLocaleString("id-ID")}`,
      note: "Total booking dari semua sesi hari ini",
      delta: `${Number(growthPercent) >= 0 ? "+" : ""}${growthPercent}%`,
      icon: ShoppingCart,
    },
    {
      title: "Sisa Kuota Hari Ini",
      value: `${(data?.stats.sisa_kuota_hari_ini ?? totalSisaPerSesi).toLocaleString("id-ID")}`,
      note: "Kuota tersisa yang masih bisa dibooking",
      delta: "+0.0%",
      icon: UsersRound,
    },
    {
      title: "Total Sesi Aktif",
      value: `${(data?.stats.total_sesi_hari_ini ?? 0).toLocaleString("id-ID")}`,
      note: "Jumlah sesi yang tersedia hari ini",
      delta: "+0.0%",
      icon: Activity,
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">DASHBOARD</h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {metrics.map((item, idx) => {
              const Icon = item.icon;
              const positive = item.delta.startsWith("+");
              return (
                <Card
                  key={item.title}
                  className={
                    item.tone === "primary"
                      ? "overflow-hidden border-0 bg-gradient-to-br from-[#185cab] via-[#2a6db8] to-[#3a7dcb] text-white shadow-[0_20px_36px_rgba(24,92,171,0.38)]"
                      : "border border-[#e5e9f4] bg-white shadow-sm"
                  }
                >
                  <CardContent className="p-5">
                    <div className="mb-6 flex items-center justify-between">
                      <div
                        className={
                          item.tone === "primary"
                            ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
                            : "flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
                        }
                      >
                        <Icon className={item.tone === "primary" ? "h-4.5 w-4.5" : "h-4.5 w-4.5 text-slate-600"} />
                      </div>
                      <span
                        className={
                          positive
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                            : "rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-600"
                        }
                      >
                        {item.delta}
                      </span>
                    </div>
                    <p className={item.tone === "primary" ? "text-xs text-white/80" : "text-xs text-slate-500"}>{item.title}</p>
                    <p className={item.tone === "primary" ? "mt-1 text-3xl font-bold" : "mt-1 text-3xl font-bold text-slate-900"}>
                      {item.value}
                    </p>
                    <p className={item.tone === "primary" ? "mt-1 text-xs text-white/80" : "mt-1 text-xs text-slate-500"}>{item.note}</p>
                    {idx === 0 && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.25),transparent_45%)]" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border border-[#e5e9f4] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Tren Reservasi Harian</h3>
                  <p className="text-sm text-slate-500">Data real reservasi 7 hari terakhir</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#e6e9f5] bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  7 hari
                </button>
              </div>
              <div className="h-[260px]">
                {isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} barGap={8}>
                      <CartesianGrid stroke="#eef1f8" vertical={false} />
                      <XAxis dataKey="tanggal" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#185cab" radius={[8, 8, 8, 8]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-md bg-muted/40" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-[#e5e9f4] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Statistik Sesi Hari Ini</h3>
                  <p className="text-sm text-slate-500">Distribusi booking per sesi (real-time)</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#e6e9f5] bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  Hari ini
                </button>
              </div>

              <div className="mx-auto mb-6 flex h-[235px] w-full max-w-[235px] items-center justify-center">
                <div className="relative h-[220px] w-[220px]">
                  <RingLayer size={220} value={topSessions[0]?.percent ?? 0} color={topSessions[0]?.color ?? "#185cab"} />
                  <RingLayer size={174} value={topSessions[1]?.percent ?? 0} color={topSessions[1]?.color ?? "#3b82f6"} />
                  <RingLayer size={128} value={topSessions[2]?.percent ?? 0} color={topSessions[2]?.color ?? "#6aa8e6"} />
                  <div className="absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                    <p className="text-3xl font-bold text-slate-900">{totalBookingHariIni.toLocaleString("id-ID")}</p>
                    <p className="text-[11px] text-slate-500">Booking Masuk</p>
                    <span className="mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {`${Number(growthPercent) >= 0 ? "+" : ""}${growthPercent}%`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {topSessions.length > 0 ? topSessions.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-[#f7f8fd] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.amount}</p>
                      <span className="rounded-full bg-[#dff0ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#185cab]">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Belum ada booking hari ini.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#e5e9f4] bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Pertumbuhan Reservasi</h3>
                  <p className="text-sm text-slate-500">Pergerakan reservasi harian terbaru</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#e6e9f5] bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  Real data
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <div className="relative h-40 overflow-hidden rounded-2xl bg-[#f6f7fd] p-3">
                  {bubbleData.length > 0 ? bubbleData.map((item, idx) => (
                    <div
                      key={item.tanggal}
                      className="absolute flex items-center justify-center rounded-full text-xs font-semibold text-white shadow-lg"
                      style={{
                        width: `${52 + idx * 8}px`,
                        height: `${52 + idx * 8}px`,
                        left: `${8 + idx * 34}px`,
                        top: `${12 + ((idx + 1) % 2) * 36}px`,
                        background: idx % 2 === 0 ? "#185cab" : "#3f87d8",
                      }}
                    >
                      {item.total}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">Belum ada data reservasi.</p>
                  )}
                </div>

                <div className="space-y-3 pr-1">
                  {bubbleData.slice().reverse().map((item) => (
                    <div key={item.tanggal} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#185cab]" />
                      <span>{item.tanggal}</span>
                      <span className="ml-auto font-semibold">{item.total}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
