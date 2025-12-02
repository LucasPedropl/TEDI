
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Material } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';

interface MaterialDetailsPageProps {
  materials: Material[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MaterialDetailsPage: React.FC<MaterialDetailsPageProps> = ({ materials, showToast }) => {
  const { id } = useParams<{ id: string }>();
  const material = materials.find((m) => m.id === Number(id));

  if (!material) {
    return <Navigate to="/" replace />;
  }

  const handleDownload = () => {
      if (material.fileUrl && material.fileUrl.startsWith('http')) {
        window.open(material.fileUrl, '_blank');
      } else {
        showToast('Link de download não disponível.', 'error');
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/" className="text-tedi-light hover:text-tedi-dark font-medium flex items-center gap-2">
              &larr; Voltar para Materiais
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-tedi-light p-8 md:p-12 text-white relative">
                <span className="uppercase text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{material.type}</span>
                <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4">{material.title}</h1>
                <div className="flex gap-6 text-sm opacity-90">
                    <span>Autor: {material.author}</span>
                    <span>Formato: {material.format}</span>
                </div>
            </div>

            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-tedi-dark mb-4">Sobre este material</h2>
              <p className="text-gray-700 text-lg mb-10 whitespace-pre-wrap">{material.description}</p>

              <button
                onClick={handleDownload}
                className="w-full md:w-auto bg-tedi-dark hover:bg-tedi-hover text-white font-bold py-4 px-8 rounded-xl text-lg shadow-md"
              >
                {material.cta}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MaterialDetailsPage;
