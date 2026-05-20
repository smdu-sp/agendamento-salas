import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { listarCoordenadoriasAtivas, listarSalasAtivas } from "../services/reservas";
import { NovaReservaLayout } from "./nova-reserva-layout";

export default async function NovaReservaPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const usuario = (session as any).usuario;
  const podeReservar = usuario?.permissao === "USR" || usuario?.permissao === "ADM" || usuario?.permissao === "DEV";
  if (!podeReservar) redirect("/reserva-salas");
  const [salas, coordenadorias] = await Promise.all([
    listarSalasAtivas(),
    listarCoordenadoriasAtivas(),
  ]);
  const coordenadoriaIdPadrao = usuario?.coordenadoriaId ?? "";
  const isAdmin =
    usuario?.permissao === "ADM" || usuario?.permissao === "DEV";

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nova Reserva</h1>
        <p className="text-sm text-muted-foreground">
        Escolha a sala, data e horário para sua reunião. À direita, a agenda do dia mostra os horários já reservados.
        </p>
      </header>
      <NovaReservaLayout
        salas={salas}
        coordenadorias={coordenadorias}
        coordenadoriaIdPadrao={coordenadoriaIdPadrao}
        isAdmin={isAdmin}
        usuarioNome={usuario?.nomeSocial ?? usuario?.nome ?? null}
        usuarioEmail={usuario?.email ?? null}
      />
    </main>
  );
}
