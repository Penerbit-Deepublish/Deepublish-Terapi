"use client";

import { CalendarRange, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
  compact?: boolean;
  embedded?: boolean;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onReset,
  isLoading = false,
  compact = false,
  embedded = false,
}: DateRangeFilterProps) {
  const containerClass = embedded
    ? "rounded-xl border border-[#e5e9f4] bg-[#f8faff] p-3"
    : "rounded-2xl border border-[#dfe4f3] bg-white/90 p-4 shadow-sm";

  return (
    <div className={containerClass}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#185cab]">
        <CalendarRange className="h-4 w-4" />
        Filter Tanggal
      </div>

      <div className={`grid grid-cols-1 gap-3 ${compact ? "sm:grid-cols-[1fr_1fr_auto_auto]" : "md:grid-cols-[1fr_1fr_auto_auto]"}`}>
        <div className="space-y-1.5">
          <Label htmlFor="date-from" className="text-xs text-slate-600">Tanggal Mulai</Label>
          <Input
            id="date-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-to" className="text-xs text-slate-600">Tanggal Selesai</Label>
          <Input
            id="date-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
          />
        </div>

        <Button type="button" className="self-end" onClick={onApply} disabled={isLoading}>
          Terapkan
        </Button>

        <Button type="button" variant="outline" className="self-end" onClick={onReset} disabled={isLoading}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
