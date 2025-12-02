import React, { useState, useEffect } from 'react';
import {
	Usuario,
	Instituicao,
	Grupo,
	Autor,
	Categoria,
	PalavraChave,
	LogSistema,
	SolicitacaoAprovacao,
	RecursoEducacional,
} from '../types';
import { api } from '../services/api';
import Navbar from './Navbar';

const ADMIN_SECTIONS = [
	{
		id: 'content',
		label: 'Conteúdo',
		description: 'Materiais, taxonomias e palavras-chave.',
		tabs: [
			{ id: 'recursos', label: 'Recursos educacionais' },
			{ id: 'autores', label: 'Autores' },
			{ id: 'categorias', label: 'Categorias' },
			{ id: 'palavras', label: 'Palavras-chave' },
		],
	},
	{
		id: 'network',
		label: 'Organizações',
		description: 'Estruture instituições e grupos parceiros.',
		tabs: [
			{ id: 'instituicoes', label: 'Instituições' },
			{ id: 'grupos', label: 'Grupos' },
		],
	},
	{
		id: 'operations',
		label: 'Fluxo & Auditoria',
		description: 'Monitore solicitações e registros do sistema.',
		tabs: [
			{ id: 'solicitacoes', label: 'Solicitações' },
			{ id: 'logs', label: 'Logs do sistema' },
		],
	},
	{
		id: 'settings',
		label: 'Configurações',
		description: 'Gerencie a equipe e os níveis de acesso.',
		tabs: [{ id: 'usuarios', label: 'Usuários & Permissões' }],
	},
];

const ADMIN_TABS = ADMIN_SECTIONS.flatMap((section) =>
	section.tabs.map((tab) => tab.id)
);

const USER_LEVEL_LABEL_TO_BACKEND: Record<string, string> = {
	Usuario: 'usuario',
	Colaborador: 'colaborador',
	Administrador: 'administrador',
};

const BACKEND_TO_USER_LEVEL_LABEL = Object.entries(
	USER_LEVEL_LABEL_TO_BACKEND
).reduce<Record<string, string>>((acc, [label, backendValue]) => {
	acc[backendValue] = label;
	return acc;
}, {});

const normalizeNivelForBackend = (value?: string) => {
	if (!value) return value;
	const labelMatch = USER_LEVEL_LABEL_TO_BACKEND[value];
	if (labelMatch) return labelMatch;
	const lower = value.toLowerCase();
	return BACKEND_TO_USER_LEVEL_LABEL[lower]
		? USER_LEVEL_LABEL_TO_BACKEND[BACKEND_TO_USER_LEVEL_LABEL[lower]]
		: lower;
};

const mapNivelForForm = (value?: string) => {
	if (!value) return 'Usuario';
	return BACKEND_TO_USER_LEVEL_LABEL[value] || value;
};

