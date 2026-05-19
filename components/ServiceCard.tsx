import { ArrowRight, CalendarSearch, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function ServiceCards() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      
      <Link href="/reserva-salas">
        <div className="relative h-[180px] border rounded-xl p-5 cursor-pointer hover:shadow-md hover:bg-muted/50 transition-all">
          
          <div className="flex items-center gap-3">
            <CalendarSearch className="w-6 h-6" />
            <h2 className="font-medium">Reserva de Salas</h2>
          </div>

          <p className="text-sm mt-3 max-w-[80%]">
            Aqui você pode reservar salas para utilização ...
          </p>

          <ArrowRight
            className="absolute bottom-4 right-4 w-10 h-6"
            strokeWidth={1.5}
          />
        </div>
      </Link>

      <Link href="/avaliacao-limpeza">
        <div className="relative h-[180px] border rounded-xl p-5 cursor-pointer hover:shadow-md hover:bg-muted/50 transition-all">
          
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6" />
            <h2 className="font-medium">Avaliação de Limpeza</h2>
          </div>

          <p className="text-sm mt-3 max-w-[80%]">
            Aqui você pode avaliar a limpeza das salas e banheiros, etc...
          </p>

          <ArrowRight
            className="absolute bottom-4 right-4 w-10 h-6"
            strokeWidth={1.5}
          />
        </div>
      </Link>

    </section>
  );
}