const express = require('express');
const router = express.Router();
const { 
  criarObraController, 
  obterObraController,
  listarObrasController,
  atualizarObraController,
  definirHorarioAlmocoController,
  obterHorarioAlmocoController,
  vincularColaboradorController
} = require('./obra.controller');

// Rotas para obras
router.post('/criar', criarObraController);
router.get('/:id', obterObraController);
router.get('/', listarObrasController);
router.put('/:id', atualizarObraController);

// Rotas para horário de almoço
router.put('/:id/almoco', definirHorarioAlmocoController);
router.get('/:id/almoco', obterHorarioAlmocoController);

// Rota para vincular colaborador à obra
router.post('/vincular-colaborador', vincularColaboradorController);

module.exports = router;