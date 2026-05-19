import { SalasContent } from "./_components/salas-content";

interface PageProps {
  searchParams: Promise<{
    pagina?: string;
    limite?: string;
  }>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const { pagina, limite } = await searchParams;

  const paginaNum =
    Number(pagina) || 1;

  const limiteNum =
    Number(limite) || 10;

  return (
    <SalasContent
      pagina={paginaNum}
      limite={limiteNum}
    />
  );
}