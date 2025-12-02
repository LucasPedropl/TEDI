
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/instituicoes', require('./routes/instituicoes'));
app.use('/api/grupos', require('./routes/grupos'));
app.use('/api/autores', require('./routes/autores'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/palavras-chave', require('./routes/palavras-chave'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/recursos-educacionais', require('./routes/recursos-educacionais'));
app.use('/api/solicitacoes-aprovacao', require('./routes/solicitacoes-aprovacao'));
app.use('/api/log', require('./routes/log'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});