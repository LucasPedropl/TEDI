const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');
const { getNextId } = require('../utils/db');

// GET todas categorias
router.get('/', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('categorias')
			.select('*')
			.order('nome');

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET categoria por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from('categorias')
			.select('*')
			.eq('categoria_id', id)
			.single();

		if (error) throw error;
		if (!data)
			return res.status(404).json({ error: 'Categoria não encontrada' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST criar categoria
router.post('/', validateRequiredFields(['nome']), async (req, res) => {
	try {
		const { nome, descricao } = req.body;
		const categoria_id = await getNextId('categorias', 'categoria_id');

		const { data, error } = await supabase
			.from('categorias')
			.insert([{ categoria_id, nome, descricao }])
			.select()
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT atualizar categoria
router.put('/:id', validateRequiredFields(['nome']), async (req, res) => {
	try {
		const { id } = req.params;
		const { nome, descricao } = req.body;

		const { data, error } = await supabase
			.from('categorias')
			.update({ nome, descricao })
			.eq('categoria_id', id)
			.select()
			.single();

		if (error) throw error;
		if (!data)
			return res.status(404).json({ error: 'Categoria não encontrada' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE categoria
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase
			.from('categorias')
			.delete()
			.eq('categoria_id', id);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
