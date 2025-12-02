const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');

// GET todas solicitações
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('SolicitacoesAprovacao')
      .select(`
        *,
        usuarios (*),
        recursosEducacionais (*)
      `)
      .order('data_solicitacao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET solicitação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('SolicitacoesAprovacao')
      .select(`
        *,
        usuarios (*),
        recursosEducacionais (*)
      `)
      .eq('solicitacao_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitação não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST criar solicitação
router.post('/', validateRequiredFields([
  'fk_colaborador_id', 'fk_recurso_id', 'tipo', 'status'
]), async (req, res) => {
  try {
    const { fk_colaborador_id, fk_recurso_id, tipo, status } = req.body;
    
    const { data, error } = await supabase
      .from('SolicitacoesAprovacao')
      .insert([{ fk_colaborador_id, fk_recurso_id, tipo, status }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT atualizar status da solicitação
router.put('/:id/status', validateRequiredFields(['status']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('SolicitacoesAprovacao')
      .update({ status })
      .eq('solicitacao_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Solicitação não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE solicitação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('SolicitacoesAprovacao')
      .delete()
      .eq('solicitacao_id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET solicitações por status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { data, error } = await supabase
      .from('SolicitacoesAprovacao')
      .select(`
        *,
        usuarios (*),
        recursosEducacionais (*)
      `)
      .eq('status', status)
      .order('data_solicitacao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;