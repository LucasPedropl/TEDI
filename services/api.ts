const API_URL = 'https://tedi-dokh.onrender.com/api';

const handleResponse = async (response: Response) => {
	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Erro desconhecido' }));
		throw new Error(error.error || `Erro HTTP: ${response.status}`);
	}
	// Delete operations might return 204 No Content
	if (response.status === 204) return null;
	return response.json();
};

export const api = {
	recursos: {
		getAll: () =>
			fetch(`${API_URL}/recursos-educacionais`).then(handleResponse),
		getByStatus: (status: string) =>
			fetch(`${API_URL}/recursos-educacionais/status/${status}`).then(
				handleResponse
			),
		getById: (id: number) =>
			fetch(`${API_URL}/recursos-educacionais/${id}`).then(
				handleResponse
			),
		create: (data: any) =>
			fetch(`${API_URL}/recursos-educacionais`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/recursos-educacionais/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/recursos-educacionais/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
		approve: (id: number, userId: number) =>
			fetch(`${API_URL}/recursos-educacionais/${id}/aprovar`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fk_usuario_id_aprovador: userId }),
			}).then(handleResponse),
	},

	usuarios: {
		getAll: () => fetch(`${API_URL}/usuarios`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/usuarios`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/usuarios/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/usuarios/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	instituicoes: {
		getAll: () => fetch(`${API_URL}/instituicoes`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/instituicoes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/instituicoes/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/instituicoes/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	grupos: {
		getAll: () => fetch(`${API_URL}/grupos`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/grupos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/grupos/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/grupos/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	categorias: {
		getAll: () => fetch(`${API_URL}/categorias`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/categorias`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/categorias/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/categorias/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	autores: {
		getAll: () => fetch(`${API_URL}/autores`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/autores`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/autores/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/autores/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	palavrasChave: {
		getAll: () => fetch(`${API_URL}/palavras-chave`).then(handleResponse),
		buscar: (termo: string) =>
			fetch(
				`${API_URL}/palavras-chave/buscar/${encodeURIComponent(termo)}`
			).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/palavras-chave`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		update: (id: number, data: any) =>
			fetch(`${API_URL}/palavras-chave/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
		delete: (id: number) =>
			fetch(`${API_URL}/palavras-chave/${id}`, {
				method: 'DELETE',
			}).then(handleResponse),
	},

	logs: {
		getAll: () => fetch(`${API_URL}/log`).then(handleResponse),
		create: (data: any) =>
			fetch(`${API_URL}/log`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			}).then(handleResponse),
	},

	solicitacoes: {
		getAll: () =>
			fetch(`${API_URL}/solicitacoes-aprovacao`).then(handleResponse),
		updateStatus: (id: number, status: string) =>
			fetch(`${API_URL}/solicitacoes-aprovacao/${id}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			}).then(handleResponse),
	},
};
