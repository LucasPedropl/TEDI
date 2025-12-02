const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../middleware/validation');
const { getNextId } = require('../utils/db');

// Supabase recebeu nomes diferentes para a tabela em ambientes distintos, então
// tentamos as variações conhecidas uma única vez e armazenamos o resultado.
const PALAVRA_TABLE_CANDIDATES = [
	process.env.PALAVRAS_CHAVE_TABLE,
	process.env.PALAVRA_CHAVE_TABLE,
	process.env.PALAVRAS_TABLE,
	process.env.PALAVRA_TABLE,
	'tb_palavra_chave',
	'tb_palavra_chaves',
	'tb_palavraChave',
	'tb_palavraChaves',
	'tb_palavra',
	'tb_palavras_chaves',
	'palavraChave',
	'palavrasChave',
	'palavra_chave',
	'palavras_chave',
	'palavras-chave',
	'palavras',
	'palavra',
	'palavraschave',
	'palavraschaves',
	'tb_palavras_chave',
	'tb_palavras',
].filter(Boolean);
let resolvedPalavraTableName = null;
let metadataDiscoveryAttempted = false;
let metadataDiscoveredTable = null;

const isMissingTableError = (error) => {
	if (!error) return false;
	if (error.code === '42P01') return true;
	const message = (error.message || '').toLowerCase();
	return (
		message.includes('does not exist') || message.includes('schema cache')
	);
};

const discoverPalavraTableViaMetadata = async () => {
	try {
		const { data, error } = await supabase
			.from('pg_tables')
			.select('schemaname, tablename')
			.eq('schemaname', 'public')
			.ilike('tablename', '%palavr%')
			.limit(10);

		if (error || !data || data.length === 0) return null;
		const prioritized = data.find((row) =>
			/palavr(a|as)(_|-)?chav(e|es)?/.test(row.tablename.toLowerCase())
		);
		return prioritized?.tablename || data[0]?.tablename || null;
	} catch (err) {
		return null;
	}
};

const uniqueList = (list) => {
	return list
		.filter(Boolean)
		.filter((name, index, arr) => arr.indexOf(name) === index);
};

const getPalavraTablesToTry = async () => {
	if (!metadataDiscoveryAttempted) {
		metadataDiscoveryAttempted = true;
		metadataDiscoveredTable = await discoverPalavraTableViaMetadata();
	}

	const orderedCandidates = uniqueList([
		resolvedPalavraTableName,
		metadataDiscoveredTable,
		...PALAVRA_TABLE_CANDIDATES,
	]);

	return orderedCandidates.length
		? orderedCandidates
		: ['palavraChave', 'palavrasChave'];
};

const runPalavraQuery = async (queryFactory) => {
	const tablesToTry = await getPalavraTablesToTry();
	let lastError = null;

	for (const tableName of tablesToTry) {
		try {
			const result = await queryFactory(tableName);
			if (!result.error) {
				resolvedPalavraTableName = tableName;
				return result;
			}

			lastError = result.error;
			if (!isMissingTableError(lastError)) {
				return result;
			}
		} catch (error) {
			lastError = error;
			if (!isMissingTableError(lastError)) {
				throw error;
			}
		}
	}

	return { data: null, error: lastError };
};

// GET todas palavras-chave
router.get('/', async (req, res) => {
	try {
		const { data, error } = await runPalavraQuery((table) =>
			supabase.from(table).select('*').order('palavra')
		);

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET buscar palavras-chave por termo
router.get('/buscar/:termo', async (req, res) => {
	try {
		const termo = (req.params.termo || '').trim();
		if (!termo) {
			return res
				.status(400)
				.json({ error: 'Informe um termo para a busca.' });
		}

		const likeTerm = `%${termo}%`;
		const { data, error } = await runPalavraQuery((table) =>
			supabase
				.from(table)
				.select('*')
				.ilike('palavra', likeTerm)
				.order('palavra')
				.limit(20)
		);

		if (error) throw error;
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// GET palavra-chave por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await runPalavraQuery((table) =>
			supabase.from(table).select('*').eq('palavra_id', id).single()
		);

		if (error) throw error;
		if (!data)
			return res
				.status(404)
				.json({ error: 'Palavra-chave não encontrada' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// POST criar palavra-chave
router.post('/', validateRequiredFields(['palavra']), async (req, res) => {
	try {
		const { palavra } = req.body;

		const { data, error } = await runPalavraQuery(async (table) => {
			const palavra_id = await getNextId(table, 'palavra_id');
			return supabase
				.from(table)
				.insert([{ palavra_id, palavra }])
				.select()
				.single();
		});

		if (error) throw error;
		res.status(201).json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// PUT atualizar palavra-chave
router.put('/:id', validateRequiredFields(['palavra']), async (req, res) => {
	try {
		const { id } = req.params;
		const { palavra } = req.body;

		const { data, error } = await runPalavraQuery((table) =>
			supabase
				.from(table)
				.update({ palavra })
				.eq('palavra_id', id)
				.select()
				.single()
		);

		if (error) throw error;
		if (!data)
			return res
				.status(404)
				.json({ error: 'Palavra-chave não encontrada' });

		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// DELETE palavra-chave
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const { error } = await runPalavraQuery((table) =>
			supabase.from(table).delete().eq('palavra_id', id)
		);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
