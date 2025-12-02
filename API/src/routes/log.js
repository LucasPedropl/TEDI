const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');

// GET todos logs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('log')
      .select(`
        *,
        usuarios (*)
      `)
      .order('tempo', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET log por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('log')
      .select(`
        *,
        usuarios (*)
      `)
      .eq('log_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Log não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST criar log
router.post('/', validateRequiredFields(['acao']), async (req, res) => {
  try {
    const { fk_usuario_id, acao, descricao, ip_origem } = req.body;
    
    const { data, error } = await supabase
      .from('log')
      .insert([{ fk_usuario_id, acao, descricao, ip_origem }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET logs por usuário
router.get('/usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { data, error } = await supabase
      .from('log')
      .select(`
        *,
        usuarios (*)
      `)
      .eq('fk_usuario_id', usuario_id)
      .order('tempo', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;