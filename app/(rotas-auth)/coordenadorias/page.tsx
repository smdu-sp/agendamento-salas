import DataTable from "@/components/data-table";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { columns } from "./_components/columns";
import ModalUpdateAndCreate from "./_components/modal-update-create";

interface CoordenadoriasPageProps {
  searchParams: Promise<{
    pagina?: string;
    limite?: string;
  }>;
}

export default async function CoordenadoriasPage({
  searchParams,
}: CoordenadoriasPageProps) {
  const session = await auth();

  const usuario = (session as any)?.usuario;

  const permissao = usuario?.permissao;

  if (!session) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14">
        <p>Você precisa estar autenticado.</p>
      </div>
    );
  }

  if (permissao !== "ADM" && permissao !== "DEV") {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14">
        <p>Somente administradores podem acessar esta página.</p>
      </div>
    );
  }

  const params = await searchParams;

  const pagina = Math.max(1, Number(params.pagina) || 1);

  const limite = Math.max(1, Number(params.limite) || 10);

  return (
    <Suspense fallback={null}>
      <CoordenadoriasContent pagina={pagina} limite={limite} />
    </Suspense>
  );
}

interface CoordenadoriasContentProps {
  pagina: number;
  limite: number;
}

async function CoordenadoriasContent({
  pagina,
  limite,
}: CoordenadoriasContentProps) {
  const skip = (pagina - 1) * limite;

  const [lista, total] = await Promise.all([
    prisma.coordenadoria.findMany({
      orderBy: {
        nome: "asc",
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
      },

      skip,

      take: limite,
    }),

    prisma.coordenadoria.count(),
  ]);

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold">Coordenadorias</h1>

      <p className="text-sm text-muted-foreground mt-1">
        Cadastre coordenadorias para vincular aos usuários e às reservas.
      </p>

      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 my-5 w-full">
        <DataTable
          columns={columns}
          data={lista}
          paginaAtual={pagina}
          limitePorPagina={limite}
          totalItens={total}
          labelItemSingular="coordenadoria"
          labelItemPlural="coordenadorias"
        />
      </div>

      <div className="absolute bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110">
        <ModalUpdateAndCreate isUpdating={false} />
      </div>
    </div>
  );
}
