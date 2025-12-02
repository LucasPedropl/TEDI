const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');

// GET todos grupos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grupos')
      .select(`
        *,
        instituicoes (*)
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET grupo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('grupos')
      .select(`
        *,
        instituicoes (*)
      `)
      .eq('grupo_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Grupo não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST criar grupo
router.post('/', validateRequiredFields(['nome', 'fk_instituicao_id']), async (req, res) => {
  try {
    const { nome, descricao, fk_instituicao_id } = req.body;
    
    const { data, error } = await supabase
      .from('grupos')
      .insert([{ nome, descricao, fk_instituicao_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT atualizar grupo
router.put('/:id', validateRequiredFields(['nome', 'fk_instituicao_id']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, fk_instituicao_id } = req.body;

    const { data, error } = await supabase
      .from('grupos')
      .update({ nome, descricao, fk_instituicao_id })
      .eq('grupo_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Grupo não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE grupo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('grupos')
      .delete()
      .eq('grupo_id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;