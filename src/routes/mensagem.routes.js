const express = require('express');
const router = express.Router();
const { processarMensagemSimulada } = require('../services/mensagem.service');

// Simulação de mensagem via Insomnia
router.post('/mensagem', processarMensagemSimulada);

module.exports = router;
