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
  const limiteAtual = Math.max(1, limite);

  const skip =
    (paginaAtual - 1) * limiteAtual;

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

      take: limiteAtual,
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

      <DataTable
        columns={columns}
        data={lista}
        paginaAtual={paginaAtual}
        limitePorPagina={limiteAtual}
        totalItens={total}
        labelItemSingular="sala"
        labelItemPlural="salas"
      />
    </div>
  );
}