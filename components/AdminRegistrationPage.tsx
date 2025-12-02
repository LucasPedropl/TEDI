import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminInvite } from '../types';

interface AdminRegistrationPageProps {
  pendingInvites: AdminInvite[];
  onRegister: (token: string, name: string, password: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminRegistrationPage: React.FC<AdminRegistrationPageProps> = ({ pendingInvites, onRegister, showToast }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const invite = pendingInvites.find(i => i.token === token);
    if (invite) {
      setIsValidToken(true);
      setInviteEmail(invite.email);
    } else {
      setIsValidToken(false);
    }
  }, [token, pendingInvites]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !password || !confirmPassword) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    if (token) {
        onRegister(token, name, password);
        showToast('Cadastro realizado com sucesso! Faça login.', 'success');
        navigate('/login');
    }
  };

  if (!isValidToken) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
                <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido ou Expirado</h2>
                <p className="text-gray-600 mb-6">O link de convite que você utilizou não é válido ou já foi utilizado.</p>
                <Link to="/" className="text-tedi-light font-bold hover:underline">Voltar para a Home</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="text-tedi-light text-4xl font-bold block mb-2">GERAS</span>
            <h2 className="text-2xl font-bold text-gray-800">Finalizar Cadastro</h2>
            <p className="text-gray-500 mt-2 text-sm">Defina seus dados para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email (Confirmado)</label>
                <input 
                    type="text" 
                    value={inviteEmail} 
                    disabled 
                    className="w-full px-4 py-3 text-gray-500 bg-gray-200 border border-gray-300 rounded-lg cursor-not-allowed"
                />
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-tedi-light focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                Definir Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-tedi-light focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-tedi-light focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-tedi-dark hover:bg-tedi-hover text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors"
              >
                Cadastrar e Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrationPage;