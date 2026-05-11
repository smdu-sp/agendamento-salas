import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

function normalizeCriteria(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const cleaned = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function deleteCriteriaChain(tx: typeof prisma, criterioIds: number[]) {
  if (criterioIds.length === 0) return;

  const avaliacaoCriterios = await tx.avaliacaoCriterio.findMany({
    where: { criterioAvaliacaoId: { in: criterioIds } },
    select: { id: true },
  });

  const avaliacaoCriterioIds = avaliacaoCriterios.map((item) => item.id);

  if (avaliacaoCriterioIds.length > 0) {
    await tx.arquivoAvaliacao.deleteMany({
      where: { avaliacaoCriterioId: { in: avaliacaoCriterioIds } },
    });
  }

  await tx.avaliacaoCriterio.deleteMany({
    where: { criterioAvaliacaoId: { in: criterioIds } },
  });

  await tx.criterio.deleteMany({
    where: { id: { in: criterioIds } },
  });
}

async function ensureAccess() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }

  const usuario = (session as any).usuario;
  if (usuario?.permissao !== "ADM" && usuario?.permissao !== "DEV") {
    return { error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  }

  return { session };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await ensureAccess();
  if ("error" in access) return access.error;

  const { id } = await params;
  const categoriaId = Number(id);
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: { nome?: string; descricao?: string | null; criterios?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) {
    return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
  }

  const descricao = typeof body.descricao === "string" ? body.descricao.trim() || null : null;
  const criteriosRecebidos = normalizeCriteria(body.criterios);

  const categoriaExistente = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    include: {
      criterios: {
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      },
    },
  });

  if (!categoriaExistente) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const conflito = await prisma.categoria.findFirst({
    where: { nome, id: { not: categoriaId } },
  });

  if (conflito) {
    return NextResponse.json({ error: "Já existe uma categoria com este nome" }, { status: 409 });
  }

  const categoria = await prisma.$transaction(async (tx) => {
    await tx.categoria.update({
      where: { id: categoriaId },
      data: { nome, descricao },
    });

    const criteriosAtuais = await tx.criterio.findMany({
      where: { categoriaAvaliacaoId: categoriaId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    const criteriosAtuaisPorNome = new Map(
      criteriosAtuais.map((criterio) => [criterio.nome.toLowerCase(), criterio]),
    );

    const nomesMantidos = new Set<string>();

    for (const criterioNome of criteriosRecebidos) {
      const criterioExistente = criteriosAtuaisPorNome.get(criterioNome.toLowerCase());

      if (criterioExistente) {
        nomesMantidos.add(criterioExistente.nome.toLowerCase());

        if (criterioExistente.nome !== criterioNome) {
          await tx.criterio.update({
            where: { id: criterioExistente.id },
            data: { nome: criterioNome },
          });
        }

        continue;
      }

      await tx.criterio.create({
        data: {
          categoriaAvaliacaoId: categoriaId,
          nome: criterioNome,
        },
      });
    }

    const criteriosRemovidos = criteriosAtuais.filter(
      (criterio) => !nomesMantidos.has(criterio.nome.toLowerCase()) && !criteriosRecebidos.some((item) => item.toLowerCase() === criterio.nome.toLowerCase()),
    );

    await deleteCriteriaChain(tx, criteriosRemovidos.map((criterio) => criterio.id));

    return tx.categoria.findUnique({
      where: { id: categoriaId },
      include: {
        criterios: {
          select: { id: true, nome: true },
          orderBy: { nome: "asc" },
        },
      },
    });
  });

  return NextResponse.json(categoria);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await ensureAccess();
  if ("error" in access) return access.error;

  const { id } = await params;
  const categoriaId = Number(id);
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
    select: { id: true },
  });

  if (!categoria) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    const criterios = await tx.criterio.findMany({
      where: { categoriaAvaliacaoId: categoriaId },
      select: { id: true },
    });

    await deleteCriteriaChain(
      tx,
      criterios.map((criterio) => criterio.id),
    );

    await tx.categoria.delete({
      where: { id: categoriaId },
    });
  });

  return NextResponse.json({ ok: true });
}