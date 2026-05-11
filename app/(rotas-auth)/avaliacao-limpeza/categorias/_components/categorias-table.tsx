"use client";

import { useMemo, useState } from "react";

import DataTable from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { columns, type CategoriaRow } from "./columns";

type CategoriasTableProps = {
  categorias: CategoriaRow[];
};

export function CategoriasTable({ categorias }: CategoriasTableProps) {
  const [busca, setBusca] = useState("");

  const categoriasFiltradas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return categorias.filter((categoria) => {
      if (!termoBusca) {
        return true;
      }

      const nomeCoincide = categoria.nome.toLowerCase().includes(termoBusca);
      const criterioCoincide = categoria.criterios.some((criterio) =>
        criterio.nome.toLowerCase().includes(termoBusca),
      );

      return nomeCoincide || criterioCoincide;
    });
  }, [busca, categorias]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/70 p-4 md:p-5 shadow-sm">
        <div className="space-y-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Buscar por categoria ou critério</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Ex.: Banheiros, limpeza, organização, higiene"
                className="pl-9"
              />
            </div>
          </label>
        </div>

        <p className="mt-3 text-xs md:text-sm text-muted-foreground">
          {categoriasFiltradas.length} {categoriasFiltradas.length === 1 ? "categoria encontrada" : "categorias encontradas"}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={categoriasFiltradas}
        labelItemSingular="categoria"
        labelItemPlural="categorias"
      />
    </div>
  );
}