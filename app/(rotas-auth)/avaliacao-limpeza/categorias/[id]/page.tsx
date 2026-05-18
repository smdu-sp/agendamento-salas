import Link from "next/link";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

import CategoriaForm from "@/app/(rotas-auth)/avaliacao-limpeza/categorias/_components/categoria-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCategoriaPage({ params }: PageProps) {
  const { id } = await params;
  const categoriaId = Number(id);

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

  if (!Number.isFinite(categoriaId)) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14">
        <p>Categoria inválida.</p>
      </div>
    );
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    select: {
      id: true,
      nome: true,
      descricao: true,
      criterios: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!categoria) {
    return (
      <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
        <h1 className="text-xl md:text-4xl font-bold">Categoria não encontrada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Não foi possível localizar a categoria solicitada.
        </p>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/avaliacao-limpeza/categorias">Voltar para categorias</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold">Editar categoria</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Estrutura pronta para editar a categoria <span className="font-medium text-foreground">{categoria.nome}</span>.
      </p>

      <div className="mt-6 max-w-3xl rounded-xl border bg-card p-5 shadow-sm">
        <CategoriaForm categoria={categoria} criteriosCatalogo={categoria.criterios} />
      </div>
    </div>
  );
}