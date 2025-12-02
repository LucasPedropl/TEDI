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
// Importando ícones para UI moderna
import {
	Edit,
	Trash2,
	Plus,
	RefreshCw,
	CheckCircle,
	AlertCircle,
	Search,
	LayoutDashboard,
	FileText,
	Users,
	Building,
	Activity,
	Settings,
	XCircle,
	AlertTriangle,
} from 'lucide-react';

const ADMIN_SECTIONS = [
	{
		id: 'content',
		label: 'Conteúdo',
		description: 'Gerencie materiais, autores e categorização.',
		icon: <FileText size={20} />,
		tabs: [
			{ id: 'recursos', label: 'Recursos educacionais' },
			{ id: 'autores', label: 'Autores' },
			{ id: 'categorias', label: 'Categorias' },
			{ id: 'palavras', label: 'Palavras-chave' },
		],
	},
	{
		id: 'network',
		label: 'Rede',
		description: 'Estrutura de instituições e grupos parceiros.',
		icon: <Building size={20} />,
		tabs: [
			{ id: 'instituicoes', label: 'Instituições' },
			{ id: 'grupos', label: 'Grupos' },
		],
	},
	{
		id: 'operations',
		label: 'Operações',
		description: 'Auditoria e fluxo de aprovações.',
		icon: <Activity size={20} />,
		tabs: [
			{ id: 'solicitacoes', label: 'Solicitações' },
			{ id: 'logs', label: 'Logs do sistema' },
		],
	},
	{
		id: 'settings',
		label: 'Configurações',
		description: 'Controle de acesso e usuários.',
		icon: <Settings size={20} />,
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
	const [searchTerm, setSearchTerm] = useState('');

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
	const [formErrors, setFormErrors] = useState<string[]>([]);
	const [invalidFields, setInvalidFields] = useState<string[]>([]);

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

	// Filter Logic
	const filteredCollection = activeCollection.filter((item: any) => {
		if (!searchTerm) return true;
		const term = searchTerm.toLowerCase();

		// Verifica campos comuns baseado no tipo de dado
		const title = item.titulo?.toLowerCase() || '';
		const name = item.nome?.toLowerCase() || '';
		const word = item.palavra?.toLowerCase() || '';
		const desc = item.descricao?.toLowerCase() || '';
		const email = item.email?.toLowerCase() || '';
		const status = item.status?.toLowerCase() || '';
		const id = String(Object.values(item)[0]); // ID geralmente é o primeiro valor

		return (
			title.includes(term) ||
			name.includes(term) ||
			word.includes(term) ||
			desc.includes(term) ||
			email.includes(term) ||
			status.includes(term) ||
			id.includes(term)
		);
	});

	const isReadOnlyTab = ['logs', 'solicitacoes'].includes(activeTab);

	const resetFormFeedback = () => {
		setFormErrors([]);
		setInvalidFields([]);
	};

	const isFieldInvalid = (field?: string) =>
		field ? invalidFields.includes(field) : false;

	const getInputClasses = (field?: string) =>
		`w-full p-4 border rounded-xl bg-slate-50 text-base text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-tedi-light focus:border-transparent ${
			isFieldInvalid(field)
				? 'border-red-500 ring-2 ring-red-100 bg-red-50/50'
				: 'border-slate-200 hover:border-slate-300'
		}`;

	const isValidEmail = (email?: string) =>
		email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : false;

	const isValidUrlOrPath = (value?: string) => {
		if (!value) return false;
		try {
			const parsed = new URL(value);
			return ['http:', 'https:'].includes(parsed.protocol);
		} catch (error) {
			return value.startsWith('/') || /[\w-]+\.[A-Za-z]{2,}/.test(value);
		}
	};

	const validateFormData = (
		tab: string,
		data: Record<string, any>,
		isEditing: boolean
	) => {
		const errors: string[] = [];
		const invalid: string[] = [];
		const flagError = (field: string, message: string) => {
			errors.push(message);
			if (!invalid.includes(field)) invalid.push(field);
		};

		switch (tab) {
			case 'instituicoes':
				if (!data.nome)
					flagError('nome', 'Informe o nome da instituição.');
				break;
			case 'grupos':
				if (!data.nome) flagError('nome', 'Informe o nome do grupo.');
				if (!data.fk_instituicao_id)
					flagError(
						'fk_instituicao_id',
						'Associe o grupo a uma instituição.'
					);
				break;
			case 'autores':
				if (!data.nome) flagError('nome', 'Informe o nome do autor.');
				break;
			case 'categorias':
				if (!data.nome)
					flagError('nome', 'Informe o nome da categoria.');
				break;
			case 'palavras':
				if (!data.palavra)
					flagError('palavra', 'Defina o texto da palavra-chave.');
				break;
			case 'usuarios':
				if (!data.nome) flagError('nome', 'Informe o nome do usuário.');
				if (!data.email || !isValidEmail(data.email))
					flagError('email', 'Informe um e-mail válido.');
				if (
					!isEditing &&
					(!data.senha_hash || data.senha_hash.length < 6)
				)
					flagError(
						'senha_hash',
						'A senha deve ter ao menos 6 caracteres.'
					);
				if (!data.nivel)
					flagError('nivel', 'Selecione um nível de acesso.');
				if (!data.fk_grupo_id)
					flagError('fk_grupo_id', 'Associe o usuário a um grupo.');
				break;
			case 'recursos':
				if (!data.titulo)
					flagError('titulo', 'Informe o título do recurso.');
				if (!data.descricao || data.descricao.length < 20)
					flagError(
						'descricao',
						'Escreva uma descrição com ao menos 20 caracteres.'
					);
				if (!data.caminho || !isValidUrlOrPath(data.caminho))
					flagError(
						'caminho',
						'Informe um link ou caminho válido para o recurso.'
					);
				if (!data.fk_autor_id)
					flagError('fk_autor_id', 'Selecione o autor do recurso.');
				if (!data.fk_categoria_id)
					flagError(
						'fk_categoria_id',
						'Selecione a categoria do recurso.'
					);
				if (!data.fk_grupo_id)
					flagError('fk_grupo_id', 'Associe o recurso a um grupo.');
				break;
		}

		return { errors, invalidFields: invalid };
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem('admin-active-tab', activeTab);
		}
		setSearchTerm(''); // Limpa a busca ao trocar de aba
	}, [activeTab]);

	useEffect(() => {
		loadTabData();
	}, [activeTab]);

	const loadTabData = async () => {
		try {
			switch (activeTab) {
				case 'recursos': {
					const [recData, autData, catData, grpData] =
						await Promise.all([
							api.recursos.getAll(),
							api.autores.getAll(),
							api.categorias.getAll(),
							api.grupos.getAll(),
						]);
					setRecursos(recData);
					setAutores(autData);
					setCategorias(catData);
					setGrupos(grpData);
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

	const openDeleteDialog = (id: number, type: string, label?: string) => {
		setDeleteDialog({ id, type, label });
	};

	// Função auxiliar para verificar dependências (FK Constraints)
	const checkDependencies = async (
		id: number,
		type: string
	): Promise<string | null> => {
		try {
			if (type === 'grupos') {
				const [allUsers, allRecs] = await Promise.all([
					api.usuarios.getAll(),
					api.recursos.getAll(),
				]);
				if (allUsers.some((u) => u.fk_grupo_id === id))
					return 'Este grupo possui usuários vinculados. Remova-os antes de excluir.';
				if (allRecs.some((r) => r.fk_grupo_id === id))
					return 'Este grupo possui recursos educacionais vinculados. Remova-os antes de excluir.';
			}

			if (type === 'instituicoes') {
				const allGroups = await api.grupos.getAll();
				if (allGroups.some((g) => g.fk_instituicao_id === id))
					return 'Existem grupos vinculados a esta instituição.';
			}

			if (type === 'autores') {
				const allRecs = await api.recursos.getAll();
				if (allRecs.some((r) => r.fk_autor_id === id))
					return 'Este autor possui recursos educacionais cadastrados.';
			}

			if (type === 'categorias') {
				const allRecs = await api.recursos.getAll();
				if (allRecs.some((r) => r.fk_categoria_id === id))
					return 'Esta categoria está sendo usada em recursos educacionais.';
			}

			return null; // Nenhuma dependência encontrada
		} catch (error) {
			console.error('Erro ao verificar dependências:', error);
			return 'Erro ao verificar dependências. Tente novamente.';
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deleteDialog) return;
		setDeleteLoading(true);

		try {
			// 1. Verificar Dependências antes de excluir
			const dependencyError = await checkDependencies(
				deleteDialog.id,
				deleteDialog.type
			);

			if (dependencyError) {
				showToast(dependencyError, 'error');
				setDeleteDialog(null); // Fecha o modal
				setDeleteLoading(false);
				return;
			}

			// 2. Se não houver dependências, prosseguir com a exclusão
			// @ts-ignore
			await api[deleteDialog.type].delete(deleteDialog.id);
			showToast('Item excluído com sucesso.', 'success');

			loadTabData();
			if (deleteDialog.type === 'recursos') refreshMaterials();
			setDeleteDialog(null);
		} catch (e) {
			showToast('Erro ao excluir. Verifique sua conexão.', 'error');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleDeleteCancel = () => {
		if (deleteLoading) return;
		setDeleteDialog(null);
	};

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
		resetFormFeedback();
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const data: any = Object.fromEntries(formData.entries());
		Object.keys(data).forEach((key) => {
			if (typeof data[key] === 'string') {
				data[key] = data[key].trim();
			}
		});

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

		const { errors, invalidFields: invalid } = validateFormData(
			activeTab,
			data,
			Boolean(editingItem)
		);

		if (errors.length) {
			setFormErrors(errors);
			setInvalidFields(invalid);
			showToast('Revise os campos destacados.', 'error');
			return;
		}

		resetFormFeedback();

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
		resetFormFeedback();
	};

	const openNew = () => {
		setEditingItem(null);
		setFormKey((prev) => prev + 1);
		setIsFormOpen(true);
		resetFormFeedback();
	};

	return (
		<div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
			<Navbar isAdmin onLogout={onLogout} />
			<div className="flex flex-1 overflow-hidden">
				{/* SIDEBAR */}
				<aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-slate-200 p-6 gap-8 shadow-sm z-10">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">
							Painel
						</p>
						<h1 className="text-2xl font-extrabold text-tedi-dark tracking-tight">
							Central TEDI
						</h1>
						<p className="text-sm text-slate-500 mt-2 font-medium">
							Olá,{' '}
							<span className="text-slate-800">
								{currentUser?.nome?.split(' ')[0] || 'Admin'}
							</span>
						</p>
					</div>

					<nav className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
						{ADMIN_SECTIONS.map((section) => (
							<div key={section.id} className="mb-6">
								<div className="flex items-center gap-2 mb-3 px-2">
									<span className="text-slate-400">
										{section.icon}
									</span>
									<p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
										{section.label}
									</p>
								</div>
								<div className="space-y-1">
									{section.tabs.map((tab) => {
										const isActive = activeTab === tab.id;
										return (
											<button
												key={tab.id}
												onClick={() =>
													setActiveTab(tab.id)
												}
												className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
													isActive
														? 'bg-tedi-dark text-white shadow-md shadow-tedi-dark/20 translate-x-1'
														: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
												}`}
											>
												<span className="text-sm font-medium">
													{tab.label}
												</span>
												{isActive && (
													<div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</nav>

					<div className="border-t border-slate-200 pt-4 flex items-center justify-between">
						<div className="flex flex-col">
							<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
								Acesso
							</span>
							<span className="text-sm font-medium text-slate-700">
								{mapNivelForForm(currentUser?.nivel)}
							</span>
						</div>
					</div>
				</aside>

				{/* MAIN CONTENT */}
				<main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 space-y-8 bg-slate-50/50">
					{/* Mobile Selector */}
					<div className="lg:hidden">
						<label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
							Navegar para
						</label>
						<div className="relative">
							<select
								value={activeTab}
								onChange={(e) => setActiveTab(e.target.value)}
								className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 bg-white text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-tedi-light"
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
					</div>

					{/* Header Banner */}
					<div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl shadow-slate-200 relative overflow-hidden">
						<div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
							<LayoutDashboard size={250} />
						</div>
						<div className="relative z-10">
							<div className="flex items-center gap-2 mb-3">
								<span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest border border-white/10">
									{activeSection?.label || 'Geral'}
								</span>
							</div>
							<h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
								{activeTabMeta?.label ||
									'Painel Administrativo'}
							</h1>
							<p className="text-base text-slate-300 max-w-2xl leading-relaxed">
								{activeSection?.description ||
									'Gerencie conteúdos, fluxos e configurações do ecossistema TEDI.'}
							</p>

							<div className="mt-8 flex flex-wrap gap-4">
								{!isReadOnlyTab && (
									<button
										onClick={openNew}
										className="group bg-white text-slate-900 rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-black/10 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
									>
										<Plus
											size={18}
											className="text-tedi-dark"
										/>
										<span>Novo Item</span>
									</button>
								)}
								<button
									onClick={loadTabData}
									className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-xl px-6 py-3 text-sm font-semibold hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
								>
									<RefreshCw size={18} />
									Atualizar Lista
								</button>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid gap-6 md:grid-cols-2">
						<div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
							<div className="flex justify-between items-start mb-4">
								<p className="text-sm font-bold uppercase tracking-widest text-slate-400">
									Total de Registros
								</p>
								<div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
									<FileText size={24} />
								</div>
							</div>
							<p className="text-4xl font-extrabold text-slate-900 mb-2">
								{filteredCollection.length}{' '}
								<span className="text-sm font-normal text-slate-400">
									/ {activeCollection.length}
								</span>
							</p>
							<p className="text-base font-medium text-slate-500">
								Itens visíveis em{' '}
								<span className="text-slate-700 font-semibold">
									{activeTabMeta?.label}
								</span>
							</p>
						</div>

						<div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
							<div className="flex justify-between items-start mb-4">
								<p className="text-sm font-bold uppercase tracking-widest text-slate-400">
									Sessão Ativa
								</p>
								<div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
									<Users size={24} />
								</div>
							</div>
							<p className="text-xl font-bold text-slate-900 truncate mb-2">
								{currentUser?.nome || 'Convidado'}
							</p>
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
								<p className="text-base font-medium text-slate-500">
									Online agora
								</p>
							</div>
						</div>
					</div>

					{/* Content Section */}
					<section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
						<header className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
							<div>
								<h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
									Gerenciamento de{' '}
									{activeTabMeta?.label || activeTab}
								</h2>
								<p className="text-base text-slate-500 mt-1">
									{isReadOnlyTab
										? 'Visualize o histórico e status abaixo.'
										: 'Edite ou adicione novos registros na tabela.'}
								</p>
							</div>

							<div className="flex items-center gap-2 w-full sm:w-auto">
								<div className="relative w-full sm:w-64">
									<Search
										size={20}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
									/>
									<input
										type="text"
										placeholder="Buscar por nome, ID..."
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-tedi-light transition-all"
									/>
								</div>
							</div>
						</header>

						<div className="p-0">
							{filteredCollection.length === 0 ? (
								<div className="text-center py-24 px-6">
									<div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
										<Search
											size={40}
											className="text-slate-300"
										/>
									</div>
									<h3 className="text-xl font-bold text-slate-800 mb-2">
										{activeCollection.length === 0
											? 'Nenhum registro encontrado'
											: 'Nenhum resultado para a busca'}
									</h3>
									<p className="text-lg text-slate-500 max-w-md mx-auto mb-8">
										{activeCollection.length === 0
											? isReadOnlyTab
												? 'Não existem dados disponíveis.'
												: 'Comece adicionando o primeiro item.'
											: 'Tente usar outros termos ou limpe o filtro de busca.'}
									</p>
									{activeCollection.length === 0 &&
										!isReadOnlyTab && (
											<button
												onClick={openNew}
												className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-tedi-dark text-white text-base font-bold hover:bg-slate-800 transition-colors"
											>
												<Plus size={20} />
												Cadastrar Item
											</button>
										)}
									{activeCollection.length > 0 && (
										<button
											onClick={() => setSearchTerm('')}
											className="inline-flex items-center gap-2 px-6 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
										>
											Limpar busca
										</button>
									)}
								</div>
							) : (
								<React.Fragment>
									{/* RECURSOS TABLE */}
									{activeTab === 'recursos' && (
										<div className="overflow-x-auto">
											<table className="w-full text-left border-collapse">
												<thead className="bg-slate-50 border-b border-slate-200">
													<tr>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															ID
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Título
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Status
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Autor
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">
															Ações
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{recursos
														.filter((item) =>
															filteredCollection.includes(
																item
															)
														)
														.map((r) => (
															<tr
																key={
																	r.recurso_id
																}
																className="hover:bg-slate-50/80 transition-colors group"
															>
																<td className="px-6 py-5 font-mono text-sm text-slate-400">
																	#
																	{
																		r.recurso_id
																	}
																</td>
																<td className="px-6 py-5">
																	<p className="font-semibold text-slate-900 text-base">
																		{
																			r.titulo
																		}
																	</p>
																	<p className="text-sm text-slate-500 mt-1 truncate max-w-xs">
																		{
																			r.descricao
																		}
																	</p>
																</td>
																<td className="px-6 py-5">
																	<span
																		className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
																			r.status ===
																			'aprovado'
																				? 'bg-emerald-50 text-emerald-700 border-emerald-100'
																				: 'bg-amber-50 text-amber-700 border-amber-100'
																		}`}
																	>
																		{r.status ===
																		'aprovado' ? (
																			<CheckCircle
																				size={
																					14
																				}
																			/>
																		) : (
																			<AlertCircle
																				size={
																					14
																				}
																			/>
																		)}
																		{
																			r.status
																		}
																	</span>
																</td>
																<td className="px-6 py-5 text-sm font-medium text-slate-600">
																	{r.autores
																		?.nome ||
																		'—'}
																</td>
																<td className="px-6 py-5 text-right">
																	<div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
																		{r.status ===
																			'pendente' && (
																			<button
																				onClick={() =>
																					handleApprove(
																						r.recurso_id
																					)
																				}
																				className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip"
																				title="Aprovar"
																			>
																				<CheckCircle
																					size={
																						20
																					}
																				/>
																			</button>
																		)}
																		<button
																			onClick={() =>
																				openEdit(
																					r
																				)
																			}
																			className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
																			title="Editar"
																		>
																			<Edit
																				size={
																					20
																				}
																			/>
																		</button>
																		<button
																			onClick={() =>
																				openDeleteDialog(
																					r.recurso_id,
																					'recursos',
																					r.titulo
																				)
																			}
																			className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
																			title="Excluir"
																		>
																			<Trash2
																				size={
																					20
																				}
																			/>
																		</button>
																	</div>
																</td>
															</tr>
														))}
												</tbody>
											</table>
										</div>
									)}

									{/* INSTITUIÇÕES LIST */}
									{activeTab === 'instituicoes' && (
										<ul className="divide-y divide-slate-100">
											{instituicoes
												.filter((item) =>
													filteredCollection.includes(
														item
													)
												)
												.map((i) => (
													<li
														key={i.instituicao_id}
														className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
													>
														<div>
															<p className="font-bold text-slate-900 text-lg">
																{i.nome}
															</p>
															<p className="text-sm text-slate-400 mt-1">
																ID:{' '}
																{
																	i.instituicao_id
																}
															</p>
														</div>
														<div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
															<button
																onClick={() =>
																	openEdit(i)
																}
																className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
															>
																<Edit
																	size={20}
																/>
															</button>
															<button
																onClick={() =>
																	openDeleteDialog(
																		i.instituicao_id,
																		'instituicoes',
																		i.nome
																	)
																}
																className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
															>
																<Trash2
																	size={20}
																/>
															</button>
														</div>
													</li>
												))}
										</ul>
									)}

									{/* LOGS TABLE */}
									{activeTab === 'logs' && (
										<div className="overflow-x-auto">
											<table className="w-full text-left">
												<thead className="bg-slate-50 border-b border-slate-200">
													<tr>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Data
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Usuário
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Ação
														</th>
														<th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
															Descrição
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{logs
														.filter((item) =>
															filteredCollection.includes(
																item
															)
														)
														.map((log) => (
															<tr
																key={log.log_id}
																className="hover:bg-slate-50"
															>
																<td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">
																	{new Date(
																		log.tempo
																	).toLocaleString()}
																</td>
																<td className="px-6 py-5 text-sm font-medium text-slate-700">
																	{log
																		.usuarios
																		?.nome ||
																		log.fk_usuario_id}
																</td>
																<td className="px-6 py-5 text-sm font-bold text-slate-900">
																	{log.acao}
																</td>
																<td className="px-6 py-5 text-sm text-slate-600">
																	{
																		log.descricao
																	}
																</td>
															</tr>
														))}
												</tbody>
											</table>
										</div>
									)}

									{/* GENERIC LIST (Grupos, Autores, etc) */}
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
											)
												.filter((item) =>
													filteredCollection.includes(
														item
													)
												)
												.map((item: any) => {
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
															className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
														>
															<div>
																<p className="font-bold text-slate-900 text-lg">
																	{label}
																</p>
																{activeTab ===
																	'usuarios' && (
																	<div className="flex items-center gap-2 mt-1">
																		<span className="text-sm text-slate-500">
																			{
																				(
																					item as any
																				)
																					.email
																			}
																		</span>
																		<span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
																		<span className="text-xs font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
																			{mapNivelForForm(
																				(
																					item as any
																				)
																					.nivel
																			)}
																		</span>
																	</div>
																)}
															</div>
															<div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
																<button
																	onClick={() =>
																		openEdit(
																			item
																		)
																	}
																	className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
																	title="Editar"
																>
																	<Edit
																		size={
																			20
																		}
																	/>
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
																	className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
																	title="Excluir"
																>
																	<Trash2
																		size={
																			20
																		}
																	/>
																</button>
															</div>
														</li>
													);
												})}
										</ul>
									)}

									{activeTab === 'solicitacoes' && (
										<ul className="divide-y divide-slate-100">
											{solicitacoes
												.filter((item) =>
													filteredCollection.includes(
														item
													)
												)
												.map((sol) => (
													<li
														key={sol.solicitacao_id}
														className="px-8 py-5 hover:bg-slate-50 transition-colors"
													>
														<div className="flex items-center justify-between">
															<div>
																<p className="font-bold text-slate-900 text-lg">
																	#
																	{
																		sol.solicitacao_id
																	}{' '}
																	· {sol.tipo}
																</p>
																<p className="text-base text-slate-500 mt-1">
																	Ref. Recurso
																	ID:{' '}
																	<span className="font-mono bg-slate-100 px-1 rounded">
																		{
																			sol.fk_recurso_id
																		}
																	</span>
																</p>
															</div>
															<span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200">
																{sol.status}
															</span>
														</div>
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
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
						<div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
							<h2 className="text-2xl font-bold text-slate-800 capitalize">
								{editingItem
									? 'Editar Registro'
									: 'Novo Registro'}
								<span className="block text-sm font-normal text-slate-500 mt-1">
									{activeTabMeta?.label}
								</span>
							</h2>
							<button
								onClick={closeForm}
								className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
							>
								<XCircle size={24} />
							</button>
						</div>

						<div className="p-8">
							<form
								key={formKey}
								onSubmit={handleFormSubmit}
								className="space-y-6"
							>
								{formErrors.length > 0 && (
									<div className="border border-red-100 bg-red-50 text-red-600 text-sm rounded-xl p-4 flex gap-3 items-start">
										<AlertCircle
											size={20}
											className="shrink-0 mt-0.5"
										/>
										<div>
											<p className="font-bold mb-1">
												Atenção aos seguintes pontos:
											</p>
											<ul className="list-disc pl-4 space-y-1">
												{formErrors.map(
													(error, index) => (
														<li
															key={`${error}-${index}`}
														>
															{error}
														</li>
													)
												)}
											</ul>
										</div>
									</div>
								)}

								{/* --- Dynamic Fields --- */}

								{activeTab === 'instituicoes' && (
									<div className="space-y-2">
										<label
											htmlFor="instituicao-nome"
											className="text-sm font-bold text-slate-700"
										>
											Nome da instituição
										</label>
										<input
											id="instituicao-nome"
											name="nome"
											placeholder="Ex.: Instituto Federal"
											defaultValue={editingItem?.nome}
											required
											className={getInputClasses('nome')}
										/>
									</div>
								)}

								{activeTab === 'grupos' && (
									<>
										<div className="space-y-2">
											<label
												htmlFor="grupo-nome"
												className="text-sm font-bold text-slate-700"
											>
												Nome do grupo
											</label>
											<input
												id="grupo-nome"
												name="nome"
												placeholder="Ex.: Grupo de Física"
												defaultValue={editingItem?.nome}
												required
												className={getInputClasses(
													'nome'
												)}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="grupo-descricao"
												className="text-sm font-bold text-slate-700"
											>
												Descrição (opcional)
											</label>
											<textarea
												id="grupo-descricao"
												name="descricao"
												placeholder="Resuma a atuação do grupo"
												defaultValue={
													editingItem?.descricao
												}
												className={getInputClasses()}
												rows={3}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="grupo-instituicao"
												className="text-sm font-bold text-slate-700"
											>
												Instituição vinculada
											</label>
											<select
												id="grupo-instituicao"
												name="fk_instituicao_id"
												defaultValue={
													editingItem?.fk_instituicao_id ??
													''
												}
												required
												className={getInputClasses(
													'fk_instituicao_id'
												)}
											>
												<option value="">
													Selecione uma instituição
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
										</div>
									</>
								)}

								{activeTab === 'autores' && (
									<>
										<div className="space-y-2">
											<label
												htmlFor="autor-nome"
												className="text-sm font-bold text-slate-700"
											>
												Nome do autor
											</label>
											<input
												id="autor-nome"
												name="nome"
												placeholder="Digite o nome completo"
												defaultValue={editingItem?.nome}
												required
												className={getInputClasses(
													'nome'
												)}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="autor-biografia"
												className="text-sm font-bold text-slate-700"
											>
												Biografia (opcional)
											</label>
											<textarea
												id="autor-biografia"
												name="biografia"
												placeholder="Compartilhe um breve resumo"
												defaultValue={
													editingItem?.biografia
												}
												className={getInputClasses()}
												rows={3}
											/>
										</div>
									</>
								)}

								{activeTab === 'categorias' && (
									<>
										<div className="space-y-2">
											<label
												htmlFor="categoria-nome"
												className="text-sm font-bold text-slate-700"
											>
												Nome da categoria
											</label>
											<input
												id="categoria-nome"
												name="nome"
												placeholder="Ex.: Matemática"
												defaultValue={editingItem?.nome}
												required
												className={getInputClasses(
													'nome'
												)}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="categoria-descricao"
												className="text-sm font-bold text-slate-700"
											>
												Descrição (opcional)
											</label>
											<textarea
												id="categoria-descricao"
												name="descricao"
												placeholder="Detalhe a categoria"
												defaultValue={
													editingItem?.descricao
												}
												className={getInputClasses()}
												rows={3}
											/>
										</div>
									</>
								)}

								{activeTab === 'palavras' && (
									<div className="space-y-2">
										<label
											htmlFor="palavra-chave"
											className="text-sm font-bold text-slate-700"
										>
											Palavra-chave
										</label>
										<input
											id="palavra-chave"
											name="palavra"
											placeholder="Ex.: Inclusão"
											defaultValue={editingItem?.palavra}
											required
											className={getInputClasses(
												'palavra'
											)}
										/>
									</div>
								)}

								{activeTab === 'usuarios' && (
									<>
										<div className="space-y-2">
											<label
												htmlFor="usuario-nome"
												className="text-sm font-bold text-slate-700"
											>
												Nome completo
											</label>
											<input
												id="usuario-nome"
												name="nome"
												placeholder="Digite o nome"
												defaultValue={
													editingItem?.nome ?? ''
												}
												required
												className={getInputClasses(
													'nome'
												)}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="usuario-email"
												className="text-sm font-bold text-slate-700"
											>
												Email institucional
											</label>
											<input
												id="usuario-email"
												name="email"
												type="email"
												placeholder="nome@email.com"
												defaultValue={
													editingItem?.email ?? ''
												}
												autoComplete="off"
												required
												className={getInputClasses(
													'email'
												)}
											/>
										</div>
										{!editingItem && (
											<div className="space-y-2">
												<label
													htmlFor="usuario-senha"
													className="text-sm font-bold text-slate-700"
												>
													Senha temporária
												</label>
												<input
													id="usuario-senha"
													name="senha_hash"
													type="password"
													placeholder="Mínimo 6 caracteres"
													autoComplete="new-password"
													required
													className={getInputClasses(
														'senha_hash'
													)}
												/>
											</div>
										)}
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<label
													htmlFor="usuario-nivel"
													className="text-sm font-bold text-slate-700"
												>
													Nível de acesso
												</label>
												<select
													id="usuario-nivel"
													name="nivel"
													defaultValue={mapNivelForForm(
														editingItem?.nivel
													)}
													className={getInputClasses(
														'nivel'
													)}
												>
													<option value="Usuario">
														Usuário
													</option>
													<option value="Colaborador">
														Colaborador
													</option>
													<option value="Administrador">
														Administrador
													</option>
												</select>
											</div>
											<div className="space-y-2">
												<label
													htmlFor="usuario-grupo"
													className="text-sm font-bold text-slate-700"
												>
													Grupo vinculado
												</label>
												<select
													id="usuario-grupo"
													name="fk_grupo_id"
													defaultValue={
														editingItem?.fk_grupo_id ??
														''
													}
													required
													className={getInputClasses(
														'fk_grupo_id'
													)}
												>
													<option value="">
														Selecione um grupo
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
											</div>
										</div>
									</>
								)}

								{activeTab === 'recursos' && (
									<>
										<div className="space-y-2">
											<label
												htmlFor="recurso-titulo"
												className="text-sm font-bold text-slate-700"
											>
												Título do recurso
											</label>
											<input
												id="recurso-titulo"
												name="titulo"
												placeholder="Ex.: Guia prático de robótica"
												defaultValue={
													editingItem?.titulo
												}
												required
												className={getInputClasses(
													'titulo'
												)}
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="recurso-descricao"
												className="text-sm font-bold text-slate-700"
											>
												Descrição detalhada
											</label>
											<textarea
												id="recurso-descricao"
												name="descricao"
												placeholder="Explique para quem é e como utilizar"
												defaultValue={
													editingItem?.descricao
												}
												required
												className={getInputClasses(
													'descricao'
												)}
												rows={4}
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<label
													htmlFor="recurso-tipo"
													className="text-sm font-bold text-slate-700"
												>
													Tipo
												</label>
												<select
													id="recurso-tipo"
													name="tipo_recurso"
													defaultValue={
														editingItem?.tipo_recurso ??
														'arquivo'
													}
													className={getInputClasses()}
												>
													<option value="arquivo">
														Arquivo
													</option>
													<option value="link_externo">
														Link externo
													</option>
												</select>
											</div>
											<div className="space-y-2">
												<label
													htmlFor="recurso-formato"
													className="text-sm font-bold text-slate-700"
												>
													Formato (opc.)
												</label>
												<input
													id="recurso-formato"
													name="formato_arquivo"
													placeholder="PDF, MP4, etc."
													defaultValue={
														editingItem?.formato_arquivo
													}
													className={getInputClasses()}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="recurso-caminho"
												className="text-sm font-bold text-slate-700"
											>
												Link ou caminho
											</label>
											<input
												id="recurso-caminho"
												name="caminho"
												placeholder="Cole a URL ou caminho"
												defaultValue={
													editingItem?.caminho
												}
												required
												className={getInputClasses(
													'caminho'
												)}
											/>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<label
													htmlFor="recurso-autor"
													className="text-sm font-bold text-slate-700"
												>
													Autor
												</label>
												<select
													id="recurso-autor"
													name="fk_autor_id"
													defaultValue={
														editingItem?.fk_autor_id ??
														''
													}
													required
													className={getInputClasses(
														'fk_autor_id'
													)}
												>
													<option value="">
														Selecione...
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
											</div>
											<div className="space-y-2">
												<label
													htmlFor="recurso-categoria"
													className="text-sm font-bold text-slate-700"
												>
													Categoria
												</label>
												<select
													id="recurso-categoria"
													name="fk_categoria_id"
													defaultValue={
														editingItem?.fk_categoria_id ??
														''
													}
													required
													className={getInputClasses(
														'fk_categoria_id'
													)}
												>
													<option value="">
														Selecione...
													</option>
													{categorias.map((c) => (
														<option
															key={c.categoria_id}
															value={
																c.categoria_id
															}
														>
															{c.nome}
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<label
													htmlFor="recurso-grupo"
													className="text-sm font-bold text-slate-700"
												>
													Grupo
												</label>
												<select
													id="recurso-grupo"
													name="fk_grupo_id"
													defaultValue={
														editingItem?.fk_grupo_id ??
														''
													}
													required
													className={getInputClasses(
														'fk_grupo_id'
													)}
												>
													<option value="">
														Selecione...
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
											</div>
										</div>
									</>
								)}

								<div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
									<button
										type="button"
										onClick={closeForm}
										className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
									>
										Cancelar
									</button>
									<button
										type="submit"
										className="px-6 py-3 rounded-xl bg-tedi-dark text-white font-bold hover:bg-slate-800 shadow-lg shadow-tedi-dark/20 transition-all transform active:scale-95"
									>
										Salvar Registro
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* --- DELETE CONFIRMATION MODAL --- */}
			{deleteDialog && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
						<div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
							<AlertTriangle size={32} />
						</div>
						<h3 className="text-2xl font-bold text-slate-900 mb-2">
							Confirmar exclusão
						</h3>
						<p className="text-slate-600 mb-8 leading-relaxed">
							Tem certeza de que deseja excluir{' '}
							<span className="font-bold text-slate-900">
								"{deleteDialog.label}"
							</span>
							?
							<br />
							Esta ação é irreversível.
						</p>
						<div className="flex gap-3 justify-center">
							<button
								onClick={handleDeleteCancel}
								disabled={deleteLoading}
								className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={deleteLoading}
								className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
							>
								{deleteLoading
									? 'Verificando...'
									: 'Sim, excluir'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
