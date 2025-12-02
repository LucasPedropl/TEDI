const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');
const { getNextId } = require('../utils/db');

// GET todos autores
router.get('/', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('autores')
			.select('*')
			.order('nome');

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET autor por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from('autores')
			.select('*')
			.eq('autor_id', id)
			.single();

		if (error) throw error;
		if (!data)
			return res.status(404).json({ error: 'Autor não encontrado' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST criar autor
router.post('/', validateRequiredFields(['nome']), async (req, res) => {
	try {
		const { nome, biografia } = req.body;
		const autor_id = await getNextId('autores', 'autor_id');

		const { data, error } = await supabase
			.from('autores')
			.insert([{ autor_id, nome, biografia }])
			.select()
			.single();

		if (error) throw error;
		res.status(201).json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT atualizar autor
router.put('/:id', validateRequiredFields(['nome']), async (req, res) => {
	try {
		const { id } = req.params;
		const { nome, biografia } = req.body;

		const { data, error } = await supabase
			.from('autores')
			.update({ nome, biografia })
			.eq('autor_id', id)
			.select()
			.single();

		if (error) throw error;
		if (!data)
			return res.status(404).json({ error: 'Autor não encontrado' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE autor
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase
			.from('autores')
			.delete()
			.eq('autor_id', id);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
