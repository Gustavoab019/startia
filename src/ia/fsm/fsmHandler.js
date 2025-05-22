// src/ia/fsm/fsmHandler.js - VERSÃO COMPLETA COM CORREÇÃO DE NOME

const mongoose = require('mongoose');
const estadoMenu = require('./estadoMenu');
const estadoCriandoObra = require('./obra/estadoCriandoObra');
const estadoEntrandoObra = require('./obra/estadoEntrandoObra');
const estadoEmObra = require('./obra/estadoEmObra');
const estadoVerTarefas = require('./tarefa/estadoVerTarefas');
const estadoCriandoTarefa = require('./tarefa/estadoCriandoTarefa');
const estadoCadastrarColaborador = require('./colaborador/estadoCadastrarColaborador');
const estadoVerColaboradores = require('./colaborador/estadoVerColaboradores');
const estadoRegistrarPresenca = require('./presenca/estadoRegistrarPresenca');
const estadoGuiaStartIA = require('./colaborador/estadoGuiaStartIA');
// Imports para problemas
const estadoRelatandoProblema = require('./problema/estadoRelatandoProblema');
const estadoVerProblemas = require('./problema/estadoVerProblemas');
// Import para detalhes da tarefa
const estadoVerTarefaDetalhe = require('./tarefa/estadoVerTarefaDetalhe');

// Imports dos utilitários
const { gerarResumoContextual } = require('../../utils/gerarResumoContextual');
const { gerarAjudaContextual } = require('../../utils/ajudaContextual');

// ✅ IMPORTS DO SERVICE DE COLABORADOR ATUALIZADO
const { 
  obterSaudacao, 
  obterNomeExibicao, 
  precisaDefinirNome,
  definirNomeColaborador 
} = require('../../domains/colaborador/colaborador.service');

