// src/ia/fsm/obra/estadoEmObra.js - VERSÃO CORRIGIDA

const gerarResumoParaUsuario = require('../../../utils/gerarResumo');

module.exports = async function estadoEmObra(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro; // Mantém o estado atual por padrão
  
  // Obter nome do colaborador para personalização
  const nomeColaborador = colaborador.nome ? `${colaborador.nome}` : '';
  const saudacao = nomeColaborador ? `Olá, ${nomeColaborador}!` : 'Olá!';
  
  try {
    // Se não há mensagem específica, mostrar menu
    if (!mensagem || mensagem.trim() === '' || mensagem.toLowerCase() === 'menu') {
      const resumo = await gerarResumoParaUsuario(colaborador);
      resposta = `👋 VOCÊ ESTÁ EM UMA OBRA

${resumo}

📋 *O QUE VOCÊ DESEJA FAZER?*

📋 OBRAS
1️⃣ Criar nova obra
2️⃣ Entrar em obra existente

⏱️ SEU DIA DE TRABALHO  
3️⃣ Ver minhas tarefas
4️⃣ Registrar presença

👷‍♂️ GERENCIAMENTO
5️⃣ Cadastrar tarefa
6️⃣ Adicionar colaborador  
7️⃣ Ver equipe da obra

⚠️ PROBLEMAS
9️⃣ Relatar problema
🔟 Ver problemas

ℹ️ Digite 8️⃣ para conhecer o StartIA

💡 Digite o número da opção desejada.`;
      etapaNova = 'em_obra'; // Mantém no estado em_obra
      return { resposta, etapaNova };
    }
    
    // ✅ PROCESSAR AS OPÇÕES DO MENU
    switch (mensagem.trim()) {
      case '1':
        resposta = `📝 CRIAR NOVA OBRA

${saudacao} Vamos criar uma nova obra para seu projeto!

Por favor, digite o *nome da obra*:
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
        // Redirecionar para ver tarefas
        const estadoVerTarefas = require('../tarefa/estadoVerTarefas');
        return await estadoVerTarefas(colaborador);
        
      case '4':
        // Verificar se tem obra ativa para registrar presença
        if (colaborador.obras && colaborador.obras.length > 0) {
          const obraId = colaborador.subEstado || colaborador.obras[0];
          colaborador.subEstado = obraId;
          
          resposta = `📝 REGISTRO DE PRESENÇA

${saudacao} Escolha uma opção:
1️⃣ Registrar ENTRADA agora (início de expediente)
2️⃣ Registrar SAÍDA agora (fim de expediente)

🕒 Para verificar seu status de hoje, digite "status"
0️⃣ Voltar ao menu anterior`;
          etapaNova = 'registrando_presenca';
        } else {
          resposta = `❌ ERRO

Você não está vinculado a nenhuma obra para registrar presença.
Digite "menu" para voltar às opções.`;
        }
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
        // Redirecionar para ver colaboradores
        const estadoVerColaboradores = require('../colaborador/estadoVerColaboradores');
        return await estadoVerColaboradores(colaborador);
        
      case '8':
        // Redirecionar para guia StartIA
        const estadoGuiaStartIA = require('../colaborador/estadoGuiaStartIA');
        return await estadoGuiaStartIA(colaborador);
        
      case '9':
        resposta = `⚠️ RELATAR PROBLEMA NA OBRA

${saudacao} Conte-nos o que está acontecendo.

📝 Por favor, descreva detalhadamente o problema:
- Onde está ocorrendo?
- O que está acontecendo?  
- Qual a urgência?`;
        colaborador.subEstado = 'descricao';
        etapaNova = 'relatando_problema_descricao';
        break;
        
      case '10':
        // Redirecionar para ver problemas
        colaborador.subEstadoProblema = 'listar';
        const estadoVerProblemas = require('../problema/estadoVerProblemas');
        return await estadoVerProblemas(colaborador);
        
      default:
        // Comando não reconhecido, mostrar menu novamente
        const resumo = await gerarResumoParaUsuario(colaborador);
        resposta = `❓ COMANDO NÃO RECONHECIDO

${resumo}

📋 *OPÇÕES DISPONÍVEIS:*

1️⃣ Criar nova obra
2️⃣ Entrar em obra existente  
3️⃣ Ver minhas tarefas
4️⃣ Registrar presença
5️⃣ Cadastrar tarefa
6️⃣ Adicionar colaborador
7️⃣ Ver equipe da obra
8️⃣ O que é o StartIA?
9️⃣ Relatar problema
🔟 Ver problemas

💡 Digite o número da opção desejada.`;
        etapaNova = 'em_obra';
        break;
    }
    
  } catch (error) {
    console.error('❌ Erro no estado em_obra:', error);
    resposta = `⚠️ ERRO DO SISTEMA

Ocorreu um erro ao processar sua solicitação.
Digite "menu" para voltar às opções principais.

Se o problema persistir, entre em contato com o suporte.`;
    etapaNova = 'menu';
  }
  
  return { resposta, etapaNova };
};