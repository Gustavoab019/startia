// src/ia/fsm/estadoMenu.js

const estadoVerTarefas = require('./tarefa/estadoVerTarefas');
const estadoVerColaboradores = require('./colaborador/estadoVerColaboradores');
const estadoGuiaStartIA = require('./colaborador/estadoGuiaStartIA');
const estadoVerProblemas = require('./problema/estadoVerProblemas');
// Substituir a importação original pela nova função
const { gerarResumoContextual } = require('../../utils/gerarResumoContextual');
const { templates } = require('../../utils/mensagensConfirmacao');
const mongoose = require('mongoose');

module.exports = async function estadoMenu(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  // Obter nome do colaborador para personalização
  const nomeColaborador = colaborador.nome ? `${colaborador.nome}` : '';
  const saudacao = nomeColaborador ? `Olá, ${nomeColaborador}!` : 'Olá!';

  switch (mensagem) {
    case '1':
      resposta = `📝 NOVA OBRA

${saudacao} Vamos criar uma nova obra para seu projeto!

Por favor, digite o *nome da obra* 
(Ex: "Residencial Vila Nova" ou "Reforma Apartamento 302")`;
      etapaNova = 'criando_obra_nome';
      break;

    case '2':
      resposta = `🔑 ACESSAR OBRA EXISTENTE

Digite o *código de acesso* da obra para entrar.
O código deve ter sido compartilhado com você pelo administrador da obra.

Exemplo: ABC123`;
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
        
        // Tentar encontrar o nome da obra
        let nomeObra = "";
        try {
          const Obra = require('../../domains/obra/obra.model');
          const obra = await Obra.findById(obraId);
          if (obra) {
            nomeObra = obra.nome;
          }
        } catch (error) {
          console.error('Erro ao buscar nome da obra:', error);
        }
        
        // Salvar a obra atual como subEstado
        colaborador.subEstado = obraId;
        
        resposta = `📝 REGISTRO DE PRESENÇA${nomeObra ? `\n🏗️ Obra: ${nomeObra}` : ''}

Escolha uma opção:
1️⃣ Registrar ENTRADA agora (início de expediente)
2️⃣ Registrar SAÍDA agora (fim de expediente)

🕒 Para verificar seu status de hoje, digite "status"
0️⃣ Voltar ao menu principal`;
      } else {
        resposta = `❌ ACESSO INDISPONÍVEL

Você ainda não está vinculado a nenhuma obra.

Para acessar essa função:
1️⃣ Crie uma obra (digite "1")
2️⃣ Entre em uma obra existente (digite "2")`;
        etapaNova = 'menu'; // Mantém no menu
        break;
      }
      etapaNova = 'registrando_presenca';
      break;

    case '5':
      resposta = `🆕 CADASTRAR NOVA TAREFA

${saudacao} Vamos cadastrar uma tarefa passo a passo.

🔤 Qual será o *título* da tarefa?
(Ex: "Instalar portas do 2º andar" ou "Pintura da sala principal")`;
      etapaNova = 'criando_tarefa_titulo';
      break;

    case '6':
      resposta = `👷‍♂️ ADICIONAR COLABORADOR

${saudacao} Vamos adicionar um novo membro à equipe.

🔤 Digite o *nome completo* do colaborador:`;
      etapaNova = 'cadastrando_colab_nome';
      break;

    case '7':
      return await estadoVerColaboradores(colaborador);

    case '8':
      return await estadoGuiaStartIA(colaborador);
      
    case '9':
      resposta = `⚠️ RELATAR PROBLEMA NA OBRA

${saudacao} Conte-nos o que está acontecendo.

📝 Por favor, descreva detalhadamente o problema:
- Onde está ocorrendo?
- O que está acontecendo?
- Qual a urgência?`;
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
      resposta = `📱 MENU PRINCIPAL DO STARTIA

${resumo}

O que você deseja fazer hoje?

📋 OBRAS
1️⃣ Criar nova obra
2️⃣ Entrar em obra existente

⏱️ SEU DIA DE TRABALHO
3️⃣ Ver minhas tarefas pendentes
4️⃣ Registrar entrada/saída na obra

👷‍♂️ GERENCIAMENTO
5️⃣ Cadastrar nova tarefa
6️⃣ Adicionar colaborador
7️⃣ Ver equipe atual da obra

⚠️ PROBLEMAS
9️⃣ Relatar um problema
🔟 Ver problemas reportados

ℹ️ Digite 8️⃣ para conhecer mais sobre o StartIA`;
      break;

    default:
      // Usar a nova função gerarResumoContextual em vez de gerarResumoParaUsuario
      const resumoPadrao = await gerarResumoContextual(colaborador, 'menu');
      resposta = `📱 MENU PRINCIPAL DO STARTIA

${saudacao}
${resumoPadrao}

O que você deseja fazer hoje?

📋 OBRAS
1️⃣ Criar nova obra
2️⃣ Entrar em obra existente

⏱️ SEU DIA DE TRABALHO
3️⃣ Ver minhas tarefas pendentes
4️⃣ Registrar entrada/saída na obra

👷‍♂️ GERENCIAMENTO
5️⃣ Cadastrar nova tarefa
6️⃣ Adicionar colaborador
7️⃣ Ver equipe atual da obra

⚠️ PROBLEMAS
9️⃣ Relatar um problema
🔟 Ver problemas reportados

ℹ️ Digite 8️⃣ para conhecer mais sobre o StartIA`;
      break;
  }

  return { resposta, etapaNova };
};