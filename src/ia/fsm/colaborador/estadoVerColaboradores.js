const Obra = require('../../../domains/obra/obra.model');

module.exports = async function estadoVerColaboradores(colaborador) {
  let resposta = '';
  let etapaNova = 'menu';

  const obraId = colaborador.obras[colaborador.obras.length - 1];
  const obra = await Obra.findById(obraId).populate('colaboradores');

  if (!obra || obra.colaboradores.length === 0) {
    return {
      resposta: '⚠️ Nenhum colaborador encontrado nesta obra.',
      etapaNova
    };
  }

  const lista = obra.colaboradores.map((c, i) => {
    const nome = c.nome || c.telefone;
    const funcao = c.funcao ? ` - ${c.funcao}` : '';
    const tipo = c.tipo === 'encarregado' ? ' (Encarregado)' : ' (Colaborador)';
    return `${i + 1}️⃣ ${nome}${funcao}${tipo}`;
  }).join('\n');

  resposta = `👷 Equipe da obra:\n\n${lista}`;

  return { resposta, etapaNova };
};
