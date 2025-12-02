
import { Material, AdminUser } from './types';

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 1,
    title: "Apostila de WhatsApp",
    description: "Aprenda a usar o WhatsApp para se comunicar com amigos e família. Passo a passo detalhado com imagens ilustrativas.",
    type: "apostila",
    cta: "Baixar PDF",
    author: "Equipe TEDI",
    format: "PDF",
    fileUrl: "#",
    downloads: 120,
    status: "aprovado"
  },
  {
    id: 2,
    title: "Jogo da Memória Digital",
    description: "Exercite sua mente com este divertido jogo da memória no computador. Níveis fácil, médio e difícil.",
    type: "jogo",
    cta: "Jogar Online",
    author: "Carlos E.",
    format: "HTML5",
    fileUrl: "#",
    downloads: 85,
    status: "aprovado"
  },
  {
    id: 3,
    title: "Dicas de Segurança Online",
    description: "Navegue na internet com mais confiança e proteja seus dados. Saiba identificar sites seguros e golpes comuns.",
    type: "dicas",
    cta: "Ler Artigo",
    author: "Thiago G.",
    format: "Texto",
    fileUrl: "#",
    downloads: 200,
    status: "aprovado"
  },
  {
    id: 4,
    title: "Introdução ao Facebook",
    description: "Conecte-se com pessoas e participe de grupos de interesse. Guia para criar conta e adicionar amigos.",
    type: "apostila",
    cta: "Baixar PDF",
    author: "Equipe TEDI",
    format: "PDF",
    fileUrl: "#",
    downloads: 95,
    status: "aprovado"
  },
  {
    id: 5,
    title: "Caça-Palavras Temático",
    description: "Encontre palavras relacionadas a tecnologia e divirta-se enquanto aprende novos termos.",
    type: "jogo",
    cta: "Jogar Agora",
    author: "Bruno M.",
    format: "HTML5",
    fileUrl: "#",
    downloads: 50,
    status: "aprovado"
  },
  {
    id: 6,
    title: "Como Usar o E-mail",
    description: "Guia completo para enviar e receber e-mails de forma fácil, anexar arquivos e organizar a caixa de entrada.",
    type: "apostila",
    cta: "Baixar PDF",
    author: "Pedro L.",
    format: "PDF",
    fileUrl: "#",
    downloads: 110,
    status: "aprovado"
  }
];

export const MOCK_ADMINS: AdminUser[] = [
  {
    email: "admin@geras.com",
    password: "admin123"
  },
  {
    email: "professor@utfpr.edu.br",
    password: "senhaforte456"
  }
];

export const ITEMS_PER_PAGE = 6;
