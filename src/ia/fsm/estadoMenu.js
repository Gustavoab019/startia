// src/ia/fsm/estadoMenu.js

const estadoVerTarefas = require('./tarefa/estadoVerTarefas');
const estadoVerColaboradores = require('./colaborador/estadoVerColaboradores');
const estadoGuiaStartIA = require('./colaborador/estadoGuiaStartIA');
const estadoVerProblemas = require('./problema/estadoVerProblemas');
// Substituir a importação original pela nova função
const { gerarResumoContextual } = require('../../utils/gerarResumoContextual');
const mongoose = require('mongoose');

module.exports = async function estadoMenu(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  switch (mensagem) {
    case '1':
      resposta = `📝 Vamos criar uma nova obra. Qual o *nome* da obra?`;
      etapaNova = 'criando_obra_nome';
      break;

    case '2':
      resposta = `🔑 Digite o *código de acesso* da obra para entrar.`;
      etapaNova = 'entrando_obra_codigo';
      break;

    case '3':
      return await estadoVerTarefas(colaborador);

    case '4':
      // Verificar se o colaborador está em alguma obra
      if (colaborador.obras && colaborador.obras.length > 0) {
        // Tentar usar a última obra visitada como padrão
        let obraId = colaborador.obras[0]; // Padrão: primeira obra
        
        // Se estiver em uma obra específica no momento
        if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
          obraId = colaborador.subEstado;
        }
        
        // Salvar a obra atual como subEstado
        colaborador.subEstado = obraId;
        
        resposta = `📍 Registro de Presença\n\nVocê deseja registrar:\n1. Entrada\n2. Saída\n\nOu envie "status" para verificar sua situação atual.`;
      } else {
        resposta = `❌ Você não está vinculado a nenhuma obra. Por favor, entre em uma obra primeiro.`;
        etapaNova = 'menu'; // Mantém no menu
        break;
      }
      etapaNova = 'registrando_presenca';
      break;

    case '5':
      resposta = `🆕 Vamos cadastrar uma nova tarefa.\n\nQual o *título* da tarefa?`;
      etapaNova = 'criando_tarefa_titulo';
      break;

    case '6':
      resposta = `👷‍♂️ Vamos cadastrar um novo colaborador.\n\nQual o *nome* do colaborador?`;
      etapaNova = 'cadastrando_colab_nome';
      break;

    case '7':
      return await estadoVerColaboradores(colaborador);

    case '8':
      return await estadoGuiaStartIA(colaborador);
      
    case '9':
      resposta = `📝 Por favor, descreva o problema encontrado na obra:`;
      colaborador.subEstado = 'descricao';  // Já define como 'descricao' diretamente
      etapaNova = 'relatando_problema_descricao';
      break;
      
    case '10':
      colaborador.subEstadoProblema = 'listar';
      return await estadoVerProblemas(colaborador);
      
    // Case especial para quando for redirecionado de outro estado com 'resumo'
    case 'resumo':
      // Usar a nova função gerarResumoContextual em vez de gerarResumoParaUsuario
      const resumo = await gerarResumoContextual(colaborador, 'menu');
      resposta = `👋 Aqui está um resumo:\n\n${resumo}\n\n📋 Menu Principal:\n1️⃣ Criar nova obra\n2️⃣ Entrar em uma obra existente\n3️⃣ Ver minhas tarefas\n4️⃣ Registrar presença\n5️⃣ Cadastrar tarefa\n6️⃣ Cadastrar colaborador\n7️⃣ Ver equipe da obra\n8️⃣ O que é o StartIA?\n9️⃣ Relatar problema\n🔟 Ver problemas`;
      break;

    default:
      // Usar a nova função gerarResumoContextual em vez de gerarResumoParaUsuario
      const resumoPadrao = await gerarResumoContextual(colaborador, 'menu');
      resposta = `👋 Aqui está um resumo:\n\n${resumoPadrao}\n\n📋 Menu Principal:\n1️⃣ Criar nova obra\n2️⃣ Entrar em uma obra existente\n3️⃣ Ver minhas tarefas\n4️⃣ Registrar presença\n5️⃣ Cadastrar tarefa\n6️⃣ Cadastrar colaborador\n7️⃣ Ver equipe da obra\n8️⃣ O que é o StartIA?\n9️⃣ Relatar problema\n🔟 Ver problemas`;
      break;
  }

  return { resposta, etapaNova };
};