import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import CategoriaForm from "@/app/(rotas-auth)/avaliacao-limpeza/categorias/_components/categoria-form";

export default async function NovaCategoriaPage() {
  const session = await auth();
  const usuario = (session as any)?.usuario;
  const permissao = usuario?.permissao;

  if (!session) {
    redirect("/login");
  }

  if (permissao !== "ADM" && permissao !== "DEV") {
    redirect("/avaliacao-limpeza/categorias");
  }

  const criteriosCatalogo = await prisma.criterio.findMany({
    orderBy: { nome: "asc" },
    select: { nome: true },
  });

  return <CategoriaForm criteriosCatalogo={criteriosCatalogo} />;
}