async function fsmResponder(colaborador, mensagem, contexto) {
  // Garantir que mensagem seja uma string, independente do formato recebido
  let mensagemTexto;
  
  if (typeof mensagem === 'string') {
    mensagemTexto = mensagem;
  } else if (mensagem && typeof mensagem === 'object') {
    if (mensagem.message) {
      mensagemTexto = mensagem.message;
    } else {
      mensagemTexto = JSON.stringify(mensagem);
    }
  } else {
    mensagemTexto = String(mensagem || '');
  }
  
  const comando = mensagemTexto.trim().toLowerCase();
  console.log(`🔍 Comando processado: "${comando}"`);

  // ✅ USAR FUNÇÃO DO SERVICE PARA SAUDAÇÃO
  const saudacao = obterSaudacao(colaborador);
  const nomeExibicao = obterNomeExibicao(colaborador);

  // ===== COMANDOS GLOBAIS =====
  
  // 1. Comando de ajuda
  if (['ajuda', 'help', '?'].includes(comando)) {
    return {
      resposta: gerarAjudaContextual(colaborador.etapaCadastro),
      etapaNova: colaborador.etapaCadastro // Mantém o estado atual
    };
  }
  
  // 2. Comando de status/onde estou
  if (['status', 'onde estou', 'contexto'].includes(comando)) {
    const resumoContextual = await gerarResumoContextual(colaborador);
    return {
      resposta: `📱 *SEU STATUS ATUAL:*

${resumoContextual}

💡 Digite "ajuda" para ver os comandos disponíveis.`,
      etapaNova: colaborador.etapaCadastro // Mantém o estado atual
    };
  }
  
  // ✅ 3. COMANDO PARA ATUALIZAR NOME
  if (comando.startsWith('meu nome é ') || comando.startsWith('nome ')) {
    const novoNome = comando.replace(/^(meu nome é |nome )/i, '').trim();
    
    if (novoNome.length >= 2) {
      try {
        await definirNomeColaborador(colaborador._id, novoNome);
        
        return {
          resposta: `✅ *NOME ATUALIZADO COM SUCESSO!*

Agora você é: *${novoNome}*

Digite "menu" para continuar ou qualquer outra opção.`,
          etapaNova: colaborador.etapaCadastro
        };
      } catch (error) {
        console.error('❌ Erro ao atualizar nome:', error);
        return {
          resposta: `❌ Erro ao atualizar nome. Tente novamente.

💡 Use: "meu nome é João Silva"`,
          etapaNova: colaborador.etapaCadastro
        };
      }
    } else {
      return {
        resposta: `⚠️ Nome deve ter pelo menos 2 caracteres.

💡 Use: "meu nome é João Silva"`,
        etapaNova: colaborador.etapaCadastro
      };
    }
  }
  
  // 4. Verificar cancelamento de fluxos
  if (['cancelar', 'cancel'].includes(comando)) {
    // Estados que fazem parte de um fluxo que pode ser cancelado
    const estadosFluxo = [
      'criando_obra_nome', 'criando_obra_endereco', 'criando_obra_almoco_inicio',
      'criando_obra_almoco_hora_inicio', 'criando_obra_almoco_hora_fim', 'confirmando_obra_duplicata',
      'criando_tarefa_titulo', 'criando_tarefa_descricao', 'criando_tarefa_prazo', 'criando_tarefa_atribuicao',
      'cadastrando_colab_nome', 'cadastrando_colab_telefone', 'cadastrando_colab_tipo', 'cadastrando_colab_funcao',
      'relatando_problema_descricao', 'relatando_problema_foto',
      'coletando_nome' // ✅ ADICIONAR NOVO ESTADO
    ];
    
    if (estadosFluxo.includes(colaborador.etapaCadastro)) {
      // Limpar campos temporários com base no tipo de fluxo
      if (colaborador.etapaCadastro.startsWith('criando_obra_') || colaborador.etapaCadastro === 'confirmando_obra_duplicata') {
        colaborador.tempNomeObra = undefined;
        colaborador.tempEnderecoObra = undefined;
        colaborador.tempHoraInicioAlmoco = undefined;
        colaborador.tempHoraFimAlmoco = undefined;
      } else if (colaborador.etapaCadastro.startsWith('criando_tarefa_')) {
        colaborador.tempTituloTarefa = undefined;
        colaborador.tempDescricaoTarefa = undefined;
        colaborador.tempPrazoTarefa = undefined;
        colaborador.tempColaboradoresDisponiveis = undefined;
      } else if (colaborador.etapaCadastro.startsWith('cadastrando_colab_')) {
        colaborador.tempNovoNome = undefined;
        colaborador.tempNovoTelefone = undefined;
        colaborador.tempNovoTipo = undefined;
        colaborador.tempNovoFuncao = undefined;
      } else if (colaborador.etapaCadastro.startsWith('relatando_problema_')) {
        colaborador.tempDescricaoProblema = undefined;
      }
      
      // Salvar as alterações
      await colaborador.save();
      
      return {
        resposta: `❌ OPERAÇÃO CANCELADA

${saudacao} Você cancelou a operação atual.
Voltando ao menu principal.

Digite qualquer coisa para ver as opções.`,
        etapaNova: 'menu'
      };
    }
  }

  // ===== ONBOARDING INICIAL =====
  
  if (colaborador.etapaCadastro === 'novo') {
    // ✅ VERIFICAR SE COLABORADOR PRECISA DEFINIR NOME
    if (precisaDefinirNome(colaborador)) {
      return {
        resposta: `👷‍♂️ *BEM-VINDO AO STARTIA!*

Olá! Sou seu assistente de obras via WhatsApp.

Antes de começar, preciso saber seu nome.
👤 *Como você gostaria de ser chamado?*

(Ex: "João Silva" ou "Maria")`,
        etapaNova: 'coletando_nome'
      };
    }
    
    // Se já tem nome, ir direto para menu
    colaborador.etapaCadastro = 'menu';
    await colaborador.save();

    return {
      resposta: `👷‍♂️ *BEM-VINDO DE VOLTA AO STARTIA!*

${saudacao} Sou seu assistente de obras via WhatsApp.

Comigo, você pode:
✔️ Criar e organizar obras  
✔️ Cadastrar e acompanhar tarefas  
✔️ Controlar presenças da equipe  
✔️ Visualizar tudo com clareza

🎯 Nosso objetivo é evitar bagunça e melhorar a comunicação na sua obra.

Vamos começar?

📋 MENU INICIAL:
1️⃣ Criar nova obra  
2️⃣ Entrar em uma obra existente

💡 Digite "ajuda" a qualquer momento para ver os comandos disponíveis.`,
      etapaNova: 'menu'
    };
  }

  // ===== COMANDOS UNIVERSAIS =====
  
  if (['menu', 'voltar', 'início', 'inicio', '0'].includes(comando)) {
    // Limpar quaisquer dados temporários de navegação
    colaborador.tempTarefasIds = undefined;
    colaborador.tempTarefaSelecionadaId = undefined;
    colaborador.tempIndicesPorTarefa = undefined;
    colaborador.tempProblemasIds = undefined;
    await colaborador.save();
    
    // Buscar resumo contextual
    const resumo = await gerarResumoContextual(colaborador, 'menu');
    
    return {
      resposta: `📱 MENU PRINCIPAL DO STARTIA

${saudacao}
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
7️⃣ Ver equipe da obra  

⚠️ PROBLEMAS
9️⃣ Relatar um problema
🔟 Ver problemas reportados

ℹ️ Digite 8️⃣ para conhecer mais sobre o StartIA`,
      etapaNova: 'menu'
    };
  }

  // ===== PROCESSAMENTO DOS ESTADOS ESPECÍFICOS =====
  
  switch (colaborador.etapaCadastro) {
    // ✅ NOVO ESTADO PARA COLETAR NOME
    case 'coletando_nome':
      if (!mensagemTexto || mensagemTexto.trim().length < 2) {
        return {
          resposta: `⚠️ Por favor, digite um nome válido com pelo menos 2 caracteres.

👤 *Como você gostaria de ser chamado?*
(Ex: "João Silva" ou "Maria")`,
          etapaNova: 'coletando_nome'
        };
      }
      
      try {
        await definirNomeColaborador(colaborador._id, mensagemTexto.trim());
        
        // Recarregar colaborador para ter nome atualizado
        const Colaborador = require('../../domains/colaborador/colaborador.model');
        const colaboradorAtualizado = await Colaborador.findById(colaborador._id);
        const saudacaoAtualizada = obterSaudacao(colaboradorAtualizado);
        
        return {
          resposta: `✅ Muito prazer, *${colaboradorAtualizado.nome}*!

🏗️ *STARTIA - SEU ASSISTENTE DE OBRAS*

Comigo você pode:
✔️ Criar e organizar obras  
✔️ Cadastrar e acompanhar tarefas  
✔️ Controlar presenças da equipe  
✔️ Visualizar tudo com clareza

🎯 Nosso objetivo é evitar bagunça e melhorar a comunicação na sua obra.

Vamos começar?

📋 MENU INICIAL:
1️⃣ Criar nova obra  
2️⃣ Entrar em uma obra existente

💡 Digite "ajuda" a qualquer momento para ver os comandos disponíveis.`,
          etapaNova: 'menu'
        };
      } catch (error) {
        console.error('❌ Erro ao definir nome:', error);
        return {
          resposta: `❌ Erro ao salvar seu nome. Tente novamente.

👤 *Como você gostaria de ser chamado?*`,
          etapaNova: 'coletando_nome'
        };
      }
    
    case 'menu':
      // Comandos rápidos para o menu
      if (comando === 'tarefas' || comando === 'minhas tarefas') {
        return await estadoVerTarefas(colaborador);
      } else if (comando === 'presença' || comando === 'presenca') {
        colaborador.subEstado = colaborador.obras ? colaborador.obras[0] : null;
        return {
          resposta: `📝 REGISTRO DE PRESENÇA

${saudacao} Escolha uma opção:
1️⃣ Registrar ENTRADA agora (início de expediente)
2️⃣ Registrar SAÍDA agora (fim de expediente)

🕒 Para verificar seu status de hoje, digite "status"
0️⃣ Voltar ao menu principal`,
          etapaNova: 'registrando_presenca'
        };
      } else if (comando === 'equipe' || comando === 'colaboradores') {
        return await estadoVerColaboradores(colaborador);
      } else if (comando === 'problema' || comando === 'relatar') {
        colaborador.subEstado = 'descricao';
        return {
          resposta: `⚠️ RELATAR PROBLEMA NA OBRA

${saudacao} Conte-nos o que está acontecendo.

📝 Por favor, descreva detalhadamente o problema:
- Onde está ocorrendo?
- O que está acontecendo?
- Qual a urgência?`,
          etapaNova: 'relatando_problema_descricao'
        };
      } else if (comando === 'resumo') {
        return {
          resposta: await gerarResumoContextual(colaborador, 'menu'),
          etapaNova: 'menu'
        };
      }
      
      return await estadoMenu(colaborador, mensagemTexto);

    // ===== ESTADOS DE CRIAÇÃO DE OBRA =====
    case 'criando_obra_nome':
    case 'criando_obra_endereco':
    case 'criando_obra_almoco_inicio':
    case 'criando_obra_almoco_hora_inicio':
    case 'criando_obra_almoco_hora_fim':
    case 'confirmando_obra_duplicata':
      return await estadoCriandoObra(colaborador, mensagemTexto);

    // ===== ESTADOS DE ENTRADA EM OBRA =====
    case 'entrando_obra_codigo':
      return await estadoEntrandoObra(colaborador, mensagemTexto);
      
    // ===== ESTADO EM OBRA =====
    case 'em_obra':
      // Comandos rápidos para estado em obra
      if (comando === 'entrada' || comando === 'entrar') {
        colaborador.subEstado = colaborador.obras ? colaborador.obras[0] : null;
        const resultadoPresenca = await estadoRegistrarPresenca(colaborador, '1', null);
        return {
          resposta: resultadoPresenca.resposta,
          etapaNova: 'menu'
        };
      } else if (comando === 'saída' || comando === 'saida' || comando === 'sair') {
        colaborador.subEstado = colaborador.obras ? colaborador.obras[0] : null;
        const resultadoPresenca = await estadoRegistrarPresenca(colaborador, '2', null);
        return {
          resposta: resultadoPresenca.resposta,
          etapaNova: 'menu'
        };
      }
      
      return await estadoEmObra(colaborador, mensagemTexto);

    // ===== ESTADOS DE TAREFAS =====
    case 'ver_tarefas':
      return await estadoVerTarefas(colaborador, mensagemTexto);
      
    case 'ver_tarefa_detalhe':
      return await estadoVerTarefaDetalhe(colaborador, mensagemTexto);

    case 'criando_tarefa_titulo':
    case 'criando_tarefa_descricao':
    case 'criando_tarefa_prazo':
    case 'criando_tarefa_atribuicao':
      return await estadoCriandoTarefa(colaborador, mensagemTexto);

    // ===== ESTADOS DE COLABORADORES =====
    case 'cadastrando_colab_nome':
    case 'cadastrando_colab_telefone':
    case 'cadastrando_colab_tipo':
    case 'cadastrando_colab_funcao':
      return await estadoCadastrarColaborador(colaborador, mensagemTexto);

    case 'ver_colaboradores':
      return await estadoVerColaboradores(colaborador, mensagemTexto);

    // ===== ESTADO DE PRESENÇA =====
    case 'registrando_presenca':
      // Pegar a obra atual do colaborador, se existir
      let obraAtual = null;
      if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
        const Obra = require('../../domains/obra/obra.model');
        console.log(`🔍 Buscando obra com ID: ${colaborador.subEstado}`);
        obraAtual = await Obra.findById(colaborador.subEstado);
        if (obraAtual) {
          console.log(`✅ Obra encontrada: ${obraAtual.nome}`);
        } else {
          console.log(`❌ Obra não encontrada com ID: ${colaborador.subEstado}`);
        }
      }
      
      // Comandos rápidos para presença
      if (comando === 'entrada' || comando === 'entrar') {
        mensagemTexto = '1';
      } else if (comando === 'saída' || comando === 'saida' || comando === 'sair') {
        mensagemTexto = '2';
      } else if (comando.includes('status')) {
        mensagemTexto = 'status';
      }
      
      // Usar o módulo refatorado de registro de presença
      const resultadoPresenca = await estadoRegistrarPresenca(colaborador, mensagemTexto, obraAtual);
      
      return {
        resposta: resultadoPresenca.resposta,
        etapaNova: resultadoPresenca.proximoEstado || 'registrando_presenca'
      };

    // ===== ESTADO DE GUIA =====
    case 'guia_startia':
      return await estadoGuiaStartIA(colaborador, mensagemTexto);
      
    // ===== ESTADOS DE PROBLEMAS =====
    case 'relatando_problema_descricao':
    case 'relatando_problema_foto':
      return await estadoRelatandoProblema(colaborador, mensagemTexto, contexto);
      
    case 'vendo_problemas':
      return await estadoVerProblemas(colaborador, mensagemTexto);

    // ===== FALLBACK DE SEGURANÇA =====
    default:
      console.warn(`⚠️ Estado desconhecido: ${colaborador.etapaCadastro}. Resetando para menu.`);
      
      // Limpar dados temporários antes de resetar
      try {
        const Colaborador = require('../../domains/colaborador/colaborador.model');
        const colaboradorCompleto = await Colaborador.findById(colaborador._id);
        if (colaboradorCompleto && colaboradorCompleto.limparDadosTemporarios) {
          await colaboradorCompleto.limparDadosTemporarios();
        }
      } catch (error) {
        console.error('❌ Erro ao limpar dados temporários:', error);
      }
      
      colaborador.etapaCadastro = 'menu';
      await colaborador.save();

      return {
        resposta: `⚠️ ERRO DE SISTEMA

${saudacao} Ocorreu um erro ou estado desconhecido.
Retornamos você ao menu principal para sua segurança.

📱 MENU PRINCIPAL:
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

💡 Digite "ajuda" a qualquer momento para ver os comandos disponíveis.`,
        etapaNova: 'menu'
      };
  }
}

module.exports = { fsmResponder };