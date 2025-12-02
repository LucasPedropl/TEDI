const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');

// GET todos recursos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recursosEducacionais')
      .select(`
        *,
        autores (*),
        categorias (*),
        grupos (*),
        usuarios!recursosEducacionais_fk_usuario_id_publicador_fkey (*)
      `)
      .order('data_publicacao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET recurso por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('recursosEducacionais')
      .select(`
        *,
        autores (*),
        categorias (*),
        grupos (*),
        usuarios!recursosEducacionais_fk_usuario_id_publicador_fkey (*)
      `)
      .eq('recurso_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Recurso não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST criar recurso
router.post('/', validateRequiredFields([
  'titulo', 'descricao', 'tipo_recurso', 'formato_arquivo', 
  'caminho', 'status', 'fk_usuario_id_publicador', 
  'fk_autor_id', 'fk_categoria_id', 'fk_grupo_id'
]), async (req, res) => {
  try {
    const {
      titulo, descricao, tipo_recurso, formato_arquivo, caminho, status,
      fk_usuario_id_publicador, fk_autor_id, fk_categoria_id, fk_grupo_id
    } = req.body;
    
    const { data, error } = await supabase
      .from('recursosEducacionais')
      .insert([{
        titulo, descricao, tipo_recurso, formato_arquivo, caminho, status,
        fk_usuario_id_publicador, fk_autor_id, fk_categoria_id, fk_grupo_id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT atualizar recurso
router.put('/:id', validateRequiredFields([
  'titulo', 'descricao', 'tipo_recurso', 'formato_arquivo', 
  'caminho', 'status'
]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo, descricao, tipo_recurso, formato_arquivo, caminho, status,
      fk_usuario_id_aprovador, fk_autor_id, fk_categoria_id
    } = req.body;

    const updateData = {
      titulo, descricao, tipo_recurso, formato_arquivo, caminho, status
    };

    if (fk_usuario_id_aprovador) updateData.fk_usuario_id_aprovador = fk_usuario_id_aprovador;
    if (fk_autor_id) updateData.fk_autor_id = fk_autor_id;
    if (fk_categoria_id) updateData.fk_categoria_id = fk_categoria_id;

    const { data, error } = await supabase
      .from('recursosEducacionais')
      .update(updateData)
      .eq('recurso_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Recurso não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT aprovar recurso
router.put('/:id/aprovar', validateRequiredFields(['fk_usuario_id_aprovador']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fk_usuario_id_aprovador } = req.body;

    const { data, error } = await supabase
      .from('recursosEducacionais')
      .update({ 
        status: 'aprovado',
        fk_usuario_id_aprovador,
        data_aprovado: new Date().toISOString()
      })
      .eq('recurso_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Recurso não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE recurso
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('recursosEducacionais')
      .delete()
      .eq('recurso_id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET recursos por status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { data, error } = await supabase
      .from('recursosEducacionais')
      .select(`
        *,
        autores (*),
        categorias (*),
        grupos (*),
        usuarios!recursosEducacionais_fk_usuario_id_publicador_fkey (*)
      `)
      .eq('status', status)
      .order('data_publicacao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;