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

const ADMIN_TABS = [
	'recursos',
	'instituicoes',
	'grupos',
	'autores',
	'categorias',
	'palavras',
	'usuarios',
	'solicitacoes',
	'logs',
];

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
		<div className="min-h-screen bg-gray-100 flex flex-col">
			<Navbar isAdmin onLogout={onLogout} />

			<main className="flex-grow container mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold text-tedi-dark">
						Painel Administrativo
					</h1>
					<div className="text-sm text-gray-600">
						Logado como: <strong>{currentUser?.nome}</strong> (
						{mapNivelForForm(currentUser?.nivel)})
					</div>
				</div>

				{/* Tab Navigation Scrollable */}
				<div className="overflow-x-auto pb-4 mb-4">
					<div className="flex space-x-2 min-w-max">
						{ADMIN_TABS.map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
									activeTab === tab
										? 'bg-tedi-dark text-white'
										: 'bg-white text-gray-600 hover:bg-gray-200'
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</div>

				{/* Main Content Area */}
				<div className="bg-white rounded-xl shadow p-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-bold capitalize">
							{activeTab}
						</h2>
						{activeTab !== 'logs' &&
							activeTab !== 'solicitacoes' && (
								<button
									onClick={openNew}
									className="bg-tedi-light text-white px-4 py-2 rounded hover:bg-tedi-dark transition"
								>
									+ Novo
								</button>
							)}
					</div>

					{/* --- RECURSOS TABLE --- */}
					{activeTab === 'recursos' && (
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="p-3">ID</th>
										<th className="p-3">Título</th>
										<th className="p-3">Status</th>
										<th className="p-3">Autor</th>
										<th className="p-3">Ações</th>
									</tr>
								</thead>
								<tbody>
									{recursos.map((r) => (
										<tr
											key={r.recurso_id}
											className="border-b hover:bg-gray-50"
										>
											<td className="p-3">
												{r.recurso_id}
											</td>
											<td className="p-3">{r.titulo}</td>
											<td className="p-3">
												<span
													className={`px-2 py-1 rounded text-xs ${
														r.status === 'aprovado'
															? 'bg-green-100 text-green-800'
															: 'bg-yellow-100 text-yellow-800'
													}`}
												>
													{r.status}
												</span>
											</td>
											<td className="p-3">
												{r.autores?.nome}
											</td>
											<td className="p-3 flex gap-2">
												{r.status === 'pendente' && (
													<button
														onClick={() =>
															handleApprove(
																r.recurso_id
															)
														}
														className="text-green-600 hover:underline"
													>
														Aprovar
													</button>
												)}
												<button
													onClick={() => openEdit(r)}
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
													className="text-red-600 hover:underline"
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

					{/* --- INSTITUICOES TABLE --- */}
					{activeTab === 'instituicoes' && (
						<ul className="divide-y">
							{instituicoes.map((i) => (
								<li
									key={i.instituicao_id}
									className="p-3 flex justify-between items-center hover:bg-gray-50"
								>
									<span>{i.nome}</span>
									<div className="gap-2 flex">
										<button
											onClick={() => openEdit(i)}
											className="text-blue-600 text-sm"
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
											className="text-red-600 text-sm"
										>
											Excluir
										</button>
									</div>
								</li>
							))}
						</ul>
					)}

					{/* --- LOGS TABLE --- */}
					{activeTab === 'logs' && (
						<div className="overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="p-2">Data</th>
										<th className="p-2">Usuário</th>
										<th className="p-2">Ação</th>
										<th className="p-2">Descrição</th>
									</tr>
								</thead>
								<tbody>
									{logs.map((log) => (
										<tr
											key={log.log_id}
											className="border-b"
										>
											<td className="p-2">
												{new Date(
													log.tempo
												).toLocaleString()}
											</td>
											<td className="p-2">
												{log.usuarios?.nome ||
													log.fk_usuario_id}
											</td>
											<td className="p-2 font-bold">
												{log.acao}
											</td>
											<td className="p-2">
												{log.descricao}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* --- GENERIC LIST FOR OTHER TABS --- */}
					{[
						'grupos',
						'autores',
						'categorias',
						'palavras',
						'usuarios',
					].includes(activeTab) && (
						<ul className="divide-y">
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
								const id = Object.values(item)[0] as number;
								const label =
									(item as any).nome ||
									(item as any).palavra ||
									(item as any).titulo;
								return (
									<li
										key={id}
										className="p-3 flex justify-between items-center hover:bg-gray-50"
									>
										<span>
											{label}{' '}
											{activeTab === 'usuarios' && (
												<span className="text-xs text-gray-500">
													({(item as any).email} ·{' '}
													{mapNivelForForm(
														(item as any).nivel
													)}
													)
												</span>
											)}
										</span>
										<div className="gap-2 flex">
											<button
												onClick={() => openEdit(item)}
												className="text-blue-600 text-sm"
											>
												Editar
											</button>
											<button
												onClick={() =>
													openDeleteDialog(
														id,
														activeTab === 'palavras'
															? 'palavrasChave'
															: activeTab,
														label
													)
												}
												className="text-red-600 text-sm"
											>
												Excluir
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
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
											defaultValue={
												editingItem?.descricao
											}
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
											defaultValue={
												editingItem?.biografia
											}
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
											defaultValue={
												editingItem?.descricao
											}
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
											defaultValue={
												editingItem?.nome ?? ''
											}
											required
											className="w-full p-2 border rounded"
										/>
										<input
											name="email"
											type="email"
											placeholder="Email"
											defaultValue={
												editingItem?.email ?? ''
											}
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
											<option value="Usuario">
												Usuario
											</option>
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
											defaultValue={
												editingItem?.descricao
											}
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
											defaultValue={
												editingItem?.fk_autor_id
											}
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
			</main>
		</div>
	);
};

export default AdminDashboard;
