import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listarMinhasReservas } from "../services/reservas";
import { MinhasReservasTable } from "./_components/minhas-reservas-table";

type PageProps = {
  searchParams: Promise<{ criada?: string }>;
};

export default async function MinhasReservasPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const mostrarAvisoCriada = sp.criada === "1";

  const session = await auth();
  if (!session) redirect("/login");
  const usuario = (session as any).usuario;
  if (!usuario?.login) redirect("/login");

  const reservas = await listarMinhasReservas(usuario.login);

  return (
    <div className="w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold">Minhas Reservas</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Novas reservas ficam como <strong className="font-medium text-foreground">aguardando aprovação</strong> até
        o administrador confirmar. Somente reservas <strong className="font-medium text-foreground">aprovadas</strong> entram na agenda oficial.
      </p>
      {mostrarAvisoCriada && (
        <div
          role="status"
          className="mt-4 rounded-md border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-foreground"
        >
          Solicitação enviada com sucesso. Ela aparece em <strong className="font-medium">Minhas reservas</strong> como{" "}
          <strong className="font-medium">aguardando aprovação</strong> até um administrador aprovar ou cancelar.
        </div>
      )}
      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 my-5 w-full">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/reserva-salas/nova">Nova reserva</Link>
          </Button>
        </div>
        {reservas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Você não possui reservas futuras.{" "}
            <Link href="/reserva-salas/nova" className="text-primary underline">
              Fazer uma reserva
            </Link>
          </p>
        ) : (
          <MinhasReservasTable reservas={reservas} />
        )}
      </div>
    </div>
  );
}
