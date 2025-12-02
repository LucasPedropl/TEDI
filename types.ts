export type MaterialType = 'apostila' | 'jogo' | 'dicas' | string;

// Backend Entities
export interface Instituicao {
	instituicao_id: number;
	nome: string;
	data_cadastro?: string;
}

export interface Grupo {
	grupo_id: number;
	nome: string;
	descricao: string;
	fk_instituicao_id: number;
	instituicoes?: Instituicao;
}

export interface Autor {
	autor_id: number;
	nome: string;
	biografia: string;
}

export interface Categoria {
	categoria_id: number;
	nome: string;
	descricao: string;
}

export interface PalavraChave {
	palavra_id: number;
	palavra: string;
}

export interface Usuario {
	usuario_id: number;
	nome: string;
	email: string;
	senha_hash: string;
	nivel: 'Administrador' | 'Colaborador' | 'Usuario';
	fk_grupo_id?: number;
	grupos?: Grupo;
	data_cadastro?: string;
}

export interface RecursoEducacional {
	recurso_id: number;
	titulo: string;
	descricao: string;
	tipo_recurso: string; // 'arquivo', 'link_externo'
	formato_arquivo: string; // 'PDF', 'HTML5', etc
	caminho: string; // URL or path
	status: 'pendente' | 'aprovado' | 'rejeitado';
	contagem_downloads: number;
	data_publicacao?: string;

	// Foreign Keys
	fk_usuario_id_publicador?: number;
	fk_autor_id: number;
	fk_categoria_id: number;
	fk_grupo_id?: number;

	// Joined Data
	autores?: Autor;
	categorias?: Categoria;
	grupos?: Grupo;
	usuarios?: Usuario; // Publicador
}

export interface SolicitacaoAprovacao {
	solicitacao_id: number;
	fk_colaborador_id: number;
	fk_recurso_id: number;
	tipo: string;
	status: string;
	data_solicitacao: string;
	usuarios?: Usuario;
	recursosEducacionais?: RecursoEducacional;
}

export interface LogSistema {
	log_id: number;
	fk_usuario_id: number;
	acao: string;
	descricao: string;
	tempo: string;
	ip_origem: string;
	usuarios?: Usuario;
}

// Frontend Helpers (Adapters)
export interface Material {
	id: number;
	title: string;
	description: string;
	type: string; // Mapped from Categoria.nome
	cta: string; // Derived
	author: string; // Mapped from Autores.nome
	format: string;
	fileUrl: string;
	downloads: number;
	status: string;
	originalData?: RecursoEducacional; // Reference to full backend object
}

export interface ToastMessage {
	message: string;
	type: 'success' | 'error' | 'info';
	id: number;
	duration?: number;
}

export interface AdminUser {
	email: string;
	password: string;
}

export interface AdminInvite {
	token: string;
	email: string;
}
