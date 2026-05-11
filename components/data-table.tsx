/** @format */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Paginacao } from './paginacao';

export { Skeleton as TableSkeleton };

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	className?: string;
	totalItens?: number;
	labelItemSingular?: string;
	labelItemPlural?: string;
	onLimiteChange?: (limite: number) => void;
}

export default function DataTable<TData, TValue>({
	columns,
	data,
	className,
	totalItens = 0,
	labelItemSingular = "item",
	labelItemPlural = "itens",
	onLimiteChange,
}: DataTableProps<TData, TValue>) {
	const [paginaAtual, setPaginaAtual] = useState(1);
	const [limitePorPagina, setLimitePorPagina] = useState(10);

	const totalItensReal = totalItens || data.length;
	const totalPaginas = Math.ceil(totalItensReal / limitePorPagina) || 1;

	const dadosPaginados = useMemo(() => {
		const indiceInicial = (paginaAtual - 1) * limitePorPagina;
		const indiceFinal = indiceInicial + limitePorPagina;
		return data.slice(indiceInicial, indiceFinal);
	}, [data, paginaAtual, limitePorPagina]);

	const table = useReactTable({
		data: dadosPaginados,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const handlePageChange = useCallback((novoNumero: number) => {
		if (novoNumero >= 1 && novoNumero <= totalPaginas) {
			setPaginaAtual(novoNumero);
		}
	}, [totalPaginas]);

	const handleLimiteChange = useCallback((novoLimite: number) => {
		setLimitePorPagina(novoLimite);
		setPaginaAtual(1);
		if (onLimiteChange) {
			onLimiteChange(novoLimite);
		}
	}, [onLimiteChange]);

	useEffect(() => {
		setPaginaAtual(1);
	}, [data]);

	return (
		<div className={cn("w-full overflow-x-auto rounded-md border", className)}>
			<Table className="bg-background dark:bg-muted/50 w-full min-w-full">
				<TableHeader className="bg-primary hover:bg-primary">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow className="hover:bg-primary" key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									className="text-white text-xs sm:text-sm text-nowrap px-2 sm:px-4 py-2 sm:py-3"
									key={header.id}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								className="hover:bg-muted/50 transition-colors"
								key={row.id}
								data-state={row.getIsSelected() ? 'selected' : undefined}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-light break-words"
									>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground"
							>
								Sem resultados.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<Paginacao
				paginaAtual={paginaAtual}
				totalPaginas={totalPaginas}
				totalItens={totalItensReal}
				limitePorPagina={limitePorPagina}
				labelItemSingular={labelItemSingular}
				labelItemPlural={labelItemPlural}
				onPageChange={handlePageChange}
				onLimiteChange={handleLimiteChange}
			/>
		</div>
	);
}