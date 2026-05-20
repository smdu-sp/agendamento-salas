'use client';

import Link from "next/link";

export function ReservasContent() {
  return (
    <div className="flex flex-col gap-3 my-5 w-full">
      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/reserva-salas/nova">
          <div className="border border-border rounded-lg p-4 hover:shadow-md cursor-pointer bg-card">
            <h2 className="font-medium">Nova Reserva</h2>
            <p className="text-sm text-muted-foreground">
              Agende uma nova sala de reunião.
            </p>
          </div>
        </Link>

        <Link href="/reservas/minhas">
          <div className="border border-border rounded-lg p-4 hover:shadow-md cursor-pointer bg-card">
            <h2 className="font-medium">Minhas Reservas</h2>
            <p className="text-sm text-muted-foreground">
              Consulte e gerencie suas reservas futuras.
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}

export function AgendaContent() {
  return (
    <div className="flex flex-col gap-3 my-5 w-full">
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum conteúdo disponível</p>
      </div>
    </div>
  );
}