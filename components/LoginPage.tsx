
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Usuario } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (user: Usuario) => void;
  showToast: (msg: string, type: 'error' | 'success') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
        // Since there is no specific Auth endpoint, fetch all users and filter
        // In a real app, use POST /auth/login
        const users: Usuario[] = await api.usuarios.getAll();
        const user = users.find(u => u.email === email && u.senha_hash === password); // Simple matching for prototype

        if (user) {
            if (user.nivel === 'Usuario') {
                showToast('Acesso restrito para administradores.', 'error');
            } else {
                onLogin(user);
                navigate('/admin');
            }
        } else {
            showToast('Email ou senha inválidos.', 'error');
        }
    } catch (err) {
        showToast('Erro ao conectar com servidor.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-tedi-light text-4xl font-bold block">GERAS</Link>
            <p className="text-gray-500 mt-2">Acesso Restrito</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-2 rounded-lg"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-2 rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tedi-dark text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
