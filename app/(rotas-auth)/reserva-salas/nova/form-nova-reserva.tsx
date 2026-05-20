"use client";

import {
  useActionState,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  LayoutTemplate,
  User,
  Globe,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { criarReserva } from "../actions";
import type { CoordenadoriaOption, SalaOption } from "../services/reservas";
import { cn } from "@/lib/utils";

type ParticipanteSugestao = { id: string; nome: string; login: string; email: string };

const HORA_INICIO = 9;
const HORA_FIM = 19;

function gerarHorarios(): string[] {
  const horarios: string[] = [];
  for (let h = HORA_INICIO; h <= HORA_FIM; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < HORA_FIM)
      horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return horarios;
}

const HORARIOS = gerarHorarios();

const ETAPAS_RESERVA = [
  { id: 0, label: "Sala, data e detalhes" },
  { id: 1, label: "Infraestrutura e layout" },
  { id: 2, label: "Copa e buffet" },
] as const;

export function FormNovaReserva({
  salas,
  coordenadorias,
  coordenadoriaIdPadrao,
  valueSalaId,
  valueData,
  onSalaChange,
  onDataChange,
  onStepChange,
  agendaSlot,
  usuarioNome,
  usuarioEmail,
}: {
  salas: SalaOption[];
  coordenadorias: CoordenadoriaOption[];
  coordenadoriaIdPadrao: string;
  valueSalaId?: string;
  valueData?: string;
  onSalaChange?: (salaId: string) => void;
  onDataChange?: (data: string) => void;
  onStepChange?: (step: number) => void;
  /** Coluna da agenda ao lado do card de data/hora (etapa 1, desktop). */
  agendaSlot?: ReactNode;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(criarReserva, {});

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const controlledSala = valueSalaId !== undefined;

  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [participantes, setParticipantes] = useState<ParticipanteSugestao[]>([]);
  const [participantesQuery, setParticipantesQuery] = useState("");
  const [participantesSugestoes, setParticipantesSugestoes] = useState<ParticipanteSugestao[]>([]);
  const [participantesLoading, setParticipantesLoading] = useState(false);
  const [participantesDropdownOpen, setParticipantesDropdownOpen] = useState(false);
  const participantesDropdownRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [coordenadoriaId, setCoordenadoriaId] = useState(coordenadoriaIdPadrao);
  const [titulo, setTitulo] = useState("");
  const [telefoneRamal, setTelefoneRamal] = useState("");
  const [numeroParticipantes, setNumeroParticipantes] = useState("1");
  const [erroEtapa, setErroEtapa] = useState("");
  const [salaLayoutFotoId, setSalaLayoutFotoId] = useState("");

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    setSalaLayoutFotoId("");
  }, [valueSalaId]);

  useEffect(() => {
    setCoordenadoriaId(coordenadoriaIdPadrao);
  }, [coordenadoriaIdPadrao]);

  const buscarUsuarios = useCallback(async (q: string) => {
    if (q.length < 2) {
      setParticipantesSugestoes([]);
      return;
    }
    setParticipantesLoading(true);
    try {
      const res = await fetch(`/api/usuarios/busca?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setParticipantesSugestoes(Array.isArray(data) ? data : []);
    } catch {
      setParticipantesSugestoes([]);
    } finally {
      setParticipantesLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarUsuarios(participantesQuery), 300);
    return () => clearTimeout(t);
  }, [participantesQuery, buscarUsuarios]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (participantesDropdownRef.current && !participantesDropdownRef.current.contains(e.target as Node)) {
        setParticipantesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dataDate =
    valueData &&
    (() => {
      const [y, m, d] = valueData.split("-").map(Number);
      return new Date(y, m - 1, d);
    })();

  const tituloData = dataDate
    ? format(dataDate, "d 'de' MMMM", { locale: ptBR })
    : "";

  const indexInicio = HORARIOS.indexOf(horaInicio);
  const indexFim = HORARIOS.indexOf(horaFim);
  const horariosDesabilitados =
    indexInicio >= 0 && indexFim > indexInicio
      ? null
      : (slot: string) => {
          const i = HORARIOS.indexOf(slot);
          if (indexInicio < 0) return false;
          return selectingEnd ? i <= indexInicio : false;
        };

  const handleSlotClick = (slot: string) => {
    if (!selectingEnd) {
      setHoraInicio(slot);
      setHoraFim("");
      setSelectingEnd(true);
    } else {
      const i = HORARIOS.indexOf(slot);
      if (i > indexInicio) {
        setHoraFim(slot);
        setSelectingEnd(false);
      } else {
        setHoraInicio(slot);
        setHoraFim("");
      }
    }
  };

  const salaSelecionada = salas.find((s) => s.id === (valueSalaId ?? ""));
  const precisaEscolherLayoutMovel =
    salaSelecionada?.layout === "MOVEL" &&
    (salaSelecionada.layoutFotos?.length ?? 0) > 0;
  const nomeResponsavelSessao = usuarioNome?.trim() ?? "";
  const emailResponsavelSessao = usuarioEmail?.trim() ?? "";

  const adicionarParticipante = (p: ParticipanteSugestao) => {
    if (participantes.some((x) => x.id === p.id)) return;
    setParticipantes((prev) => [...prev, p]);
    setParticipantesQuery("");
    setParticipantesSugestoes([]);
    setParticipantesDropdownOpen(false);
  };
  const removerParticipante = (id: string) => {
    setParticipantes((prev) => prev.filter((x) => x.id !== id));
  };
  const sugestoesFiltradas = participantesSugestoes.filter(
    (s) => !participantes.some((p) => p.id === s.id)
  );

  function continuarEtapa() {
    setErroEtapa("");
    if (step === 0) {
      if (!coordenadoriaId.trim()) {
        setErroEtapa("Selecione a coordenadoria.");
        return;
      }
      const sid = valueSalaId?.trim() ?? "";
      if (!sid) {
        setErroEtapa("Selecione a sala.");
        return;
      }
      if (!valueData || !horaInicio || !horaFim) {
        setErroEtapa("Preencha a data e o intervalo de horários.");
        return;
      }
      if (!nomeResponsavelSessao) {
        setErroEtapa("Não foi possível identificar o nome do usuário logado.");
        return;
      }
      if (!telefoneRamal.trim()) {
        setErroEtapa("Informe o telefone ou ramal.");
        return;
      }
      if (!emailResponsavelSessao || !emailResponsavelSessao.includes("@")) {
        setErroEtapa("Não foi possível identificar o e-mail do usuário logado.");
        return;
      }
      if (!titulo.trim()) {
        setErroEtapa("Informe o título da reunião.");
        return;
      }
      const nPart = Number.parseInt(numeroParticipantes, 10);
      if (!Number.isFinite(nPart) || nPart < 1) {
        setErroEtapa("Informe o número de participantes (mínimo 1).");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (precisaEscolherLayoutMovel && !salaLayoutFotoId.trim()) {
        setErroEtapa("Selecione o tipo de layout da reunião.");
        return;
      }
      setStep(2);
    }
  }

  function voltarEtapa() {
    setErroEtapa("");
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <form action={formAction} className="space-y-5 md:space-y-6">
      <nav
        aria-label="Etapas da reserva"
        className="flex flex-wrap gap-2 pb-1 border-b border-border/50"
      >
        {ETAPAS_RESERVA.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              if (i <= step) {
                setErroEtapa("");
                setStep(i);
              }
            }}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
              i === step
                ? "border-primary bg-primary/10 text-foreground"
                : i < step
                  ? "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  : "border-dashed border-border text-muted-foreground opacity-70 cursor-default",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                i === step ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {i + 1}
            </span>
            {e.label}
          </button>
        ))}
      </nav>

      <div className={cn(step !== 0 && "hidden")} data-step="0">
      <div className="flex flex-col gap-4 md:gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 lg:gap-4">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="salaId">Sala *</Label>
          <select
            id="salaId"
            name="salaId"
            required
            value={controlledSala ? valueSalaId ?? "" : undefined}
            defaultValue={!controlledSala ? "" : undefined}
            onChange={
              onSalaChange ? (e) => onSalaChange(e.target.value) : undefined
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione a sala</option>
            {salas.map((s) => {
              const partes = [s.nome];
              if (s.andar) partes.push(s.andar);
              if (s.numero) partes.push(`Sala ${s.numero}`);
              if (s.layout) partes.push(s.layout === "MOVEL" ? "Layout móvel" : "Layout fixo");
              const textoAndarLocal =
                partes.length > 1 ? ` — ${partes.slice(1).join(", ")}` : "";
              const lotacaoTexto =
                s.lotacao != null ? ` (${s.lotacao} lugares)` : "";
              return (
                <option key={s.id} value={s.id}>
                  {s.nome}
                  {textoAndarLocal}
                  {lotacaoTexto}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaLotacao">Lotação</Label>
          <Input
            id="salaLotacao"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={
              salaSelecionada
                ? salaSelecionada.lotacao != null
                  ? `${salaSelecionada.lotacao} lugares`
                  : "—"
                : "—"
            }
            className="h-9 bg-muted/50 cursor-default"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaLayout">Layout</Label>
          <Input
            id="salaLayout"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={
              salaSelecionada
                ? salaSelecionada.layout === "MOVEL"
                  ? "Móvel"
                  : salaSelecionada.layout === "FIXO"
                    ? "Fixo"
                    : "—"
                : "—"
            }
            className="h-9 bg-muted/50 cursor-default"
          />
        </div>
      </div>

      {/* DATA + TEMPO (+ agenda ao lado no desktop) */}
      <div
        className={cn(
          "grid grid-cols-1 items-start gap-6 lg:gap-8",
          agendaSlot && "lg:grid-cols-[minmax(0,1fr)_380px]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
        <div className="rounded-lg border bg-card p-4 md:p-5 space-y-3 shadow-sm min-w-0 w-full">
          <h2 className="text-lg font-semibold capitalize pb-0.5">
            {tituloData || "Selecione a data"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-5 lg:gap-6">
            {/* DATA */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Data
                </span>
              </div>
              <Calendar
                mode="single"
                selected={dataDate || undefined}
                onSelect={(d) => {
                  if (d) onDataChange?.(format(d, "yyyy-MM-dd"));
                }}
                disabled={(date) => date < hoje}
                locale={ptBR}
              />
            </div>
            {/* TEMPO */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Tempo
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-2">
                {HORARIOS.map((slot) => {
                  const isInicio = slot === horaInicio;
                  const isFim = slot === horaFim;
                  const disabled =
                    horariosDesabilitados !== null &&
                    horariosDesabilitados(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSlotClick(slot)}
                      disabled={disabled}
                      className={cn(
                        "h-9 rounded-md border text-sm font-medium transition-colors",
                        isInicio &&
                          "border-primary bg-primary text-primary-foreground",
                        /* Evita bg-primary/80: com --primary em var() a opacidade costuma falhar e o texto primary-foreground fica ilegível. */
                        isFim &&
                          !isInicio &&
                          "border-2 border-primary bg-muted text-foreground shadow-sm",
                        !isInicio &&
                          !isFim &&
                          !disabled &&
                          "border-input text-foreground hover:bg-accent hover:text-accent-foreground",
                        disabled && "cursor-not-allowed border-input opacity-50"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                <Globe className="size-3.5" />
                Todos os horários estão em (UTC-03:00) Brasília
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 md:p-5 space-y-3 shadow-sm min-w-0 w-full">
        <div className="flex items-center gap-2 text-muted-foreground pb-0.5">
          <User className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            Detalhes da reserva
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4">
          <div className="space-y-2">
            <Label>Responsável pela reserva</Label>
            <div
              className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground"
              aria-readonly="true"
            >
              {nomeResponsavelSessao || "—"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefoneRamal">Telefone / Ramal *</Label>
            <Input
              id="telefoneRamal"
              name="telefoneRamal"
              required
              autoComplete="tel"
              value={telefoneRamal}
              onChange={(e) => setTelefoneRamal(e.target.value)}
              placeholder="Ex: 11 99999-0000 ou ramal 1234"
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <div
              className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground"
              aria-readonly="true"
            >
              {emailResponsavelSessao || "—"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coordenadoriaId">Coordenadoria / Setor *</Label>
            <select
              id="coordenadoriaId"
              name="coordenadoriaId"
              required
              value={coordenadoriaId}
              onChange={(e) => setCoordenadoriaId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione a coordenadoria ou setor</option>
              {coordenadorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da reunião *</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião de planejamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numeroParticipantes">Número de participantes *</Label>
            <Input
              id="numeroParticipantes"
              name="numeroParticipantes"
              type="number"
              min={1}
              step={1}
              required
              value={numeroParticipantes}
              onChange={(e) => setNumeroParticipantes(e.target.value)}
            />
          </div>
          <div
            className="space-y-2 md:col-span-2 pt-1 md:pt-2 border-t border-border/40 mt-0.5"
            ref={participantesDropdownRef}
          >
            <Label htmlFor="participantes-input">
              Convidar participantes{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <div className="relative">
              <Input
                id="participantes-input"
                type="text"
                placeholder="Digite para buscar usuários..."
                value={participantesQuery}
                onChange={(e) => {
                  setParticipantesQuery(e.target.value);
                  setParticipantesDropdownOpen(true);
                }}
                onFocus={() => participantesQuery.length >= 2 && setParticipantesDropdownOpen(true)}
                className="pr-3"
              />
              {participantesDropdownOpen && (participantesQuery.length >= 2 || sugestoesFiltradas.length > 0) && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-[220px] overflow-auto">
                  {participantesLoading ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
                  ) : sugestoesFiltradas.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      {participantesQuery.length < 2 ? "Digite ao menos 2 caracteres" : "Nenhum usuário encontrado"}
                    </p>
                  ) : (
                    <ul className="py-1">
                      {sugestoesFiltradas.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex flex-col gap-0.5"
                            onClick={() => adicionarParticipante(u)}
                          >
                            <span className="font-medium">{u.nome}</span>
                            <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {participantes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {participantes.map((p) => (
                  <Badge key={p.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                    <span className="truncate max-w-[140px]">{p.nome}</span>
                    <button
                      type="button"
                      onClick={() => removerParticipante(p.id)}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                      aria-label={`Remover ${p.nome}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
        </div>

        {agendaSlot ? (
          <div className="min-w-0 w-full lg:sticky lg:top-4 lg:self-start">
            {agendaSlot}
          </div>
        ) : null}
      </div>
      </div>
      </div>

      <div className={cn(step !== 1 && "hidden")} data-step="1">
        <div className="rounded-lg border bg-card p-4 md:p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutTemplate className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Infraestrutura da sala
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {salaSelecionada
              ? `Itens cadastrados para ${salaSelecionada.nome}.`
              : "Selecione uma sala na etapa anterior."}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="infra-andar">Andar</Label>
              <Input
                id="infra-andar"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                value={
                  salaSelecionada?.andar?.trim()
                    ? salaSelecionada.andar
                    : "—"
                }
                className="h-9 bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="infra-numero">Nº da sala</Label>
              <Input
                id="infra-numero"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                value={salaSelecionada?.numero?.trim() ? salaSelecionada.numero : "—"}
                className="h-9 bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="infra-lotacao">Lotação</Label>
              <Input
                id="infra-lotacao"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                value={
                  salaSelecionada && salaSelecionada.lotacao != null
                    ? `${salaSelecionada.lotacao} lugares`
                    : "—"
                }
                className="h-9 bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="infra-layout">Layout</Label>
              <Input
                id="infra-layout"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                value={
                  salaSelecionada
                    ? salaSelecionada.layout === "MOVEL"
                      ? "Móvel"
                      : salaSelecionada.layout === "FIXO"
                        ? "Fixo"
                        : "—"
                    : "—"
                }
                className="h-9 bg-muted/50 cursor-default"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              
              {!salaSelecionada || salaSelecionada.mobiliarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum mobiliário cadastrado.
                </p>
              ) : (
                <Table className="w-full">
                  <TableHeader className="[&_tr]:border-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead>Mobiliário</TableHead>
                      <TableHead className="text-right w-[1%] whitespace-nowrap">
                        Quantidade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaSelecionada.mobiliarios.map((item, idx) => (
                      <TableRow
                        key={`${item.nome}-${idx}`}
                        className="border-0 hover:bg-transparent"
                      >
                        <TableCell className="min-w-0">{item.nome}</TableCell>
                        <TableCell className="tabular-nums text-right text-muted-foreground whitespace-nowrap">
                          {item.quantidade}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">             
              {!salaSelecionada || salaSelecionada.midias.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum item de mídia cadastrado.
                </p>
              ) : (
                <Table className="w-full">
                  <TableHeader className="[&_tr]:border-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead>Mídia</TableHead>
                      <TableHead className="text-right w-[1%] whitespace-nowrap">
                        Quantidade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaSelecionada.midias.map((item, idx) => (
                      <TableRow
                        key={`${item.nome}-${idx}`}
                        className="border-0 hover:bg-transparent"
                      >
                        <TableCell className="min-w-0">{item.nome}</TableCell>
                        <TableCell className="tabular-nums text-right text-muted-foreground whitespace-nowrap">
                          {item.quantidade}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {salaSelecionada?.layout === "MOVEL" && (
            <div className="rounded-lg border bg-muted/10 p-4 space-y-3 mt-1">
              <h3 className="text-sm font-semibold">Layout móvel da sala</h3>
              {salaSelecionada.layoutFotos.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Escolha <span className="font-medium text-foreground">um</span>{" "}
                    tipo de disposição para esta reserva. O administrador verá sua
                    escolha na agenda.
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    Tipo de layout da reunião <span className="text-destructive">*</span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {salaSelecionada.layoutFotos.map((foto) => {
                      const selecionada = salaLayoutFotoId === foto.id;
                      return (
                        <button
                          key={foto.id}
                          type="button"
                          onClick={() => setSalaLayoutFotoId(foto.id)}
                          className={cn(
                            "relative rounded-lg border-2 p-3 text-left transition-colors",
                            selecionada
                              ? "border-primary bg-muted shadow-sm ring-2 ring-primary/30"
                              : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          {selecionada && (
                            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3.5" aria-hidden />
                            </span>
                          )}
                          <p className="pr-8 text-sm font-medium text-foreground">
                            {foto.descricao}
                          </p>
                          <img
                            src={foto.imagemUrl}
                            alt=""
                            className="mt-2 w-full max-h-48 rounded-md border object-contain bg-muted/30"
                          />
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta sala não possui fotos de layout cadastradas. Nenhuma escolha
                  é necessária; alinhe a disposição com a equipe de apoio.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={cn(step !== 2 && "hidden")} data-step="2">
        <div className="rounded-lg border border-dashed bg-card p-5 md:p-6 space-y-3 text-center shadow-sm">
          <div className="flex justify-center">
            <Coffee className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Copa e buffet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Em breve você poderá solicitar serviços de copa e buffet nesta etapa.
          </p>
        </div>
      </div>

      {/* Sempre no DOM para o envio */}
      <input type="hidden" name="data" value={valueData ?? ""} />
      <input type="hidden" name="horaInicio" value={horaInicio} />
      <input type="hidden" name="horaFim" value={horaFim} />
      <input type="hidden" name="salaLayoutFotoId" value={salaLayoutFotoId} />
      {participantes.map((p) => (
        <input key={p.id} type="hidden" name="participantesIds" value={p.id} />
      ))}

      {(erroEtapa || state.erro) && (
        <p className="text-sm text-destructive pt-1">
          {erroEtapa || state.erro}
        </p>
      )}
      {state.sucesso && (
        <p className="text-sm text-green-600 dark:text-green-400 pt-1">
          Reserva realizada com sucesso!
        </p>
      )}

      <div className="flex flex-col gap-2.5 pt-3 mt-1 border-t border-border/60">
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center flex-wrap">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[160px] gap-2"
              onClick={voltarEtapa}
            >
              <ChevronLeft className="size-4 shrink-0" />
              Etapa anterior
            </Button>
          )}
          {step < 2 && (
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto min-w-[180px] gap-2"
              onClick={continuarEtapa}
            >
              Continuar
              <ChevronRight className="size-4 shrink-0" />
            </Button>
          )}
          {step === 2 && (
            <Button
              type="submit"
              disabled={
                isPending ||
                !horaInicio ||
                !horaFim ||
                !valueData ||
                (precisaEscolherLayoutMovel && !salaLayoutFotoId.trim())
              }
              size="lg"
              className="w-full sm:w-auto min-w-[180px]"
            >
              {isPending ? "Reservando..." : "Confirmar reserva"}
            </Button>
          )}
        </div>
        <div className="flex justify-center">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/reserva-salas">Voltar ao painel</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
