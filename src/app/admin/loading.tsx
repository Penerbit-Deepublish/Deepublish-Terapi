export default function AdminLoading() {
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
          <div className="h-[300px] rounded-2xl bg-slate-200" />
        </div>
        <div className="space-y-5">
          <div className="h-[300px] rounded-2xl bg-slate-200" />
          <div className="h-[240px] rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
