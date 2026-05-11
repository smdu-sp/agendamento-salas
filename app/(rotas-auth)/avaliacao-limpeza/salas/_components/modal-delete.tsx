'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, Power, PowerOff } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

export default function ModalDelete({
	id,
	status,
}: {
	id: string;
	status: boolean;
}) {
	const [isPending, startTransition] = useTransition();

	async function handleAction() {
		try {
			const res = await fetch(`/api/salas/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ativo: status }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				toast.error('Erro', { description: data.error ?? 'Falha ao alterar status da sala.' });
				return;
			}
			toast.success(
				status ? 'Sala ativada com sucesso' : 'Sala desativada com sucesso',
			);
			window.location.reload();
		} catch {
			toast.error('Erro', { description: 'Falha na comunicação com o servidor.' });
		}
	}

	const labelAcao = status ? 'Ativar sala' : 'Desativar sala';

	return (
		<Dialog>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							type="button"
							size="icon"
							variant="outline"
							aria-label={labelAcao}
							className={
								status
									? 'hover:bg-primary cursor-pointer hover:text-white group transition-all ease-linear duration-200'
									: 'hover:bg-destructive cursor-pointer hover:text-white group transition-all ease-linear duration-200'
							}
						>
							{status ? (
								<Power size={24} className="text-primary dark:text-white group-hover:text-white group" />
							) : (
								<PowerOff size={24} className="text-destructive dark:text-white group-hover:text-white group" />
							)}
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent side="top">
					<p>{labelAcao}</p>
				</TooltipContent>
			</Tooltip>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{status ? 'Ativar Sala' : 'Desativar Sala'}
					</DialogTitle>
				</DialogHeader>
				<p>
					{status
						? 'Tem certeza que deseja ativar esta sala?'
						: 'Tem certeza que deseja desativar esta sala? Salas desativadas não aparecem para reserva.'}
				</p>
				<DialogFooter>
					<div className="flex gap-2">
						<DialogClose asChild>
							<Button id="close" variant="outline">
								Voltar
							</Button>
						</DialogClose>
						<Button
							disabled={isPending}
							onClick={() => startTransition(() => handleAction())}
							type="button"
							variant={status ? 'default' : 'destructive'}
						>
							{isPending ? (
								<Loader2 className="animate-spin" />
							) : status ? (
								'Ativar'
							) : (
								'Desativar'
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
