'use client';

import type { SalaAvaliacaoLimpeza } from '@/prisma/generated/edge';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SquarePen } from 'lucide-react';
import ModalDelete from './modal-delete';

export type SalaRow = Pick<
	SalaAvaliacaoLimpeza,
	'id' | 'nome'
>;

export const columns: ColumnDef<SalaRow>[] = [
	{
		accessorKey: 'nome',
		header: 'Nome',
	},
	{
		accessorKey: 'actions',
		header: () => <p className="text-center">Ações</p>,
		cell: ({ row }) => (
			<div
				className="flex items-center justify-center"
				key={row.id}
			>
				<Link href={`/avaliacao-limpeza/salas/${row.original.id}`}>
					<Button
						variant="outline"
						size="icon"
						aria-label="Editar sala"
						type="button"
					>
						<SquarePen size={18} />
					</Button>
				</Link>
			</div>
		),
	},
];