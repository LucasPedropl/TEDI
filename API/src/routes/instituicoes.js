const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');

// GET todas instituições
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('instituicoes')
      .select('*')
      .order('data_cadastro', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET instituição por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('instituicoes')
      .select('*')
      .eq('instituicao_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Instituição não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST criar instituição
router.post('/', validateRequiredFields(['nome']), async (req, res) => {
  try {
    const { nome } = req.body;
    
    const { data, error } = await supabase
      .from('instituicoes')
      .insert([{ nome }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT atualizar instituição
router.put('/:id', validateRequiredFields(['nome']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    const { data, error } = await supabase
      .from('instituicoes')
      .update({ nome })
      .eq('instituicao_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Instituição não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE instituição
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('instituicoes')
      .delete()
      .eq('instituicao_id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;