interface AdminDashboardProps {
	currentUser: Usuario | null;
	onLogout: () => void;
	showToast: (message: string, type: 'success' | 'error' | 'info') => void;
	refreshMaterials: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
	currentUser,
	onLogout,
	showToast,
	refreshMaterials,
}) => {
	const [activeTab, setActiveTab] = useState(() => {
		if (typeof window !== 'undefined') {
			const stored = window.localStorage.getItem('admin-active-tab');
			if (stored && ADMIN_TABS.includes(stored)) return stored;
		}
		return 'recursos';
	});
	const [formKey, setFormKey] = useState(0);

	// Data States
	const [recursos, setRecursos] = useState<RecursoEducacional[]>([]);
	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
	const [grupos, setGrupos] = useState<Grupo[]>([]);
	const [autores, setAutores] = useState<Autor[]>([]);
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [palavras, setPalavras] = useState<PalavraChave[]>([]);
	const [logs, setLogs] = useState<LogSistema[]>([]);
	const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAprovacao[]>(
		[]
	);

	// Form/Modal States
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [deleteDialog, setDeleteDialog] = useState<{
		id: number;
		type: string;
		label?: string;
	} | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const activeSection = ADMIN_SECTIONS.find((section) =>
		section.tabs.some((tab) => tab.id === activeTab)
	);
	const activeTabMeta = activeSection?.tabs.find(
		(tab) => tab.id === activeTab
	);

	const getCollectionForTab = () => {
		switch (activeTab) {
			case 'recursos':
				return recursos;
			case 'instituicoes':
				return instituicoes;
			case 'grupos':
				return grupos;
			case 'autores':
				return autores;
			case 'categorias':
				return categorias;
			case 'palavras':
				return palavras;
			case 'usuarios':
				return usuarios;
			case 'logs':
				return logs;
			case 'solicitacoes':
				return solicitacoes;
			default:
				return [];
		}
	};

	const activeCollection = getCollectionForTab();
	const isReadOnlyTab = ['logs', 'solicitacoes'].includes(activeTab);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem('admin-active-tab', activeTab);
		}
	}, [activeTab]);

	// Load Data based on Tab
	useEffect(() => {
		loadTabData();
	}, [activeTab]);

	const loadTabData = async () => {
		try {
			switch (activeTab) {
				case 'recursos': {
					const [recData, autData, catData] = await Promise.all([
						api.recursos.getAll(),
						api.autores.getAll(),
						api.categorias.getAll(),
					]);
					setRecursos(recData);
					setAutores(autData);
					setCategorias(catData);
					break;
				}
				case 'usuarios': {
					const [userData, grpData] = await Promise.all([
						api.usuarios.getAll(),
						api.grupos.getAll(),
					]);
					setUsuarios(userData);
					setGrupos(grpData);
					break;
				}
				case 'instituicoes': {
					const instData = await api.instituicoes.getAll();
					setInstituicoes(instData);
					break;
				}
				case 'grupos': {
					const [grpData, instData] = await Promise.all([
						api.grupos.getAll(),
						api.instituicoes.getAll(),
					]);
					setGrupos(grpData);
					setInstituicoes(instData);
					break;
				}
				case 'autores': {
					const autData = await api.autores.getAll();
					setAutores(autData);
					break;
				}
				case 'categorias': {
					const catData = await api.categorias.getAll();
					setCategorias(catData);
					break;
				}
				case 'palavras': {
					const palData = await api.palavrasChave.getAll();
					setPalavras(palData);
					break;
				}
				case 'logs': {
					const logData = await api.logs.getAll();
					setLogs(logData);
					break;
				}
				case 'solicitacoes': {
					const solData = await api.solicitacoes.getAll();
					setSolicitacoes(solData);
					break;
				}
			}
		} catch (error) {
			console.error(error);
			showToast('Erro ao carregar dados da aba.', 'error');
		}
	};

	// Handlers for Delete
	const openDeleteDialog = (id: number, type: string, label?: string) => {
		setDeleteDialog({ id, type, label });
	};

	const handleDeleteConfirm = async () => {
		if (!deleteDialog) return;
		setDeleteLoading(true);
		try {
			// @ts-ignore - dynamic access
			await api[deleteDialog.type].delete(deleteDialog.id);
			showToast('Item excluído com sucesso.', 'success');
			loadTabData();
			if (deleteDialog.type === 'recursos') refreshMaterials();
			setDeleteDialog(null);
		} catch (e) {
			showToast('Erro ao excluir.', 'error');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleDeleteCancel = () => {
		if (deleteLoading) return;
		setDeleteDialog(null);
	};

	// Handlers for Approve (Resources)
	const handleApprove = async (id: number) => {
		if (!currentUser) return;
		try {
			await api.recursos.approve(id, currentUser.usuario_id);
			showToast('Recurso aprovado!', 'success');
			loadTabData();
			refreshMaterials();
		} catch (e) {
			showToast('Erro ao aprovar.', 'error');
		}
	};

	const closeForm = () => {
		setIsFormOpen(false);
		setEditingItem(null);
		setFormKey((prev) => prev + 1);
	};

	// --- Generic Form Handler (Simplified for brevity) ---
	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const data: any = Object.fromEntries(formData.entries());

		// Basic type conversion
		[
			'fk_instituicao_id',
			'fk_grupo_id',
			'fk_autor_id',
			'fk_categoria_id',
			'fk_usuario_id_publicador',
		].forEach((key) => {
			if (data[key]) data[key] = Number(data[key]);
		});

		if (activeTab === 'usuarios' && data.nivel) {
			data.nivel = normalizeNivelForBackend(data.nivel as string);
		}

		try {
			let endpointType = activeTab;
			if (activeTab === 'palavras') endpointType = 'palavrasChave';

			if (editingItem) {
				// @ts-ignore
				await api[endpointType].update(
					editingItem[Object.keys(editingItem)[0]],
					data
				);
				showToast('Atualizado com sucesso!', 'success');
			} else {
				if (activeTab === 'recursos' && currentUser) {
					data.fk_usuario_id_publicador = currentUser.usuario_id;
					data.status = 'pendente';
					data.contagem_downloads = 0;
				}
				// @ts-ignore
				await api[endpointType].create(data);
				showToast('Criado com sucesso!', 'success');
			}
			closeForm();
			loadTabData();
			if (activeTab === 'recursos') refreshMaterials();
		} catch (e) {
			console.error(e);
			showToast('Erro ao salvar.', 'error');
		}
	};

	const openEdit = (item: any) => {
		const normalizedItem =
			activeTab === 'usuarios'
				? { ...item, nivel: mapNivelForForm(item.nivel) }
				: item;
		setEditingItem(normalizedItem);
		setFormKey((prev) => prev + 1);
		setIsFormOpen(true);
	};

	const openNew = () => {
		setEditingItem(null);
		setFormKey((prev) => prev + 1);
		setIsFormOpen(true);
	};

	return (
		<div className="min-h-screen bg-slate-100 flex flex-col">
			<Navbar isAdmin onLogout={onLogout} />
			<div className="flex flex-1 overflow-hidden">
				<aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-slate-200 p-6 gap-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
							Painel
						</p>
						<p className="text-2xl font-bold text-tedi-dark">
							Central TEDI
						</p>
						<p className="text-sm text-slate-500 mt-1">
							Olá,{' '}
							{currentUser?.nome?.split(' ')[0] ||
								'Administrador'}
						</p>
					</div>
					<nav className="flex-1 overflow-y-auto space-y-6 pr-2">
						{ADMIN_SECTIONS.map((section) => (
							<div key={section.id}>
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
									{section.label}
								</p>
								<p className="text-xs text-slate-400 mb-2">
									{section.description}
								</p>
								<div className="space-y-1">
									{section.tabs.map((tab) => {
										const isActive = activeTab === tab.id;
										return (
											<button
												key={tab.id}
												onClick={() =>
													setActiveTab(tab.id)
												}
												className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center justify-between ${
													isActive
														? 'bg-tedi-dark text-white shadow-lg shadow-tedi-dark/20'
														: 'text-slate-600 hover:bg-slate-50'
												}`}
											>
												<span className="text-sm font-medium">
													{tab.label}
												</span>
												{isActive && (
													<span className="text-[11px] uppercase tracking-widest">
														ativo
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</nav>
					<div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
						Logado como {currentUser?.nome || 'Usuário'} ·{' '}
						{mapNivelForForm(currentUser?.nivel)}
					</div>
				</aside>
				<main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
					<div className="lg:hidden">
						<label className="text-xs font-semibold text-slate-500 uppercase">
							Selecione uma área
						</label>
						<select
							value={activeTab}
							onChange={(e) => setActiveTab(e.target.value)}
							className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 bg-white"
						>
							{ADMIN_SECTIONS.flatMap((section) =>
								section.tabs.map((tab) => (
									<option key={tab.id} value={tab.id}>
										{section.label} · {tab.label}
									</option>
								))
							)}
						</select>
					</div>

					<div className="bg-gradient-to-br from-tedi-dark to-tedi-light text-white rounded-3xl p-6 shadow-lg">
						<p className="text-xs uppercase tracking-[0.3em] text-white/70">
							{activeSection?.label || 'Visão geral'}
						</p>
						<h1 className="text-3xl font-bold mt-2">
							{activeTabMeta?.label || 'Painel Administrativo'}
						</h1>
						<p className="text-sm text-white/80 mt-2 max-w-2xl">
							{activeSection?.description ||
								'Gerencie conteúdos, fluxos e configurações do ecossistema TEDI em um único lugar.'}
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							{!isReadOnlyTab && (
								<button
									onClick={openNew}
									className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl px-4 py-2 text-sm font-semibold"
								>
									+ Novo(a){' '}
									{activeTabMeta?.label?.toLowerCase() ||
										activeTab}
								</button>
							)}
							<button
								onClick={loadTabData}
								className="bg-white text-tedi-dark rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-white/90"
							>
								Atualizar dados
							</button>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="bg-white rounded-2xl border border-slate-100 p-4">
							<p className="text-xs uppercase tracking-widest text-slate-400">
								Registros
							</p>
							<p className="text-3xl font-bold text-slate-900">
								{activeCollection.length}
							</p>
							<p className="text-xs text-slate-500">
								Itens em {activeTabMeta?.label || activeTab}
							</p>
						</div>
						<div className="bg-white rounded-2xl border border-slate-100 p-4">
							<p className="text-xs uppercase tracking-widest text-slate-400">
								Responsável
							</p>
							<p className="text-lg font-semibold text-slate-900">
								{currentUser?.nome || 'Equipe TEDI'}
							</p>
							<p className="text-xs text-slate-500">
								{mapNivelForForm(currentUser?.nivel)}
							</p>
						</div>
						<div className="bg-white rounded-2xl border border-slate-100 p-4">
							<p className="text-xs uppercase tracking-widest text-slate-400">
								Última ação
							</p>
							<p className="text-lg font-semibold text-slate-900">
								não monitorado
							</p>
							<p className="text-xs text-slate-500">
								Use "Atualizar dados" para sincronizar
							</p>
						</div>
					</div>

					<section className="bg-white rounded-3xl shadow-sm border border-slate-100">
						<header className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-xs uppercase tracking-widest text-slate-400">
									Visão atual
								</p>
								<h2 className="text-2xl font-semibold text-slate-900">
									{activeTabMeta?.label || activeTab}
								</h2>
								<p className="text-sm text-slate-500">
									{isReadOnlyTab
										? 'Consulta e acompanhamento de registros.'
										: 'Gerencie os registros e cadastre novos itens quando necessário.'}
								</p>
							</div>
							{!isReadOnlyTab && (
								<button
									onClick={openNew}
									className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-tedi-light text-white text-sm font-semibold hover:bg-tedi-dark"
								>
									Novo registro
								</button>
							)}
						</header>
						<div className="p-6">
							{activeCollection.length === 0 ? (
								<div className="text-center py-16">
									<p className="text-lg font-semibold text-slate-800">
										Nenhum registro encontrado
									</p>
									<p className="text-sm text-slate-500 mt-2">
										{isReadOnlyTab
											? 'Os dados desta seção ainda não foram carregados ou não existem registros.'
											: 'Clique em "Novo registro" para cadastrar o primeiro item.'}
									</p>
									{!isReadOnlyTab && (
										<button
											onClick={openNew}
											className="mt-6 inline-flex items-center px-4 py-2 rounded-2xl bg-tedi-dark text-white text-sm font-semibold"
										>
											Cadastrar primeiro item
										</button>
									)}
								</div>
							) : (
								<React.Fragment>
									{activeTab === 'recursos' && (
										<div className="overflow-x-auto rounded-2xl border border-slate-100">
											<table className="w-full text-left">
												<thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
													<tr>
														<th className="px-4 py-3">
															ID
														</th>
														<th className="px-4 py-3">
															Título
														</th>
														<th className="px-4 py-3">
															Status
														</th>
														<th className="px-4 py-3">
															Autor
														</th>
														<th className="px-4 py-3">
															Ações
														</th>
													</tr>
												</thead>
												<tbody>
													{recursos.map((r) => (
														<tr
															key={r.recurso_id}
															className="border-t border-slate-100 hover:bg-slate-50"
														>
															<td className="px-4 py-3 font-mono text-sm text-slate-500">
																#{r.recurso_id}
															</td>
															<td className="px-4 py-3 font-semibold text-slate-800">
																{r.titulo}
															</td>
															<td className="px-4 py-3">
																<span
																	className={`px-3 py-1 rounded-full text-xs font-semibold ${
																		r.status ===
																		'aprovado'
																			? 'bg-emerald-100 text-emerald-700'
																			: 'bg-amber-100 text-amber-700'
																	}`}
																>
																	{r.status}
																</span>
															</td>
															<td className="px-4 py-3 text-slate-600">
																{r.autores
																	?.nome ||
																	'—'}
															</td>
															<td className="px-4 py-3 flex flex-wrap gap-3 text-sm">
																{r.status ===
																	'pendente' && (
																	<button
																		onClick={() =>
																			handleApprove(
																				r.recurso_id
																			)
																		}
																		className="text-emerald-600 hover:underline"
																	>
																		Aprovar
																	</button>
																)}
																<button
																	onClick={() =>
																		openEdit(
																			r
																		)
																	}
																	className="text-blue-600 hover:underline"
																>
																	Editar
																</button>
																<button
																	onClick={() =>
																		openDeleteDialog(
																			r.recurso_id,
																			'recursos',
																			r.titulo
																		)
																	}
																	className="text-rose-600 hover:underline"
																>
																	Excluir
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}

									{activeTab === 'instituicoes' && (
										<ul className="divide-y divide-slate-100">
											{instituicoes.map((i) => (
												<li
													key={i.instituicao_id}
													className="py-3 flex items-center justify-between"
												>
													<div>
														<p className="font-medium text-slate-800">
															{i.nome}
														</p>
														<p className="text-xs text-slate-500">
															ID{' '}
															{i.instituicao_id}
														</p>
													</div>
													<div className="flex gap-2 text-sm">
														<button
															onClick={() =>
																openEdit(i)
															}
															className="text-blue-600 hover:underline"
														>
															Editar
														</button>
														<button
															onClick={() =>
																openDeleteDialog(
																	i.instituicao_id,
																	'instituicoes',
																	i.nome
																)
															}
															className="text-rose-600 hover:underline"
														>
															Excluir
														</button>
													</div>
												</li>
											))}
										</ul>
									)}

									{activeTab === 'logs' && (
										<div className="overflow-x-auto rounded-2xl border border-slate-100">
											<table className="w-full text-sm text-left">
												<thead className="bg-slate-50 uppercase tracking-widest text-[11px] text-slate-500">
													<tr>
														<th className="px-4 py-3">
															Data
														</th>
														<th className="px-4 py-3">
															Usuário
														</th>
														<th className="px-4 py-3">
															Ação
														</th>
														<th className="px-4 py-3">
															Descrição
														</th>
													</tr>
												</thead>
												<tbody>
													{logs.map((log) => (
														<tr
															key={log.log_id}
															className="border-t border-slate-100"
														>
															<td className="px-4 py-3">
																{new Date(
																	log.tempo
																).toLocaleString()}
															</td>
															<td className="px-4 py-3 text-slate-700">
																{log.usuarios
																	?.nome ||
																	log.fk_usuario_id}
															</td>
															<td className="px-4 py-3 font-semibold text-slate-900">
																{log.acao}
															</td>
															<td className="px-4 py-3 text-slate-600">
																{log.descricao}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}

									{[
										'grupos',
										'autores',
										'categorias',
										'palavras',
										'usuarios',
									].includes(activeTab) && (
										<ul className="divide-y divide-slate-100">
											{(activeTab === 'grupos'
												? grupos
												: activeTab === 'autores'
												? autores
												: activeTab === 'categorias'
												? categorias
												: activeTab === 'usuarios'
												? usuarios
												: palavras
											).map((item: any) => {
												const id = Object.values(
													item
												)[0] as number;
												const label =
													(item as any).nome ||
													(item as any).palavra ||
													(item as any).titulo;
												return (
													<li
														key={id}
														className="py-3 flex items-center justify-between"
													>
														<div>
															<p className="font-medium text-slate-800">
																{label}
															</p>
															{activeTab ===
																'usuarios' && (
																<p className="text-xs text-slate-500">
																	{
																		(
																			item as any
																		).email
																	}{' '}
																	·{' '}
																	{mapNivelForForm(
																		(
																			item as any
																		).nivel
																	)}
																</p>
															)}
														</div>
														<div className="flex gap-2 text-sm">
															<button
																onClick={() =>
																	openEdit(
																		item
																	)
																}
																className="text-blue-600 hover:underline"
															>
																Editar
															</button>
															<button
																onClick={() =>
																	openDeleteDialog(
																		id,
																		activeTab ===
																			'palavras'
																			? 'palavrasChave'
																			: activeTab,
																		label
																	)
																}
																className="text-rose-600 hover:underline"
															>
																Excluir
															</button>
														</div>
													</li>
												);
											})}
										</ul>
									)}

									{activeTab === 'solicitacoes' && (
										<ul className="divide-y divide-slate-100">
											{solicitacoes.map((sol) => (
												<li
													key={sol.solicitacao_id}
													className="py-3"
												>
													<p className="font-semibold text-slate-800">
														#{sol.solicitacao_id} ·{' '}
														{sol.tipo}
													</p>
													<p className="text-sm text-slate-500">
														Status: {sol.status} ·
														Recurso{' '}
														{sol.fk_recurso_id}
													</p>
												</li>
											))}
										</ul>
									)}
								</React.Fragment>
							)}
						</div>
					</section>
				</main>
			</div>

			{/* --- MODAL FORM --- */}
			{isFormOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
						<h2 className="text-2xl font-bold mb-4 capitalize">
							{editingItem ? 'Editar' : 'Novo'} {activeTab}
						</h2>
						<form
							key={formKey}
							onSubmit={handleFormSubmit}
							className="space-y-4"
						>
							{/* Dynamic Fields based on Active Tab */}

							{activeTab === 'instituicoes' && (
								<input
									name="nome"
									placeholder="Nome da Instituição"
									defaultValue={editingItem?.nome}
									required
									className="w-full p-2 border rounded"
								/>
							)}

							{activeTab === 'grupos' && (
								<>
									<input
										name="nome"
										placeholder="Nome do Grupo"
										defaultValue={editingItem?.nome}
										required
										className="w-full p-2 border rounded"
									/>
									<textarea
										name="descricao"
										placeholder="Descrição"
										defaultValue={editingItem?.descricao}
										className="w-full p-2 border rounded"
									/>
									<select
										name="fk_instituicao_id"
										defaultValue={
											editingItem?.fk_instituicao_id
										}
										required
										className="w-full p-2 border rounded"
									>
										<option value="">
											Selecione Instituição
										</option>
										{instituicoes.map((i) => (
											<option
												key={i.instituicao_id}
												value={i.instituicao_id}
											>
												{i.nome}
											</option>
										))}
									</select>
								</>
							)}

							{activeTab === 'autores' && (
								<>
									<input
										name="nome"
										placeholder="Nome do Autor"
										defaultValue={editingItem?.nome}
										required
										className="w-full p-2 border rounded"
									/>
									<textarea
										name="biografia"
										placeholder="Biografia"
										defaultValue={editingItem?.biografia}
										className="w-full p-2 border rounded"
									/>
								</>
							)}

							{activeTab === 'categorias' && (
								<>
									<input
										name="nome"
										placeholder="Nome da Categoria"
										defaultValue={editingItem?.nome}
										required
										className="w-full p-2 border rounded"
									/>
									<textarea
										name="descricao"
										placeholder="Descrição"
										defaultValue={editingItem?.descricao}
										className="w-full p-2 border rounded"
									/>
								</>
							)}

							{activeTab === 'palavras' && (
								<input
									name="palavra"
									placeholder="Palavra Chave"
									defaultValue={editingItem?.palavra}
									required
									className="w-full p-2 border rounded"
								/>
							)}

							{activeTab === 'usuarios' && (
								<>
									<input
										name="nome"
										placeholder="Nome"
										defaultValue={editingItem?.nome ?? ''}
										required
										className="w-full p-2 border rounded"
									/>
									<input
										name="email"
										type="email"
										placeholder="Email"
										defaultValue={editingItem?.email ?? ''}
										autoComplete="off"
										required
										className="w-full p-2 border rounded"
									/>
									{!editingItem && (
										<input
											name="senha_hash"
											type="password"
											placeholder="Senha"
											autoComplete="new-password"
											required
											className="w-full p-2 border rounded"
										/>
									)}
									<select
										name="nivel"
										defaultValue={mapNivelForForm(
											editingItem?.nivel
										)}
										className="w-full p-2 border rounded"
									>
										<option value="Usuario">Usuario</option>
										<option value="Colaborador">
											Colaborador
										</option>
										<option value="Administrador">
											Administrador
										</option>
									</select>
									<select
										name="fk_grupo_id"
										defaultValue={
											editingItem?.fk_grupo_id ?? ''
										}
										required
										className="w-full p-2 border rounded"
									>
										<option value="">
											Selecione Grupo
										</option>
										{grupos.map((g) => (
											<option
												key={g.grupo_id}
												value={g.grupo_id}
											>
												{g.nome}
											</option>
										))}
									</select>
								</>
							)}

							{activeTab === 'recursos' && (
								<>
									<input
										name="titulo"
										placeholder="Título"
										defaultValue={editingItem?.titulo}
										required
										className="w-full p-2 border rounded"
									/>
									<textarea
										name="descricao"
										placeholder="Descrição"
										defaultValue={editingItem?.descricao}
										required
										className="w-full p-2 border rounded"
									/>
									<div className="grid grid-cols-2 gap-2">
										<select
											name="tipo_recurso"
											defaultValue={
												editingItem?.tipo_recurso
											}
											className="w-full p-2 border rounded"
										>
											<option value="arquivo">
												Arquivo
											</option>
											<option value="link_externo">
												Link Externo
											</option>
										</select>
										<input
											name="formato_arquivo"
											placeholder="Formato (PDF...)"
											defaultValue={
												editingItem?.formato_arquivo
											}
											className="w-full p-2 border rounded"
										/>
									</div>
									<input
										name="caminho"
										placeholder="URL / Caminho"
										defaultValue={editingItem?.caminho}
										required
										className="w-full p-2 border rounded"
									/>

									<select
										name="fk_autor_id"
										defaultValue={editingItem?.fk_autor_id}
										required
										className="w-full p-2 border rounded"
									>
										<option value="">
											Selecione Autor
										</option>
										{autores.map((a) => (
											<option
												key={a.autor_id}
												value={a.autor_id}
											>
												{a.nome}
											</option>
										))}
									</select>
									<select
										name="fk_categoria_id"
										defaultValue={
											editingItem?.fk_categoria_id
										}
										required
										className="w-full p-2 border rounded"
									>
										<option value="">
											Selecione Categoria
										</option>
										{categorias.map((c) => (
											<option
												key={c.categoria_id}
												value={c.categoria_id}
											>
												{c.nome}
											</option>
										))}
									</select>
								</>
							)}

							<div className="flex justify-end gap-2 pt-4 border-t">
								<button
									type="button"
									onClick={closeForm}
									className="px-4 py-2 text-gray-600"
								>
									Cancelar
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-tedi-dark text-white rounded font-bold"
								>
									Salvar
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* --- DELETE CONFIRMATION MODAL --- */}
			{deleteDialog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
						<h3 className="text-2xl font-bold text-red-600 mb-2">
							Confirmar exclusão
						</h3>
						<p className="text-gray-700 mb-6">
							Tem certeza de que deseja excluir{' '}
							<span className="font-semibold">
								{deleteDialog.label || 'este item'}
							</span>
							? Esta ação não pode ser desfeita.
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={handleDeleteCancel}
								disabled={deleteLoading}
								className="px-4 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={deleteLoading}
								className="px-4 py-2 rounded bg-red-600 text-white font-bold disabled:opacity-50"
							>
								{deleteLoading ? 'Excluindo...' : 'Excluir'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
