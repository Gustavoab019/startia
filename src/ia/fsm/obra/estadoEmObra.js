// src/ia/fsm/obra/estadoEmObra.js
const gerarResumoParaUsuario = require('../../../utils/gerarResumo');

module.exports = async function estadoEmObra(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = 'menu';
  
  try {
    // Obter resumo do usuário
    const resumo = await gerarResumoParaUsuario(colaborador);
    resposta = `👋 Você está em uma obra:\n\n${resumo}\n\n📋 Menu Principal:\n1️⃣ Criar nova obra\n2️⃣ Entrar em uma obra existente\n3️⃣ Ver minhas tarefas\n4️⃣ Registrar presença\n5️⃣ Cadastrar tarefa\n6️⃣ Cadastrar colaborador\n7️⃣ Ver equipe da obra\n8️⃣ O que é o StartIA?\n9️⃣ Relatar problema\n🔟 Ver problemas`;
  } catch (error) {
    console.error('❌ Erro no estado em_obra:', error);
    resposta = `⚠️ Ocorreu um erro ao processar sua solicitação. Retornando ao menu principal.\n\n📋 Menu Principal:\n1️⃣ Criar nova obra\n2️⃣ Entrar em uma obra existente\n3️⃣ Ver minhas tarefas\n4️⃣ Registrar presença\n5️⃣ Cadastrar tarefa\n6️⃣ Cadastrar colaborador\n7️⃣ Ver equipe da obra\n8️⃣ O que é o StartIA?\n9️⃣ Relatar problema\n🔟 Ver problemas`;
  }
  
  return { resposta, etapaNova };
};