"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    const load = async () => {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat dashboard");
        return;
      }
      setData(json.data);
    };

    void load();
  }, []);

  const dailyData = data?.charts.tren_reservasi_harian ?? [];
  const sesiData = data?.charts.penggunaan_kuota_per_sesi ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Pantau statistik reservasi Terapi Bio Elektrik Anda hari ini.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-full text-blue-600">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Peserta (Bulan ini)</p>
              <h2 className="text-3xl font-bold">{data?.stats.total_peserta_bulan_ini ?? 0}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-600 rounded-full text-white">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sisa Kuota Hari Ini</p>
              <h2 className="text-3xl font-bold">{data?.stats.sisa_kuota_hari_ini ?? 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-full text-amber-600">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sesi Hari Ini</p>
              <h2 className="text-3xl font-bold">{data?.stats.total_sesi_hari_ini ?? 0}</h2>
            </div>
          </CardContent>
        </Card>
      </div>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tren Reservasi Harian</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tanggal" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#165cab" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-md bg-muted/40" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penggunaan Kuota per Sesi (Hari Ini)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sesiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jam" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="terpakai" stackId="a" fill="#165cab" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="sisa" stackId="a" fill="#3ab5ad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-md bg-muted/40" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
