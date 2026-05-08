import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

import { CategoriasTable } from "./_components/categorias-table";

export default async function Categorias() {
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

  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      descricao: true,
      criadoEm: true,
      criterios: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  const categoriasSerializadas = categorias.map((categoria) => ({
    ...categoria,
    criadoEm: categoria.criadoEm.toISOString(),
  }));

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Button asChild className="w-full md:w-auto">
          <Link href="/avaliacao-limpeza/categorias/nova">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Link>
        </Button>
      </div>

      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 my-5 w-full">
        <CategoriasTable categorias={categoriasSerializadas} />
      </div>
    </div>
  );
}