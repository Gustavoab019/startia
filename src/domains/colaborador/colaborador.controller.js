const { obterOuCriarColaborador } = require('./colaborador.service');

/**
 * Testa criação ou recuperação de colaborador via telefone
 */
async function colaboradorOnboardingController(req, res) {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ erro: 'Campo telefone é obrigatório' });
    }

    const colaborador = await obterOuCriarColaborador(telefone);
    res.status(200).json(colaborador);
  } catch (err) {
    console.error('❌ Erro ao processar colaborador:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
}

module.exports = {
  colaboradorOnboardingController
};
