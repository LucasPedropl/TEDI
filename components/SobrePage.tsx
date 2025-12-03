import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const SobrePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-tedi-dark text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">Sobre o GERAS</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Gestão de Recursos de Aprendizagem e Saberes
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          
          {/* Coluna da Esquerda: Texto */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-tedi-light">
              <h2 className="text-2xl font-bold text-tedi-dark mb-4">O Que É?</h2>
              <p className="text-gray-600 leading-relaxed">
                O GERAS (Gerenciador de Recursos Educacionais Abertos e Sustentáveis) é uma iniciativa para centralizar e facilitar o acesso a todos os materiais criados pelo Projeto TEDI (Tecnologia e Educação para a Terceira Idade) da UTFPR. Nosso objetivo é oferecer um local único onde idosos, voluntários e a comunidade em geral possam encontrar, utilizar e compartilhar conhecimento, promovendo a inclusão digital e a autonomia da terceira idade.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-tedi-light">
              <h2 className="text-2xl font-bold text-tedi-dark mb-4">Objetivos</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-tedi-light mt-1">✓</span>
                  Centralizar materiais didáticos dispersos.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tedi-light mt-1">✓</span>
                  Promover o compartilhamento de conhecimento livre.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-tedi-light mt-1">✓</span>
                  Fomentar a inovação pedagógica através da tecnologia.
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna da Direita: Card / Equipe */}
          <div className="bg-white p-8 rounded-xl shadow-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-tedi-dark mb-6 border-b pb-2">Nossa Equipe</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium">TED</div>
                <div>
                  <p className="font-bold text-gray-800">Coordenação TEDI</p>
                  <p className="text-sm text-gray-500">CAMILA DIAS DE OLIVEIRA SESTITO - Email</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium">DEV</div>
                <div>
                  <p className="font-bold text-gray-800">Assistentes</p>
                  <p className="text-sm text-gray-500">Assistente 1 - Email</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">Quer contribuir com o repositório?</p>
              <a href="https://www.instagram.com/projeto_tedi" target="_blank" rel="noopener noreferrer" className="block w-full bg-tedi-light text-white text-center py-2 rounded-lg hover:bg-tedi-hover transition-colors font-medium">
                Entre em contato conosco: Instagram
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Simples */}
      <Footer />
    </div>
  );
};

export default SobrePage;