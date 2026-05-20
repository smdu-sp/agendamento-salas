import { auth } from "@/lib/auth/auth";
import { SalasContent } from "./_components/salas-content";
import { redirect } from "next/navigation";

interface SalasPageProps {
  searchParams: {
    pagina?: string;
  };
}

export default async function SalasPage({
  searchParams,
}: SalasPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const usuario = (session as any).usuario;

  const isAdmin =
    usuario?.permissao === "ADM" ||
    usuario?.permissao === "DEV";

  if (!isAdmin) {
    redirect("/reserva-salas");
  }

  const pagina = parseInt(
    searchParams.pagina ?? "1",
    10,
  );

  return (
    <div className="flex items-center justify-center py-8">
      <SalasContent pagina={pagina} />
    </div>
  );
}