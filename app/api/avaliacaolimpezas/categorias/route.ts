import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

function normalizeCriterionName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCriteria(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const cleaned = values
    .map((value) => (typeof value === "string" ? normalizeCriterionName(value) : ""))
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

type CriterioEmUso = {
  nome: string;
  categoriaNome: string;
};

async function findCriterionConflicts(db: typeof prisma, criterioNomes: string[], categoriaId?: number) {
  if (criterioNomes.length === 0) return [];

  const criteriosEmUso = await db.criterio.findMany({
    where: {
      categoria: {
        ativo: true,
        ...(categoriaId ? { id: { not: categoriaId } } : {}),
      },
    },
    select: {
      nome: true,
      categoria: {
        select: { nome: true },
      },
    },
  });

  const usadosPorNome = new Map<string, CriterioEmUso>();
  for (const criterio of criteriosEmUso) {
    const chave = normalizeCriterionName(criterio.nome).toLowerCase();
    if (usadosPorNome.has(chave)) continue;

    usadosPorNome.set(chave, {
      nome: criterio.nome,
      categoriaNome: criterio.categoria.nome,
    });
  }

  return criterioNomes
    .map((nome) => {
      const conflito = usadosPorNome.get(normalizeCriterionName(nome).toLowerCase());
      return conflito ? { nome, categoriaNome: conflito.categoriaNome } : null;
    })
    .filter((item): item is CriterioEmUso => item !== null);
}

function formatCriterionConflictMessage(conflitos: CriterioEmUso[]) {
  const nomes = conflitos.map((item) => `"${item.nome}"`);
  const categorias = new Set(conflitos.map((item) => item.categoriaNome));

  if (conflitos.length === 1 && categorias.size === 1) {
    return `O critério ${nomes[0]} já está vinculado à categoria ${conflitos[0].categoriaNome}`;
  }

  return `Os critérios ${nomes.join(", ")} já estão vinculados a outras categorias`;
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

export async function GET() {
  const access = await ensureAccess();
  if ("error" in access) return access.error;

  const lista = await prisma.categoria.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    include: {
      criterios: {
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      },
    },
  });

  return NextResponse.json(lista);
}

export async function POST(request: NextRequest) {
  const access = await ensureAccess();
  if ("error" in access) return access.error;

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
  const criterios = normalizeCriteria(body.criterios);

  const existente = await prisma.categoria.findFirst({ where: { nome } });
  if (existente) {
    return NextResponse.json({ error: "Já existe uma categoria com este nome" }, { status: 409 });
  }

  const conflitosCriterios = await findCriterionConflicts(prisma, criterios);
  if (conflitosCriterios.length > 0) {
    return NextResponse.json(
      { error: formatCriterionConflictMessage(conflitosCriterios) },
      { status: 409 },
    );
  }

  const categoria = await prisma.$transaction(async (tx) => {
    const criada = await tx.categoria.create({
      data: { nome, descricao },
      select: { id: true },
    });

    if (criterios.length > 0) {
      await tx.criterio.createMany({
        data: criterios.map((criterio) => ({
          categoriaAvaliacaoId: criada.id,
          nome: criterio,
        })),
      });
    }

    return tx.categoria.findUnique({
      where: { id: criada.id },
      include: {
        criterios: {
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        },
      },
    });
  });

  return NextResponse.json(categoria, { status: 201 });
}