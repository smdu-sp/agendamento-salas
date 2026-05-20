'use client';

import DataTable from '@/components/data-table';
import { columns } from './columns';
import type { ReservaRow } from './columns';

/** Dados recebidos do servidor (datas podem vir como string após serialização). */
type ReservaInput = {
  id: string;
  salaNome: string;
  coordenadoriaNome: string | null;
  inicio: string | Date;
  fim: string | Date;
  titulo: string | null;
  layoutEscolhidoDescricao?: string | null;
  status: ReservaRow['status'];
};

function toRow(r: ReservaInput): ReservaRow {
  return {
    id: r.id,
    salaNome: r.salaNome,
    coordenadoriaNome: r.coordenadoriaNome,
    inicio: typeof r.inicio === 'string' ? r.inicio : r.inicio.toISOString(),
    fim: typeof r.fim === 'string' ? r.fim : r.fim.toISOString(),
    titulo: r.titulo,
    layoutEscolhidoDescricao: r.layoutEscolhidoDescricao ?? null,
    status: r.status,
  };
}

export function MinhasReservasTable({ reservas }: { reservas: ReservaInput[] }) {
  const rows = reservas.map(toRow);
  return <DataTable columns={columns} data={rows} />;
}
