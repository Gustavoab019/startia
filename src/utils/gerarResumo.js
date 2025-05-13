// src/utils/gerarResumo.js
const { gerarResumoContextual } = require('./gerarResumoContextual');

async function gerarResumoParaUsuario(colaborador) {
  try {
    // Usar a nova implementação, mas manter a compatibilidade com código existente
    return await gerarResumoContextual(colaborador, 'menu');
  } catch (error) {
    console.error('❌ Erro ao gerar resumo:', error);
    return 'Não foi possível gerar um resumo completo neste momento.';
  }
}

module.exports = gerarResumoParaUsuario;