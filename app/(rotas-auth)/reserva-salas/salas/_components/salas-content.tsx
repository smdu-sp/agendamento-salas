import DataTable from "@/components/data-table";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { ActionButton } from "@/components/action-button";
import { Plus } from "lucide-react";

interface SalasContentProps {
  pagina?: number;
  limite?: number;
}

export async function SalasContent({
  pagina = 1,
  limite = 10,
}: SalasContentProps) {
  const paginaAtual = Math.max(1, pagina);

  const limitePorPagina = limite;

  const skip =
    (paginaAtual - 1) * limitePorPagina;

  const [lista, total] = await Promise.all([
    prisma.salaReserva.findMany({
      orderBy: {
        nome: "asc",
      },

      select: {
        id: true,
        nome: true,
        andar: true,
        numero: true,
        lotacao: true,
        layout: true,
        ativo: true,

        layoutFotos: true,
        mobiliarios: true,
        midias: true,
      },

      skip,
      take: limitePorPagina,
    }),

    prisma.salaReserva.count(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-center">
        <ActionButton
          title="Criar Sala"
          description="Adicione uma nova sala ao sistema"
          href="/reserva-salas/salas/nova"
          icon={Plus}
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        <DataTable
          columns={columns}
          data={lista}
          paginaAtual={paginaAtual}
          limitePorPagina={
            limitePorPagina
          }
          totalItens={total}
          labelItemSingular="sala"
          labelItemPlural="salas"
        />
      </div>
    </div>
  );
}