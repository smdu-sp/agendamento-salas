import { auth } from "@/lib/auth/auth";
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

  return <CategoriaForm />;
}