import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();

    const { id } = await params;

    const sala =
      await prisma.salaAvaliacaoLimpeza.update({
        where: {
          id: Number(id),
        },
        data: {
          nome: body.nome,
        },
      });

    return Response.json(sala);
  } catch (error: any) {
    return Response.json(
      {
        error:
          error.message ||
          "Erro ao atualizar sala",
      },
      {
        status: 400,
      },
    );
  }
}