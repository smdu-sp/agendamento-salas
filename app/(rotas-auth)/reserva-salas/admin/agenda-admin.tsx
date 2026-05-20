"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  aprovarReserva,
  cancelarReserva,
} from "@/app/(rotas-auth)/reserva-salas/actions";
import { toast } from "sonner";
import { SalaAdmin, ReservaAdmin } from "../types";

const HORA_INICIO = 9;
const HORA_FIM = 19;
const MINUTOS_TOTAL = (HORA_FIM - HORA_INICIO) * 60;

type SalaAdmin = {
  id: string;
  nome: string;
  andar: string | null;
  numero: string | null;
};

type ReservaAdmin = {
  id: string;
  salaId: string;
  salaNome: string;
  titulo: string | null;
  usuarioNome: string | null;
  usuarioLogin: string;
  coordenadoriaNome: string | null;
  inicio: string;
  fim: string;
  layoutEscolhidoDescricao: string | null;
  status?: string;
};

type SolicitacaoReserva = {
  id: string;
  criadoEm: string;
  inicio: string;
  fim: string;
  titulo: string | null;
  usuarioNome: string | null;
  usuarioLogin: string;
  emailContato: string | null;
  telefoneRamal: string | null;
  numeroParticipantes: number | null;
  layoutEscolhidoDescricao: string | null;
  sala: {
    id: string;
    nome: string;
    andar: string | null;
    numero: string | null;
    lotacao: number | null;
  };
  coordenadoriaNome: string | null;
  participantes: { nome: string; login: string; email: string }[];
};

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LinhaDetalhe({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-3 sm:items-start border-b border-border/50 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="text-sm text-foreground min-w-0 break-words">{children}</dd>
    </div>
  );
}

function minutosDesdeNoveHoras(d: Date): number {
  const h = d.getHours();
  const min = d.getMinutes();
  return (h - HORA_INICIO) * 60 + min;
}

