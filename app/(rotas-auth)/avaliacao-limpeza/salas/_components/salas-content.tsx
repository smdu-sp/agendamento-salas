import DataTable from "@/components/data-table";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { ActionButton } from "@/components/action-button";
import { Plus } from "lucide-react";

const LIMITE_SALAS = 10;

interface SalasContentProps {
  pagina?: number;
}

export async function SalasContent({
  pagina = 1,
}: SalasContentProps) {
  const paginaAtual = Math.max(1, pagina);

  const skip =
    (paginaAtual - 1) * LIMITE_SALAS;

  const [lista, total] = await Promise.all([
    prisma.salaAvaliacaoLimpeza.findMany({
      orderBy: {
        nome: "asc",
      },

      select: {
        id: true,
        nome: true,
      },

      skip,
      take: LIMITE_SALAS,
    }),

    prisma.salaAvaliacaoLimpeza.count(),
  ]);

  

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-center">
        <ActionButton
          title="Criar Sala"
          description="Adicione uma nova sala"
          href="/avaliacao-limpeza/salas/nova"
          icon={Plus}
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        <DataTable
          columns={columns}
          data={lista}
          totalItens={total}
          labelItemSingular="sala"
          labelItemPlural="salas"
          enableSearch
          searchField="nome"
          searchPlaceholder="Buscar sala por nome..."
        />
      </div>
    </div>
  );
}