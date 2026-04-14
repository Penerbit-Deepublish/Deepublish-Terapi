import { BookingForm } from "@/features/booking/BookingForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
            Terapi Bio Elektrik
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistem reservasi online untuk layanan terapi bio elektrik. Pilih jadwal, isi data diri, dan bersiap untuk kembali sehat.
          </p>
        </div>
        
        <BookingForm />
      </div>
    </main>
  );
}
