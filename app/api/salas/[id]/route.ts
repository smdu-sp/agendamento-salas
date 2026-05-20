import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import type { Layout } from "@prisma/client";
import { isCaminhoUploadSalaSeguro, removerArquivoLayoutImagem } from "@/lib/sala-layout-imagem";

const select = {
  id: true,
  nome: true,
  andar: true,
  numero: true,
  lotacao: true,
  layout: true,
  ativo: true,
  layoutFotos: {
    select: { id: true, descricao: true, imagemUrl: true, ordem: true },
    orderBy: [{ ordem: "asc" as const }, { criadoEm: "asc" as const }],
  },
  mobiliarios: {
    select: { id: true, nome: true, quantidade: true },
    orderBy: { nome: "asc" as const },
  },
  midias: {
    select: { id: true, nome: true, quantidade: true },
    orderBy: { nome: "asc" as const },
  },
};

type ItemPayload = { nome?: string; quantidade?: number };

function normalizarItens(items: unknown): { nome: string; quantidade: number }[] {
  if (!Array.isArray(items)) return [];
  const normalizados = items
    .map((item) => {
      const raw = (item ?? {}) as ItemPayload;
      const nome = typeof raw.nome === "string" ? raw.nome.trim() : "";
      const quantidade =
        typeof raw.quantidade === "number" &&
        Number.isFinite(raw.quantidade) &&
        raw.quantidade > 0
          ? Math.trunc(raw.quantidade)
          : 0;
      if (!nome || quantidade <= 0) return null;
      return { nome, quantidade };
    })
    .filter((x): x is { nome: string; quantidade: number } => !!x);

  const mapa = new Map<string, number>();
  for (const item of normalizados) {
    mapa.set(item.nome, (mapa.get(item.nome) ?? 0) + item.quantidade);
  }
  return Array.from(mapa.entries()).map(([nome, quantidade]) => ({ nome, quantidade }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const usuario = (session as any).usuario;
  const permissao = usuario?.permissao;
  if (permissao !== "ADM" && permissao !== "DEV") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const salaExiste = await prisma.salaReserva.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!salaExiste) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }
  let body: {
    nome?: string;
    andar?: string;
    numero?: string;
    lotacao?: number;
    layout?: string;
    ativo?: boolean;
    mobiliarios?: ItemPayload[];
    midias?: ItemPayload[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 }
    );
  }
  const data: {
    nome?: string;
    andar?: string | null;
    numero?: string | null;
    lotacao?: number | null;
    layout?: Layout | null;
    ativo?: boolean;
    layoutFotos?: { deleteMany: {} };
    mobiliarios?: { deleteMany: {}; create: { nome: string; quantidade: number }[] };
    midias?: { deleteMany: {}; create: { nome: string; quantidade: number }[] };
  } = {};
  if (typeof body.nome === "string") {
    const nome = body.nome.trim();
    if (nome) {
      const existente = await prisma.salaReserva.findFirst({
        where: { nome, id: { not: id } },
      });
      if (existente) {
        return NextResponse.json(
          { error: "Já existe uma sala com este nome" },
          { status: 409 }
        );
      }
      data.nome = nome;
    }
  }
  if (body.andar !== undefined) {
    data.andar =
      typeof body.andar === "string" ? body.andar.trim() || null : null;
  }
  if (body.numero !== undefined) {
    data.numero =
      typeof body.numero === "string"
        ? body.numero.trim() || null
        : null;
  }
  if (body.lotacao !== undefined) {
    data.lotacao =
      typeof body.lotacao === "number" &&
      Number.isFinite(body.lotacao) &&
      body.lotacao > 0
        ? Math.trunc(body.lotacao)
        : null;
  }
  if (body.layout !== undefined) {
    const layoutRaw = typeof body.layout === "string" ? body.layout.trim().toUpperCase() : "";
    data.layout =
      layoutRaw === "FIXO" || layoutRaw === "MOVEL"
        ? (layoutRaw as Layout)
        : null;
    if (data.layout === "FIXO" || data.layout === null) {
      const fotos = await prisma.salaLayoutFoto.findMany({
        where: { salaId: id },
        select: { imagemUrl: true },
      });
      for (const f of fotos) {
        if (f.imagemUrl && isCaminhoUploadSalaSeguro(f.imagemUrl)) {
          await removerArquivoLayoutImagem(f.imagemUrl);
        }
      }
      data.layoutFotos = { deleteMany: {} };
    }
  }
  if (body.mobiliarios !== undefined) {
    const mobiliarios = normalizarItens(body.mobiliarios);
    data.mobiliarios = {
      deleteMany: {},
      create: mobiliarios.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
      })),
    };
  }
  if (body.midias !== undefined) {
    const midias = normalizarItens(body.midias);
    data.midias = {
      deleteMany: {},
      create: midias.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
      })),
    };
  }
  if (typeof body.ativo === "boolean") data.ativo = body.ativo;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo para atualizar" },
      { status: 400 }
    );
  }
  const sala = await prisma.salaReserva.update({
    where: { id },
    data,
    select,
  });

  return NextResponse.json(sala);
}
