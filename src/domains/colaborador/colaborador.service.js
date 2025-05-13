const Colaborador = require('./colaborador.model');

/**
 * Busca colaborador por telefone. Se não existir, cria.
 * @param {String} telefone - Telefone no formato internacional (ex: 351912345678)
 * @returns {Promise<Colaborador>}
 */
async function obterOuCriarColaborador(telefone) {
  let colaborador = await Colaborador.findOne({ telefone });

  if (!colaborador) {
    colaborador = new Colaborador({
      telefone,
      etapaCadastro: 'novo'
    });
    await colaborador.save();
    console.log(`👤 Novo colaborador criado: ${telefone}`);
  } else {
    colaborador.ultimoAcesso = new Date();
    await colaborador.save();
  }

  return colaborador;
}

module.exports = {
  obterOuCriarColaborador
};