function dataParaInput(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function AgendaAdmin() {
  const [data, setData] = useState<Date>(new Date());
  const [salas, setSalas] = useState<SalaAdmin[]>([]);
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [reservaParaCancelar, setReservaParaCancelar] = useState<{
    id: string;
    titulo: string;
  } | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [salaIdFiltro, setSalaIdFiltro] = useState("");
  const [proximos, setProximos] = useState<ReservaAdmin[]>([]);
  const [totalProximos, setTotalProximos] = useState(0);
  const [paginaProximos, setPaginaProximos] = useState(1);
  const [loadingProximos, setLoadingProximos] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoReserva[]>([]);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [solicitacaoAberta, setSolicitacaoAberta] = useState<SolicitacaoReserva | null>(null);
  const [processandoSolicitacaoId, setProcessandoSolicitacaoId] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"agenda" | "proximos" | "solicitacoes">("agenda");

  const dataStr = dataParaInput(data);

  const carregar = useCallback(() => {
    setLoading(true);
    fetch(`/api/reservas/admin?data=${dataStr}`)
      .then((r) => r.json())
      .then((body) => {
        setSalas(body.salas ?? []);
        setReservas(body.reservas ?? []);
      })
      .catch(() => {
        setSalas([]);
        setReservas([]);
      })
      .finally(() => setLoading(false));
  }, [dataStr]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const carregarSolicitacoes = useCallback(() => {
    setLoadingSolicitacoes(true);
    fetch("/api/reservas/solicitacoes")
      .then((r) => r.json())
      .then((body) => {
        setSolicitacoes(Array.isArray(body) ? body : []);
      })
      .catch(() => setSolicitacoes([]))
      .finally(() => setLoadingSolicitacoes(false));
  }, []);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  function abrirModalCancelar(r: { id: string; titulo: string | null }) {
    setReservaParaCancelar({ id: r.id, titulo: r.titulo ?? "Sem título" });
    setMotivoCancelamento("");
  }

  function fecharModalCancelar() {
    setReservaParaCancelar(null);
    setMotivoCancelamento("");
  }

  async function confirmarCancelamento() {
    if (!reservaParaCancelar) return;
    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      toast.error("Informe o motivo do cancelamento.");
      return;
    }
    setCancelandoId(reservaParaCancelar.id);
    const result = await cancelarReserva(reservaParaCancelar.id, motivo);
    setCancelandoId(null);
    fecharModalCancelar();
    if (result.erro) {
      toast.error("Erro ao cancelar", { description: result.erro });
    } else {
      toast.success("Reserva cancelada.");
      setSolicitacaoAberta(null);
      carregar();
      carregarProximos();
      carregarSolicitacoes();
    }
  }

  async function handleAprovarSolicitacao(id: string) {
    setProcessandoSolicitacaoId(id);
    const result = await aprovarReserva(id);
    setProcessandoSolicitacaoId(null);
    if (result.erro) {
      toast.error("Não foi possível aprovar", { description: result.erro });
      return;
    }
    toast.success("Reserva aprovada.");
    setSolicitacaoAberta(null);
    carregarSolicitacoes();
    carregar();
    carregarProximos();
  }

  function abrirCancelarDesdeSolicitacao(s: SolicitacaoReserva) {
    setSolicitacaoAberta(null);
    abrirModalCancelar({ id: s.id, titulo: s.titulo });
  }

  async function handleAprovarSolicitacao(id: string) {
    setProcessandoSolicitacaoId(id);
    const result = await aprovarReserva(id);
    setProcessandoSolicitacaoId(null);
    if (result.erro) {
      toast.error("Não foi possível aprovar", { description: result.erro });
      return;
    }
    toast.success("Reserva aprovada.");
    setSolicitacaoAberta(null);
    carregarSolicitacoes();
    carregar();
    carregarProximos();
  }

  function abrirCancelarDesdeSolicitacao(s: SolicitacaoReserva) {
    setSolicitacaoAberta(null);
    abrirModalCancelar({ id: s.id, titulo: s.titulo });
  }

  const reservasPorSalaFiltradas = salas
    .filter((sala) => !salaIdFiltro || sala.id === salaIdFiltro)
    .map((sala) => ({
      sala,
      reservas: reservas
        .filter((r) => r.salaId === sala.id)
        .map((r) => {
        const inicio = new Date(r.inicio);
        const fim = new Date(r.fim);
        const topMin = Math.max(0, minutosDesdeNoveHoras(inicio));
        const fimMin = Math.min(MINUTOS_TOTAL, minutosDesdeNoveHoras(fim));
        const duracaoMin = Math.max(0, fimMin - topMin);
        const topPct = (topMin / MINUTOS_TOTAL) * 100;
        const heightPct = (duracaoMin / MINUTOS_TOTAL) * 100;
          return { ...r, topPct, heightPct };
        }),
    }));

  const horas: number[] = [];
  for (let h = HORA_INICIO; h < HORA_FIM; h++) horas.push(h);

  return (
    <div className="space-y-4">
      <div className="border-b border-border">
        <nav className="flex gap-0">
          <button
            type="button"
            onClick={() => setAbaAtiva("agenda")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              abaAtiva === "agenda"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Agenda
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("proximos")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              abaAtiva === "proximos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Próximos eventos
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("solicitacoes")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 ${
              abaAtiva === "solicitacoes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Solicitações
            {solicitacoes.length > 0 && abaAtiva !== "solicitacoes" ? (
              <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                {solicitacoes.length}
              </span>
            ) : null}
          </button>
        </nav>
      </div>

      {abaAtiva === "agenda" && (
        <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Data</label>
          <Calendar
            mode="single"
            selected={data}
            onSelect={(d) => d && setData(d)}
          />
        </div>
        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Sala</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={salaIdFiltro}
            onChange={(e) => setSalaIdFiltro(e.target.value)}
          >
            <option value="">Todas as salas</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {(s.andar || s.numero) &&
                  ` — ${[s.andar, s.numero ? `Sala ${s.numero}` : null].filter(Boolean).join(", ")}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando agenda...</p>
      ) : (
        <div className="space-y-8">
          {reservasPorSalaFiltradas.map(({ sala, reservas: reservasSala }) => (
            <div
              key={sala.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <div className="px-4 py-2 border-b bg-muted/40">
                <h3 className="font-semibold text-sm">{sala.nome}</h3>
                {(sala.andar || sala.numero) && (
                  <p className="text-xs text-muted-foreground">
                    {[sala.andar, sala.numero ? `Sala ${sala.numero}` : null].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div
                className="flex relative"
                style={{ height: `${MINUTOS_TOTAL}px` }}
              >
                <div className="w-12 shrink-0 flex flex-col border-r text-right pr-2 py-1 text-xs text-muted-foreground">
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="flex items-start justify-end"
                      style={{ height: "60px" }}
                    >
                      {h.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                <div className="flex-1 relative overflow-hidden h-full border-l border-border/60">
                  {horas.slice(0, -1).map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/60"
                      style={{
                        top: `${((h - HORA_INICIO) * 60 / MINUTOS_TOTAL) * 100}%`,
                        height: `${(60 / MINUTOS_TOTAL) * 100}%`,
                      }}
                    />
                  ))}
                  {reservasSala.map((r) => (
                    <div
                      key={r.id}
                      className="absolute left-1 right-1 rounded-md overflow-hidden border border-border/80 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                      style={{
                        top: `${r.topPct}%`,
                        height: `${r.heightPct}%`,
                        minHeight: "44px",
                      }}
                    >
                      <div className="h-full w-full p-2 flex flex-col justify-between text-left overflow-hidden">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate text-foreground">
                            {r.titulo ?? "Sem título"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {r.usuarioNome ?? r.usuarioLogin}
                            {r.coordenadoriaNome ? ` · ${r.coordenadoriaNome}` : ""}
                          </p>
                          {r.layoutEscolhidoDescricao ? (
                            <p className="text-[10px] font-medium text-primary truncate mt-0.5">
                              Layout: {r.layoutEscolhidoDescricao}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-1 h-7 text-xs w-fit"
                          disabled={cancelandoId === r.id}
                          onClick={() => abrirModalCancelar(r)}
                        >
                          {cancelandoId === r.id ? "Cancelando..." : "Cancelar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {salas.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              Nenhuma sala cadastrada.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Horário do prédio: 9h às 19h
      </p>
        </div>
      )}

      {abaAtiva === "proximos" && (
      <section className="rounded-lg border bg-card overflow-hidden">
        {loadingProximos ? (
          <p className="text-sm text-muted-foreground p-4">
            Carregando...
          </p>
        ) : proximos.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            Nenhuma reserva futura.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-white text-xs">Sala</TableHead>
                  <TableHead className="text-white text-xs">Título</TableHead>
                  <TableHead className="text-white text-xs">Layout</TableHead>
                  <TableHead className="text-white text-xs">Responsável</TableHead>
                  <TableHead className="text-white text-xs">Início</TableHead>
                  <TableHead className="text-white text-xs">Fim</TableHead>
                  <TableHead className="text-white text-xs text-center w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximos.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.salaNome}</TableCell>
                    <TableCell className="text-xs">
                      {r.titulo ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[140px]">
                      {r.layoutEscolhidoDescricao ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.usuarioNome ?? r.usuarioLogin}
                      {r.coordenadoriaNome ? ` · ${r.coordenadoriaNome}` : ""}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.inicio).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.fim).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        disabled={cancelandoId === r.id}
                        onClick={() => abrirModalCancelar(r)}
                      >
                        {cancelandoId === r.id ? "..." : "Cancelar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/30 text-sm">
              <span className="text-muted-foreground">
                Página {paginaProximos} de {totalPaginasProximos} ({totalProximos}{" "}
                {totalProximos === 1 ? "evento" : "eventos"})
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={paginaProximos <= 1}
                  onClick={() => setPaginaProximos((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={paginaProximos >= totalPaginasProximos}
                  onClick={() =>
                    setPaginaProximos((p) =>
                      Math.min(totalPaginasProximos, p + 1)
                    )
                  }
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      )}

      {abaAtiva === "solicitacoes" && (
        <section className="rounded-lg border bg-card overflow-hidden">
          {loadingSolicitacoes ? (
            <p className="text-sm text-muted-foreground p-4">Carregando solicitações...</p>
          ) : solicitacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              Nenhuma reserva aguardando aprovação.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs">Solicitado em</TableHead>
                  <TableHead className="text-xs">Sala</TableHead>
                  <TableHead className="text-xs">Período</TableHead>
                  <TableHead className="text-xs">Solicitante</TableHead>
                  <TableHead className="text-xs w-[100px] text-center">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatarDataHora(s.criadoEm)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{s.sala.nome}</TableCell>
                    <TableCell className="text-xs">
                      {formatarDataHora(s.inicio)}
                      <span className="text-muted-foreground"> → </span>
                      {new Date(s.fim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">
                      {s.usuarioNome ?? s.usuarioLogin}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setSolicitacaoAberta(s)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      <Sheet
        open={!!solicitacaoAberta}
        onOpenChange={(open) => {
          if (!open) setSolicitacaoAberta(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
        >
          {solicitacaoAberta ? (
            <>
              <SheetHeader className="space-y-1 text-left border-b pb-4">
                <SheetTitle>Solicitação de reserva</SheetTitle>
                <SheetDescription>
                  Revise os dados e aprove ou cancele informando o motivo.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 py-4">
                <h3 className="text-sm font-semibold mb-2">Sala e horário</h3>
                <dl>
                  <LinhaDetalhe rotulo="Sala">{solicitacaoAberta.sala.nome}</LinhaDetalhe>
                  <LinhaDetalhe rotulo="Localização">
                    {[solicitacaoAberta.sala.andar, solicitacaoAberta.sala.numero]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Lotação">
                    {solicitacaoAberta.sala.lotacao != null
                      ? `${solicitacaoAberta.sala.lotacao} lugares`
                      : "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Início">
                    {formatarDataHora(solicitacaoAberta.inicio)}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Término">
                    {formatarDataHora(solicitacaoAberta.fim)}
                  </LinhaDetalhe>
                </dl>
                <Separator className="my-4" />
                <h3 className="text-sm font-semibold mb-2">Solicitante e reunião</h3>
                <dl>
                  <LinhaDetalhe rotulo="Nome">{solicitacaoAberta.usuarioNome ?? "—"}</LinhaDetalhe>
                  <LinhaDetalhe rotulo="Login">{solicitacaoAberta.usuarioLogin}</LinhaDetalhe>
                  <LinhaDetalhe rotulo="E-mail">{solicitacaoAberta.emailContato ?? "—"}</LinhaDetalhe>
                  <LinhaDetalhe rotulo="Telefone / ramal">
                    {solicitacaoAberta.telefoneRamal ?? "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Coordenadoria">
                    {solicitacaoAberta.coordenadoriaNome ?? "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Título da reunião">
                    {solicitacaoAberta.titulo ?? "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Participantes (nº)">
                    {solicitacaoAberta.numeroParticipantes ?? "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Layout escolhido">
                    {solicitacaoAberta.layoutEscolhidoDescricao ?? "—"}
                  </LinhaDetalhe>
                  <LinhaDetalhe rotulo="Solicitado em">
                    {formatarDataHora(solicitacaoAberta.criadoEm)}
                  </LinhaDetalhe>
                </dl>
                <Separator className="my-4" />
                <h3 className="text-sm font-semibold mb-2">Participantes convidados</h3>
                {solicitacaoAberta.participantes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum participante adicional.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {solicitacaoAberta.participantes.map((p, i) => (
                      <li
                        key={`${p.login}-${i}`}
                        className="rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-muted-foreground"> · {p.login}</span>
                        <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <SheetFooter className="flex-col gap-2 border-t pt-4 sm:flex-col">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    disabled={processandoSolicitacaoId === solicitacaoAberta.id}
                    onClick={() => void handleAprovarSolicitacao(solicitacaoAberta.id)}
                  >
                    {processandoSolicitacaoId === solicitacaoAberta.id
                      ? "Aprovando..."
                      : "Aprovar reserva"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:flex-1"
                    disabled={!!processandoSolicitacaoId}
                    onClick={() => abrirCancelarDesdeSolicitacao(solicitacaoAberta)}
                  >
                    Cancelar solicitação
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={!!reservaParaCancelar} onOpenChange={(open) => !open && fecharModalCancelar()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a reserva &quot;{reservaParaCancelar?.titulo}&quot;?
              O motivo é obrigatório e ficará registrado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="motivo-cancelamento">Motivo do cancelamento *</Label>
            <textarea
              id="motivo-cancelamento"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Descreva o motivo (obrigatório para administradores)..."
              required
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={fecharModalCancelar}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelandoId === reservaParaCancelar?.id}
              onClick={confirmarCancelamento}
            >
              {cancelandoId === reservaParaCancelar?.id ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
