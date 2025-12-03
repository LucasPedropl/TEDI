
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Material } from '../types';
import MaterialCard from './MaterialCard';
import Navbar from './Navbar';
import Footer from './Footer';

interface HomePageProps {
  materials: Material[];
  loading: boolean;
}

const ITEMS_PER_PAGE = 6;

// --- FUNÇÕES DE BUSCA INTELIGENTE (FUZZY SEARCH) ---

// 1. Remove acentos e deixa minúsculo
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// 2. Calcula a distância de Levenshtein (quantos erros existem entre duas palavras)
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          Math.min(
            matrix[i][j - 1] + 1, // inserção
            matrix[i - 1][j] + 1 // deleção
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const HomePage: React.FC<HomePageProps> = ({ materials, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  // Extract unique categories from materials
  const categories = useMemo(() => {
      const cats = Array.from(new Set(materials.map(m => m.type)));
      return ['Todos', ...cats];
  }, [materials]);

  // --- NOVA LÓGICA DE FILTRAGEM ---
  const filteredMaterials = useMemo(() => {
    const rawSearch = searchTerm.trim();
    
    if (!rawSearch) {
      return materials.filter(m => selectedCategory === 'Todos' || m.type === selectedCategory);
    }

    const searchTerms = normalizeText(rawSearch).split(/\s+/);

    return materials.filter(m => {
      // 1. Verifica Categoria
      const matchesCategory = selectedCategory === 'Todos' || m.type === selectedCategory;
      if (!matchesCategory) return false;

      // 2. Prepara o texto do material
      const titleNorm = normalizeText(m.title);
      const descNorm = normalizeText(m.description);
      const materialWords = [...titleNorm.split(/\s+/), ...descNorm.split(/\s+/)];

      // 3. Verifica cada termo da busca
      return searchTerms.every(term => {
        // A) Busca Exata (substring)
        if (titleNorm.includes(term)) return true;

        // B) Busca Aproximada (Fuzzy)
        // Permite erros em palavras com mais de 3 letras
        if (term.length > 3) {
          return materialWords.some(word => {
            // Ignora palavras muito curtas no texto original para evitar falsos positivos
            if (word.length < 3) return false;

            // Define tolerância: 
            // Palavras de 4 a 6 letras: aceita até 2 erros (Ex: "intre" -> "intro" = 1 erro, passa)
            // Palavras maiores que 6 letras: aceita até 3 erros
            const tolerance = term.length > 6 ? 3 : 2;

            // 1. Distância completa
            const distFull = getLevenshteinDistance(term, word);
            if (distFull <= tolerance) return true;

            // 2. Distância do Prefixo (importante para palavras que estão sendo digitadas)
            // Se a palavra do banco for maior que a buscada (ex: "introducao" vs "intre")
            if (word.length >= term.length) {
              const prefix = word.substring(0, term.length);
              const distPrefix = getLevenshteinDistance(term, prefix);
              // Tolerância menor para prefixo para evitar matches ruins
              const prefixTolerance = Math.max(1, tolerance - 1); 
              if (distPrefix <= prefixTolerance) return true;
            }
            
            return false;
          });
        }
        
        return false;
      });
    });
  }, [materials, searchTerm, selectedCategory]);

  const visibleMaterials = filteredMaterials.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-tedi-dark mb-4">
            Recursos Educacionais Abertos
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Encontre apostilas, jogos e outros materiais educativos desenvolvidos pelo projeto TEDI para a terceira idade.
          </p>

          <div className="max-w-3xl mx-auto">
            <input
                type="search"
                placeholder="Pesquisar..."
                className="w-full p-5 pl-8 text-lg text-gray-700 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-tedi-light outline-none transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        <section id="materiais" className="scroll-mt-28">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold text-tedi-dark">Nossos Materiais</h2>
            
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-tedi-light text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
              <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tedi-dark mx-auto"></div>
                  <p className="mt-4 text-gray-500">Carregando materiais...</p>
              </div>
          ) : visibleMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleMaterials.map(material => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <div className="text-center mt-12 py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xl text-gray-500 font-medium">Nenhum material encontrado.</p>
            </div>
          )}

          {visibleCount < filteredMaterials.length && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                className="bg-tedi-dark hover:bg-tedi-hover text-white font-bold py-3 px-8 rounded-full shadow-lg"
              >
                Ver mais materiais
              </button>
            </div>
          )}
        </section>

        <section id="sobre" className="mt-20 bg-white p-8 md:p-12 rounded-xl shadow-md scroll-mt-28 border border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-tedi-dark mb-6">Sobre o Repositório GERAS</h2>
            <p className="text-gray-600 leading-relaxed text-lg text-justify md:text-center">
              O GERAS (Gerenciador de Recursos Educacionais Abertos e Sustentáveis) é uma iniciativa para centralizar e facilitar o acesso a todos os materiais criados pelo Projeto TEDI (Tecnologia e Educação para a Terceira Idade) da UTFPR. Nosso objetivo é oferecer um local único onde idosos, voluntários e a comunidade em geral possam encontrar, utilizar e compartilhar conhecimento, promovendo a inclusão digital e a autonomia da terceira idade.
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
