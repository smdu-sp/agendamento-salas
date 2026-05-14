"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus, Search, SquarePen, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CategoriaFormData = {
  id: number;
  nome: string;
  descricao: string | null;
  criterios: Array<{ id: number; nome: string }>;
};

type CriterioCatalogoItem = {
  nome: string;
};

type CategoriaFormProps = {
  categoria?: CategoriaFormData;
  criteriosCatalogo?: CriterioCatalogoItem[];
};

const formSchema = z.object({
  nome: z.string().min(3, "Informe o nome da categoria"),
  descricao: z.string().optional().or(z.literal("")),
  criterios: z.array(z.string().min(1)).default([]),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

function normalizeCriterio(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

function uniqueCriterios(valores: string[]) {
  const vistos = new Set<string>();
  const resultado: string[] = [];

  for (const valor of valores) {
    const normalizado = normalizeCriterio(valor);
    if (!normalizado) continue;

    const chave = normalizado.toLowerCase();
    if (vistos.has(chave)) continue;

    vistos.add(chave);
    resultado.push(normalizado);
  }

  return resultado;
}

function splitCriteriosDigitados(valor: string) {
  return uniqueCriterios(valor.split(/[\n,]/));
}

function mergeCriterios(...listas: string[][]) {
  return uniqueCriterios(listas.flat());
}

type CriteriosMultiSelectProps = {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

function CriteriosMultiSelect({ value, options, onChange, disabled }: CriteriosMultiSelectProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selecionados = uniqueCriterios(value);
  const selecionadosNormalizados = new Set(selecionados.map((item) => item.toLowerCase()));
  const catalogo = uniqueCriterios(options).filter((item) => !selecionadosNormalizados.has(item.toLowerCase()));
  const buscaNormalizada = normalizeCriterio(busca);
  const buscaLower = buscaNormalizada.toLowerCase();
  const sugestoes = catalogo.filter((item) => item.toLowerCase().includes(buscaLower));
  const podeCriar =
    buscaNormalizada.length > 0 &&
    !selecionadosNormalizados.has(buscaLower) &&
    !catalogo.some((item) => item.toLowerCase() === buscaLower);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function focarInput() {
    inputRef.current?.focus();
  }

  function atualizarSelecionados(proximo: string[]) {
    onChange(uniqueCriterios(proximo));
  }

  function adicionarCriterios(valor: string) {
    const candidatos = splitCriteriosDigitados(valor);

    if (candidatos.length === 0) {
      setBusca("");
      return;
    }

    const proximo = mergeCriterios(
      selecionados,
      candidatos.map((item) => {
        const existente = options.find((option) => option.toLowerCase() === item.toLowerCase());
        return existente ?? item;
      }),
    );

    atualizarSelecionados(proximo);
    setBusca("");
    setAberto(true);
  }

  function removerCriterio(valor: string) {
    atualizarSelecionados(selecionados.filter((item) => item.toLowerCase() !== valor.toLowerCase()));
    focarInput();
  }

  function selecionarSugestao(valor: string) {
    adicionarCriterios(valor);
    focarInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab" || event.key === ";") {
      if (buscaNormalizada) {
        event.preventDefault();
        adicionarCriterios(buscaNormalizada);
      }
      return;
    }

    if (event.key === "Backspace" && busca.length === 0 && selecionados.length > 0) {
      event.preventDefault();
      atualizarSelecionados(selecionados.slice(0, -1));
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const texto = event.clipboardData.getData("text");
    if (/[\n,]/.test(texto)) {
      event.preventDefault();
      adicionarCriterios(texto);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex min-h-8 flex-wrap gap-2 rounded-md border bg-background px-3 py-2 shadow-sm transition-colors",
          disabled && "cursor-not-allowed opacity-60",
          aberto && "border-ring ring-2 ring-ring/20",
        )}
        onClick={focarInput}
        role="presentation"
      >
        {selecionados.length === 0 ? (
          <span className="pt-1 text-sm text-muted-foreground">
            Digite para buscar um critério ou pressione Enter para criar um novo.
          </span>
        ) : null}

        {selecionados.map((criterio) => (
          <Badge key={criterio} variant="secondary" className="normal-case gap-1 pr-1">
            <span className="max-w-[18rem] truncate">{criterio}</span>
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                removerCriterio(criterio);
              }}
              aria-label={`Remover ${criterio}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <input
          ref={inputRef}
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={selecionados.length === 0 ? "Buscar ou criar critério" : "Adicionar outro critério"}
          className="h-8 min-w-[11rem] flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {aberto && !disabled && (sugestoes.length > 0 || podeCriar) ? (
        <div className="absolute z-20 mt-2 w-full rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
          <div className="mb-2 flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>{buscaNormalizada || "Digite para pesquisar critérios"}</span>
          </div>

          <ScrollArea className="max-h-60 pr-1">
            <div className="space-y-1">
              {sugestoes.map((criterio) => (
                <button
                  key={criterio}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selecionarSugestao(criterio);
                  }}
                >
                  <span>{criterio}</span>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}

              {podeCriar ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-primary transition hover:bg-accent/80"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selecionarSugestao(buscaNormalizada);
                  }}
                >
                  <span>Criar &quot;{buscaNormalizada}&quot;</span>
                  <Plus className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );
}

export default function CategoriaForm({ categoria, criteriosCatalogo = [] }: CategoriaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isUpdating = !!categoria;
  const criteriosIniciais = uniqueCriterios(categoria?.criterios?.map((criterio) => criterio.nome) ?? []);
  const criteriosDisponiveis = mergeCriterios(
    criteriosCatalogo.map((criterio) => criterio.nome),
    criteriosIniciais,
  );

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: categoria?.nome ?? "",
      descricao: categoria?.descricao ?? "",
      criterios: criteriosIniciais,
    },
  });

  useEffect(() => {
    form.reset({
      nome: categoria?.nome ?? "",
      descricao: categoria?.descricao ?? "",
      criterios: uniqueCriterios(categoria?.criterios?.map((criterio) => criterio.nome) ?? []),
    });
  }, [categoria, form]);

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const payload = {
          nome: values.nome.trim(),
          descricao: values.descricao?.trim() || null,
          criterios: uniqueCriterios(values.criterios),
        };

        const res = await fetch(
          isUpdating && categoria ? `/api/avaliacaolimpezas/categorias/${categoria.id}` : "/api/avaliacaolimpezas/categorias",
          {
            method: isUpdating && categoria ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        const data = await res.json();

        if (!res.ok) {
          toast.error(isUpdating ? "Erro ao atualizar categoria" : "Erro ao cadastrar categoria", {
            description: data.error ?? "Verifique os dados informados.",
          });
          return;
        }

        toast.success(isUpdating ? "Categoria atualizada" : "Categoria cadastrada");
        router.push("/avaliacao-limpeza/categorias");
        router.refresh();
      } catch {
        toast.error("Falha na comunicação com o servidor");
      }
    });
  }

  async function removerCategoria() {
    if (!categoria) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/avaliacaolimpezas/categorias/${categoria.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Erro ao remover categoria", {
          description: data.error ?? "Não foi possível concluir a exclusão.",
        });
        return;
      }

      toast.success("Categoria removida");
      setDeleteOpen(false);
      router.push("/avaliacao-limpeza/categorias");
      router.refresh();
    } catch {
      toast.error("Falha na comunicação com o servidor");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Limpeza geral" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explique o objetivo e o escopo da categoria"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="criterios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critérios vinculados</FormLabel>
              <FormControl>
                <CriteriosMultiSelect
                  value={field.value ?? []}
                  options={criteriosDisponiveis}
                  onChange={field.onChange}
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <Button asChild variant="outline">
            <Link href="/avaliacao-limpeza/categorias">Voltar para categorias</Link>
          </Button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {isUpdating && categoria && (
              <>
                <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Remover categoria
                </Button>

                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remover categoria</DialogTitle>
                      <DialogDescription>
                        Essa ação remove a categoria e os critérios vinculados que não estiverem sendo usados em outros registros.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <p className="font-medium">{categoria.nome}</p>
                      <p className="text-muted-foreground">{categoria.descricao || "Sem descrição cadastrada."}</p>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button type="button" variant="destructive" onClick={removerCategoria} disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            Removendo
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Confirmar remoção
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  {isUpdating ? "Atualizando" : "Salvando"}
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  {isUpdating ? <SquarePen className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isUpdating ? "Salvar alterações" : "Adicionar nova categoria"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}