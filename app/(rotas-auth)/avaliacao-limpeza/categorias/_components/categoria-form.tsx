"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, SquarePen, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

type CategoriaFormData = {
  id: number;
  nome: string;
  descricao: string | null;
  criterios: Array<{ id: number; nome: string }>;
};

type CategoriaFormProps = {
  categoria?: CategoriaFormData;
};

const formSchema = z.object({
  nome: z.string().min(3, "Informe o nome da categoria"),
  descricao: z.string().optional().or(z.literal("")),
  criterios: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

function parseCriterios(valor?: string) {
  const encontrados = (valor ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(encontrados.map((item) => item.toLowerCase()))).map((lower) => {
    return encontrados.find((item) => item.toLowerCase() === lower) ?? lower;
  });
}

export default function CategoriaForm({ categoria }: CategoriaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isUpdating = !!categoria;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: categoria?.nome ?? "",
      descricao: categoria?.descricao ?? "",
      criterios: categoria?.criterios?.map((criterio) => criterio.nome).join("\n") ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      nome: categoria?.nome ?? "",
      descricao: categoria?.descricao ?? "",
      criterios: categoria?.criterios?.map((criterio) => criterio.nome).join("\n") ?? "",
    });
  }, [categoria, form]);

  const criteriosDigitados = parseCriterios(form.watch("criterios"));

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const payload = {
          nome: values.nome.trim(),
          descricao: values.descricao?.trim() || null,
          criterios: parseCriterios(values.criterios),
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
                <Textarea
                  placeholder={"Digite um critério por linha ou use vírgulas\nEx.: Pisos\nParedes\nPortas"}
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />

              {criteriosDigitados.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Prévia dos critérios
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {criteriosDigitados.map((criterio) => (
                      <Badge key={criterio} variant="secondary" className="normal-case">
                        {criterio}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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