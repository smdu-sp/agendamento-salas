import FormSala from "../_components/form-sala";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function FormularioSalas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sala =
    id !== "nova"
      ? await prisma.salaReserva.findUnique({
          where: {
            id,
          },

          include: {
            layoutFotos: {
              orderBy: {
                ordem: "asc",
              },
            },

            mobiliarios: true,

            midias: true,
          },
        })
      : null;

  if (id !== "nova" && !sala) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {id === "nova"
            ? "Cadastrar Sala"
            : "Editar Sala"}
        </h1>

        <p className="text-muted-foreground">
          {id === "nova"
            ? "Preencha os dados para cadastrar uma nova sala."
            : "Altere os dados da sala."}
        </p>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <FormSala
          key={
            id === "nova"
              ? "nova"
              : String(sala?.id ?? "edit")
          }
          sala={sala}
          isUpdating={!!sala}
          className="space-y-6"
        />
      </div>
    </div>
  );
}