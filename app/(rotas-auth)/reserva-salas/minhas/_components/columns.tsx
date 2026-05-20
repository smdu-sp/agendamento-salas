'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cancelarReserva } from '../../actions';

export type ReservaRow = {
  id: string;
  salaNome: string;
  coordenadoriaNome: string | null;
  inicio: string;
  fim: string;
  titulo: string | null;
  layoutEscolhidoDescricao: string | null;
  status: 'SOLICITADO' | 'APROVADO' | 'CANCELADO';
};

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatarHorario(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BadgeStatus({ status }: { status: ReservaRow['status'] }) {
  if (status === 'SOLICITADO') {
    return (
      <Badge variant="secondary" className="font-normal">
        Aguardando aprovação
      </Badge>
    );
  }
  if (status === 'APROVADO') {
    return (
      <Badge variant="default" className="font-normal">
        Aprovada
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function CelulaCancelar({ reservaId }: { reservaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCancelar() {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return;
    setErro(null);
    setLoading(true);
    const result = await cancelarReserva(reservaId);
    setLoading(false);
    if (result.erro) setErro(result.erro);
    else router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {erro && <span className="text-sm text-destructive">{erro}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCancelar}
        disabled={loading}
      >
        {loading ? 'Cancelando...' : 'Cancelar'}
      </Button>
    </div>
  );
}

export const columns: ColumnDef<ReservaRow>[] = [
  {
    accessorKey: 'salaNome',
    header: 'Sala',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <BadgeStatus status={row.original.status} />,
  },
  {
    accessorKey: 'inicio',
    header: 'Data',
    cell: ({ row }) => formatarData(row.original.inicio),
  },
  {
    accessorKey: 'inicio',
    id: 'horario',
    header: 'Horário',
    cell: ({ row }) =>
      `${formatarHorario(row.original.inicio)} – ${formatarHorario(row.original.fim)}`,
  },
  {
    accessorKey: 'coordenadoriaNome',
    header: 'Coordenadoria',
    cell: ({ row }) => row.original.coordenadoriaNome ?? '—',
  },
  {
    accessorKey: 'titulo',
    header: 'Título',
    cell: ({ row }) => row.original.titulo ?? '—',
  },
  {
    accessorKey: 'layoutEscolhidoDescricao',
    id: 'layout',
    header: 'Layout',
    cell: ({ row }) => row.original.layoutEscolhidoDescricao ?? '—',
  },
  {
    accessorKey: 'id',
    id: 'acoes',
    header: () => <p className="text-center">Ações</p>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <CelulaCancelar reservaId={row.original.id} />
      </div>
    ),
  },
];
