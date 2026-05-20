"use client";

import { useState } from "react";
import type { CoordenadoriaOption, SalaOption } from "../services/reservas";
import { AgendaSala } from "./agenda-sala";
import { FormNovaReserva } from "./form-nova-reserva";

export function NovaReservaLayout({
  salas,
  coordenadorias,
  coordenadoriaIdPadrao,
  isAdmin = false,
  usuarioNome,
  usuarioEmail,
}: {
  salas: SalaOption[];
  coordenadorias: CoordenadoriaOption[];
  coordenadoriaIdPadrao: string;
  isAdmin?: boolean;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;
}) {
  const [salaId, setSalaId] = useState("");
  const [data, setData] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const salaNome =
    salas.find((s) => s.id === salaId)?.nome ?? "Selecione uma sala";

  return (
    <div className="min-w-0">
      <FormNovaReserva
        salas={salas}
        coordenadorias={coordenadorias}
        coordenadoriaIdPadrao={coordenadoriaIdPadrao}
        valueSalaId={salaId}
        valueData={data}
        onSalaChange={setSalaId}
        onDataChange={setData}
        usuarioNome={usuarioNome}
        usuarioEmail={usuarioEmail}
        agendaSlot={
          <AgendaSala
            salaId={salaId || null}
            data={data || null}
            salaNome={salaNome}
            isAdmin={isAdmin}
          />
        }
      />
    </div>
  );
}
