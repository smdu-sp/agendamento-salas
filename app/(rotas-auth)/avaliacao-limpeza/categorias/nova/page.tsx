import Link from "next/link";

import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";

export default async function NovaCategoriaPage() {
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

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold">Nova categoria</h1>
      <p className="text-sm text-muted-foreground mt-1">
        A rota de criação está disponível. O formulário de cadastro pode ser conectado aqui.
      </p>

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Essa página foi criada para receber o formulário de cadastro de categorias.
        </p>

        <Button asChild variant="outline">
          <Link href="/avaliacao-limpeza/categorias">Voltar para categorias</Link>
        </Button>
      </div>
    </div>
  );
}