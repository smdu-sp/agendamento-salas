"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { SalaAvaliacaoLimpeza } from "@/prisma/generated/edge";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  nome: z.string().min(1, "Nome da sala é obrigatório"),
});

type FormSalaValues = {
  nome: string;
};

interface FormSalaProps {
  isUpdating: boolean;
  sala?: SalaAvaliacaoLimpeza | null;

  className?: string;
}

export default function FormSala({
  isUpdating,
  sala,
  className: formClassName,
}: FormSalaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSalaValues>({
    resolver: zodResolver(formSchema) as Resolver<FormSalaValues>,
    defaultValues: {
      nome: sala?.nome ?? "",
    },
  });

  async function onSubmit(values: FormSalaValues) {
    startTransition(async () => {
      try {
        const payload = {
          nome: values.nome.trim(),
        };

        if (isUpdating && sala?.id) {
          const res = await fetch(
            `/api/avaliacaolimpezas/salas/${sala.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          );

          const data = await res.json();

          if (!res.ok) {
            toast.error("Erro ao atualizar", {
              description: data.error,
            });

            return;
          }

          toast.success("Sala atualizada");
        } else {
          const res = await fetch(
            "/api/avaliacaolimpezas/salas",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          );

          const data = await res.json();

          if (!res.ok) {
            toast.error("Erro ao cadastrar", {
              description: data.error,
            });

            return;
          }

          toast.success("Sala cadastrada");
        }

        router.push("/avaliacao-limpeza/salas");
        router.refresh();
      } catch {
        toast.error(
          "Falha na comunicação com o servidor",
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "flex flex-col gap-4",
          formClassName,
        )}
      >
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nome da sala
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="Ex: Sala de reunião"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isPending}
          >
            {isUpdating
              ? "Salvar"
              : "Cadastrar"}

            {isPending && (
              <Loader2 className="ml-2 size-4 animate-spin" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}