const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');
const { getNextId } = require('../utils/db');

// GET todos usuários
router.get('/', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('usuarios')
			.select(
				`
        *,
        grupos (*)
      `
			)
			.order('data_cadastro', { ascending: false });

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET usuário por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from('usuarios')
			.select(
				`
        *,
        grupos (*)
      `
			)
			.eq('usuario_id', id)
			.single();

		if (error) throw error;
		if (!data)
			return res.status(404).json({ error: 'Usuário não encontrado' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST criar usuário
router.post(
	'/',
	validateRequiredFields([
		'nome',
		'email',
		'senha_hash',
		'nivel',
		'fk_grupo_id',
	]),
	async (req, res) => {
		try {
			const { nome, email, senha_hash, nivel, fk_grupo_id } = req.body;
			const usuario_id = await getNextId('usuarios', 'usuario_id');

			const { data, error } = await supabase
				.from('usuarios')
				.insert([
					{ usuario_id, nome, email, senha_hash, nivel, fk_grupo_id },
				])
				.select()
				.single();

			if (error) throw error;
			res.status(201).json(data);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// PUT atualizar usuário
router.put(
	'/:id',
	validateRequiredFields(['nome', 'email', 'nivel', 'fk_grupo_id']),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { nome, email, senha_hash, nivel, fk_grupo_id } = req.body;

			const updateData = { nome, email, nivel, fk_grupo_id };
			if (senha_hash) updateData.senha_hash = senha_hash;

			const { data, error } = await supabase
				.from('usuarios')
				.update(updateData)
				.eq('usuario_id', id)
				.select()
				.single();

			if (error) throw error;
			if (!data)
				return res
					.status(404)
					.json({ error: 'Usuário não encontrado' });

			res.json(data);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	}
);

// DELETE usuário
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase
			.from('usuarios')
			.delete()
			.eq('usuario_id', id);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET usuários por nível
router.get('/nivel/:nivel', async (req, res) => {
	try {
		const { nivel } = req.params;
		const { data, error } = await supabase
			.from('usuarios')
			.select(
				`
        *,
        grupos (*)
      `
			)
			.eq('nivel', nivel)
			.order('data_cadastro', { ascending: false });

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
