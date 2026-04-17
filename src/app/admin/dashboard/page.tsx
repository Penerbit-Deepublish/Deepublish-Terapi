"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Package, ShoppingCart, UsersRound, Activity } from "lucide-react";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  icon: ComponentType<{ className?: string }>;
};

const MAX_PER_SESI = 3;

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
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return start.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const loadDashboard = useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/dashboard?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.message || "Gagal memuat dashboard");
      setIsLoading(false);
      return;
    }
    setData(json.data);
    setError("");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    void loadDashboard(dateFrom, dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDashboard]);

  const applyFilter = async () => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      setError("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.");
      return;
    }
    setError("");
    await loadDashboard(dateFrom, dateTo);
  };

  const resetFilter = async () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const nextFrom = start.toISOString().slice(0, 10);
    const nextTo = now.toISOString().slice(0, 10);
    setDateFrom(nextFrom);
    setDateTo(nextTo);
    await loadDashboard(nextFrom, nextTo);
  };

  const dailyData = data?.charts.tren_reservasi_harian ?? [];
  const sesiData = data?.charts.penggunaan_kuota_per_sesi ?? [];
  const totalSesiAktif = sesiData.length;
  const totalBookingHariIni = sesiData.reduce((sum, item) => sum + item.terpakai, 0);
  const kuotaHarian = totalSesiAktif * MAX_PER_SESI;
  const sisaKuotaHariIni = Math.max(0, kuotaHarian - totalBookingHariIni);
  const okupansiSesiPersen = kuotaHarian > 0
    ? Math.round((totalBookingHariIni / kuotaHarian) * 100)
    : 0;

  const lastTwoDays = dailyData.slice(-2);
  const yesterdayCount = lastTwoDays[0]?.total ?? 0;
  const todayCount = lastTwoDays[1]?.total ?? 0;
  const growthPercent = yesterdayCount > 0
    ? (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)
    : todayCount > 0
      ? "100.0"
      : "0.0";

  const sessionColors = ["#185cab", "#3b82f6", "#6aa8e6", "#1f9f63", "#ef4444", "#f59e0b"] as const;
  const sessionStats = [...sesiData]
    .sort((a, b) => a.jam.localeCompare(b.jam))
    .map((item, idx) => {
      const terpakaiPerSesi = Math.min(item.terpakai, MAX_PER_SESI);
      const percent = Math.round((terpakaiPerSesi / MAX_PER_SESI) * 100);
      return {
        ...item,
        label: item.jam,
        terpakaiPerSesi,
        amount: `${terpakaiPerSesi}/${MAX_PER_SESI}`,
        percent,
        color: sessionColors[idx % sessionColors.length],
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
      note: "Total booking dari semua sesi aktif",
      delta: `+${okupansiSesiPersen}%`,
      icon: ShoppingCart,
    },
    {
      title: "Sisa Kuota Hari Ini",
      value: `${sisaKuotaHariIni.toLocaleString("id-ID")}`,
      note: "Sisa slot dari data sesi hari ini",
      delta: `+${Math.max(0, 100 - okupansiSesiPersen)}%`,
      icon: UsersRound,
    },
    {
      title: "Total Sesi Aktif",
      value: `${totalSesiAktif.toLocaleString("id-ID")}`,
      note: "Jumlah sesi dari chart penggunaan kuota",
      delta: "+0.0%",
      icon: Activity,
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {new Date(dateTo || new Date().toISOString().slice(0, 10)).toLocaleDateString("id-ID", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <DateRangeFilter
        from={dateFrom}
        to={dateTo}
        onFromChange={setDateFrom}
        onToChange={setDateTo}
        onApply={() => {
          void applyFilter();
        }}
        onReset={() => {
          void resetFilter();
        }}
        isLoading={isLoading}
      />

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
                            ? "rounded-full bg-[#1f9f63] px-2 py-1 text-[11px] font-semibold text-white"
                            : "rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-600"
                        }
                      >
                        {item.delta}
                      </span>
                    </div>
                    <p
                      className={
                        item.tone === "primary"
                          ? "text-sm font-semibold text-white/90"
                          : "text-sm font-semibold text-slate-700"
                      }
                    >
                      {item.title}
                    </p>
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
                  className="badge-neon-teal rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
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
                  className="badge-neon-teal rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Hari ini
                </button>
              </div>

              <div className="mb-5 rounded-2xl bg-[#f7f8fd] p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-slate-700">
                    Total booking {totalBookingHariIni.toLocaleString("id-ID")}
                  </p>
                  <span className="rounded-full bg-[#1f9f63] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Okupansi {okupansiSesiPersen}%
                  </span>
                </div>
                <div className="h-[185px]">
                  {isClient ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sessionStats}
                          dataKey="terpakaiPerSesi"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={74}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {sessionStats.map((item) => (
                            <Cell key={item.label} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}/${MAX_PER_SESI}`, "Terpakai"]}
                          labelFormatter={(label) => `Sesi ${label}`}
                        />
                        <text x="50%" y="48%" textAnchor="middle" className="fill-slate-900 text-[15px] font-bold">
                          {totalBookingHariIni}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" className="fill-slate-500 text-[10px]">
                          booking
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-md bg-muted/40" />
                  )}
                </div>
                <p className="mt-1 px-1 text-[11px] text-slate-500">
                  Sisa kuota {sisaKuotaHariIni.toLocaleString("id-ID")} dari total kapasitas sesi hari ini
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sessionStats.length > 0 ? sessionStats.map((item) => (
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
                  className="badge-neon-teal rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
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
