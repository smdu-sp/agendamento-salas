"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/utils";

export type CategoriaRow = {
  id: number;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  criterios: Array<{
    id: number;
    nome: string;
  }>;
};

export const columns: ColumnDef<CategoriaRow>[] = [
  {
    accessorKey: "nome",
    header: "Categoria",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-medium text-sm md:text-base truncate">{row.original.nome}</span>
        <span className="text-xs text-muted-foreground">ID {row.original.id}</span>
      </div>
    ),
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => {
      const descricao = row.original.descricao;

      if (!descricao) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="max-w-sm text-xs md:text-sm text-muted-foreground line-clamp-2">
          {descricao}
        </div>
      );
    },
  },
  {
    accessorKey: "criterios",
    header: "Critérios",
    cell: ({ row }) => {
      const criterios = row.original.criterios;

      if (criterios.length === 0) {
        return <span className="text-muted-foreground">Sem critérios</span>;
      }

      const criteriosVisiveis = criterios.slice(0, 3);
      const criteriosRestantes = criterios.length - criteriosVisiveis.length;

      return (
        <div className="flex flex-wrap gap-1.5 max-w-[28rem]">
          {criteriosVisiveis.map((criterio) => (
            <Badge key={criterio.id} variant="outline" className="normal-case text-[11px] md:text-xs">
              {criterio.nome}
            </Badge>
          ))}
          {criteriosRestantes > 0 && (
            <Badge variant="secondary" className="normal-case text-[11px] md:text-xs">
              +{criteriosRestantes}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "criadoEm",
    header: "Criado em",
    cell: ({ row }) => (
      <div className="text-xs md:text-sm whitespace-nowrap">
        {formatarData(new Date(row.original.criadoEm))}
      </div>
    ),
  },
  {
    id: "acoes",
    header: "Ações",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link href={`/avaliacao-limpeza/categorias/${row.original.id}`}>
            <PencilLine className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>
    ),
  },
];