import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Material, ToastMessage, Usuario, RecursoEducacional } from './types';
import { api } from './services/api';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SobrePage from './components/SobrePage';
import AdminDashboard from './components/AdminDashboard';
import MaterialDetailsPage from './components/MaterialDetailsPage';
import Toast from './components/Toast';

interface ProtectedRouteProps {
	currentUser: Usuario | null;
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	currentUser,
	children,
}) => {
	if (!currentUser) {
		return <Navigate to="/login" replace />;
	}
	return <>{children}</>;
};

const App: React.FC = () => {
	// Global Data State
	const [materials, setMaterials] = useState<Material[]>([]);
	const [loading, setLoading] = useState(true);

	// Auth State
	const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

	// Toast State
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	// Helper to show toasts
	const showToast = useCallback(
		(
			message: string,
			type: 'success' | 'error' | 'info',
			duration = 4000
		) => {
			const id = Date.now();
			setToasts((prev) => [...prev, { message, type, id, duration }]);
		},
		[setToasts]
	);

	const closeToast = useCallback(
		(id: number) => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		},
		[setToasts]
	);

	// Fetch Materials
	const fetchMaterials = async () => {
		try {
			setLoading(true);
			// Fetch only approved materials for public view (logic can be refined)
			// For now, fetching all to allow filtering
			const data: RecursoEducacional[] = await api.recursos.getAll();

			// Adapt Backend Data to Frontend Material Interface
			const adaptedMaterials: Material[] = data.map((recurso) => ({
				id: recurso.recurso_id,
				title: recurso.titulo,
				description: recurso.descricao,
				type: recurso.categorias?.nome || 'Geral', // Map Category Name
				cta:
					recurso.tipo_recurso === 'link_externo'
						? 'Acessar Link'
						: 'Baixar Arquivo',
				author: recurso.autores?.nome || 'Desconhecido',
				format: recurso.formato_arquivo || 'N/A',
				fileUrl: recurso.caminho,
				downloads: recurso.contagem_downloads || 0,
				status: recurso.status,
				originalData: recurso,
			}));

			setMaterials(adaptedMaterials);
		} catch (error) {
			console.error('Failed to fetch materials', error);
			showToast(
				'Erro ao carregar materiais. Verifique a conexão com a API.',
				'error'
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMaterials();
	}, []);

	const handleLogin = async (user: Usuario) => {
		setCurrentUser(user);
		showToast(`Bem-vindo, ${user.nome}!`, 'success');
		// Log login action
		try {
			await api.logs.create({
				fk_usuario_id: user.usuario_id,
				acao: 'LOGIN',
				descricao: 'Usuário realizou login no sistema',
				ip_origem: '127.0.0.1', // Simulated IP
			});
		} catch (e) {
			console.error('Log error', e);
		}
	};

	const handleLogout = () => {
		setCurrentUser(null);
		showToast('Você saiu do sistema.', 'info');
	};

	// Data Refresh Triggers
	const refreshData = () => {
		fetchMaterials();
	};

	return (
		<HashRouter>
			<div className="relative min-h-screen">
				<Routes>
					<Route
						path="/"
						element={
							<HomePage
								materials={materials.filter(
									(m) => m.status === 'aprovado'
								)}
								loading={loading}
							/>
						}
					/>
					<Route
						path="/material/:id"
						element={
							<MaterialDetailsPage
								materials={materials}
								showToast={showToast}
							/>
						}
					/>
					<Route
						path="/login"
						element={
							<LoginPage
								onLogin={handleLogin}
								showToast={showToast}
							/>
						}
					/>
					<Route path="/sobre" element={<SobrePage />} />

					<Route
						path="/admin"
						element={
							<ProtectedRoute currentUser={currentUser}>
								<AdminDashboard
									currentUser={currentUser}
									onLogout={handleLogout}
									showToast={showToast}
									refreshMaterials={refreshData}
								/>
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>

				{/* Toast Container */}
				<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
					{toasts.map((toast) => (
						<Toast
							key={toast.id}
							toast={toast}
							onClose={closeToast}
						/>
					))}
				</div>
			</div>
		</HashRouter>
	);
};

export default App;
