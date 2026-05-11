import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const salas =
      await prisma.salaAvaliacaoLimpeza.findMany({
        orderBy: {
          nome: "asc",
        },
      });

    return Response.json(salas);
  } catch (error: any) {
    return Response.json(
      {
        error:
          error.message ||
          "Erro ao buscar salas",
      },
      {
        status: 400,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request.json();

    const sala =
      await prisma.salaAvaliacaoLimpeza.create({
        data: {
          nome: body.nome,
        },
      });

    return Response.json(sala, {
      status: 201,
    });
  } catch (error: any) {
    return Response.json(
      {
        error:
          error.message ||
          "Erro ao criar sala",
      },
      {
        status: 400,
      },
    );
  }
}