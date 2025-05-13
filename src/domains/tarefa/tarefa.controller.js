const express = require('express');
const router = express.Router();
const Tarefa = require('./tarefa.model');

// Criar tarefa
router.post('/', async (req, res) => {
  try {
    const tarefa = new Tarefa(req.body);
    await tarefa.save();
    res.status(201).json(tarefa);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao criar tarefa', detalhes: err });
  }
});

// Listar por colaborador
router.get('/colaborador/:id', async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ atribuidaPara: req.params.id }).sort({ status: 1, prazo: 1 });
    res.json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar tarefas' });
  }
});

// Atualizar status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const tarefa = await Tarefa.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(tarefa);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
});

// (Opcional) Deletar tarefa
router.delete('/:id', async (req, res) => {
  try {
    await Tarefa.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar tarefa' });
  }
});

module.exports = router;
