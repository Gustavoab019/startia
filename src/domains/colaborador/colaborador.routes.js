const express = require('express');
const router = express.Router();
const { colaboradorOnboardingController } = require('./colaborador.controller');

// Endpoint de teste de colaborador
router.post('/onboarding', colaboradorOnboardingController);

module.exports = router;
