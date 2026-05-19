"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginacaoProps {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;

  limitePorPagina: number;

  labelItemSingular?: string;
  labelItemPlural?: string;

  onPageChange: (pagina: number) => void;
  onLimiteChange: (limite: number) => void;
}

export function Paginacao({
  paginaAtual,
  totalPaginas,
  totalItens,
  limitePorPagina,
  labelItemSingular = "item",
  labelItemPlural = "itens",

  onPageChange,
  onLimiteChange,
}: PaginacaoProps) {
  const MAX_BOTOES_VISIVEIS = 5;

  const opcoesLimite = [1, 2, 5, 10, 15, 20, 30, 50];

  const getPaginasVisiveis = () => {
    const paginas: (number | string)[] = [];

    if (totalPaginas <= MAX_BOTOES_VISIVEIS) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
      return paginas;
    }

    paginas.push(1);

    let startPage = Math.max(
      2,
      paginaAtual - Math.floor((MAX_BOTOES_VISIVEIS - 3) / 2),
    );

    let endPage = Math.min(
      totalPaginas - 1,
      startPage + MAX_BOTOES_VISIVEIS - 3,
    );

    if (endPage - startPage < MAX_BOTOES_VISIVEIS - 3) {
      startPage = Math.max(2, endPage - (MAX_BOTOES_VISIVEIS - 3));
    }

    if (startPage > 2) {
      paginas.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      paginas.push(i);
    }

    if (endPage < totalPaginas - 1) {
      paginas.push("...");
    }

    paginas.push(totalPaginas);

    return paginas;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-sm">
      <span className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
        Página {paginaAtual} de {totalPaginas} ({totalItens}{" "}
        {totalItens === 1 ? labelItemSingular : labelItemPlural})
      </span>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={paginaAtual <= 1}
          onClick={() => onPageChange(Math.max(1, paginaAtual - 1))}
          className="h-9 w-9 p-0"
        >
          &lt;
        </Button>

        {getPaginasVisiveis().map((pagina, index) => {
          if (pagina === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            );
          }

          return (
            <Button
              key={`page-${pagina}`}
              size="sm"
              variant={paginaAtual === pagina ? "default" : "outline"}
              onClick={() => onPageChange(pagina as number)}
              className="h-9 w-9 p-0"
            >
              {pagina}
            </Button>
          );
        })}

        <Button
          size="sm"
          variant="outline"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => onPageChange(Math.min(totalPaginas, paginaAtual + 1))}
          className="h-9 w-9 p-0"
        >
          &gt;
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs sm:text-sm">
          Itens por página:
        </span>

        <Select
          value={String(limitePorPagina)}
          onValueChange={(value) => onLimiteChange(Number(value))}
        >
          <SelectTrigger className="w-[70px] h-9">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {opcoesLimite.map((opcao) => (
              <SelectItem key={opcao} value={String(opcao)}>
                {opcao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
