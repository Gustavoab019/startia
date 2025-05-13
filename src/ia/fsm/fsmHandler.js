// src/ia/fsm/fsmHandler.js

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
// Novo import para detalhes da tarefa
const estadoVerTarefaDetalhe = require('./tarefa/estadoVerTarefaDetalhe');

// Novos imports
const { gerarResumoContextual } = require('../../utils/gerarResumoContextual');
const { gerarAjudaContextual } = require('../../utils/ajudaContextual');

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

  // NOVO: Verificar comandos globais
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
      resposta: `📱 *Seu Status Atual:*\n\n${resumoContextual}`,
      etapaNova: colaborador.etapaCadastro // Mantém o estado atual
    };
  }
  
  // 3. Verificar cancelamento de fluxos
  if (['cancelar', 'cancel'].includes(comando)) {
    // Apenas estados que fazem parte de um fluxo que pode ser cancelado
    const estadosFluxo = [
      'criando_obra_nome', 'criando_obra_endereco', 'criando_obra_almoco_inicio',
      'criando_obra_almoco_hora_inicio', 'criando_obra_almoco_hora_fim',
      'criando_tarefa_titulo', 'criando_tarefa_descricao', 'criando_tarefa_prazo', 'criando_tarefa_atribuicao',
      'cadastrando_colab_nome', 'cadastrando_colab_telefone', 'cadastrando_colab_tipo', 'cadastrando_colab_funcao',
      'relatando_problema_descricao', 'relatando_problema_foto'
    ];
    
    if (estadosFluxo.includes(colaborador.etapaCadastro)) {
      // Limpar campos temporários com base no tipo de fluxo
      if (colaborador.etapaCadastro.startsWith('criando_obra_')) {
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
        resposta: `❌ Operação cancelada. Voltando ao menu principal.\n\nDigite qualquer coisa para ver as opções.`,
        etapaNova: 'menu'
      };
    }
  }

  // Onboarding inicial
  if (colaborador.etapaCadastro === 'novo') {
    colaborador.etapaCadastro = 'menu';
    await colaborador.save();

    return {
      resposta: `👷‍♂️ *Bem-vindo ao StartIA!*
Sou seu assistente de obras via WhatsApp.

Comigo, você pode:
✔️ Criar e organizar obras  
✔️ Cadastrar e acompanhar tarefas  
✔️ Controlar presenças da equipe  
✔️ Visualizar tudo com clareza

🎯 Nosso objetivo é evitar bagunça e melhorar a comunicação.

Vamos começar?

📋 Menu Inicial:
1️⃣ Criar nova obra  
2️⃣ Entrar em uma obra existente

💡 Digite "ajuda" a qualquer momento para ver os comandos disponíveis.`,
      etapaNova: 'menu'
    };
  }

  // Comandos universais
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
      resposta: `📋 Menu Principal:\n\n${resumo}\n\n1️⃣ Criar nova obra  
2️⃣ Entrar em uma obra existente  
3️⃣ Ver minhas tarefas  
4️⃣ Registrar presença  
5️⃣ Cadastrar tarefa  
6️⃣ Cadastrar colaborador  
7️⃣ Ver equipe da obra  
8️⃣ O que é o StartIA?
9️⃣ Relatar problema
🔟 Ver problemas`,
      etapaNova: 'menu'
    };
  }

  // Processamento dos estados específicos com comandos rápidos
  switch (colaborador.etapaCadastro) {
    case 'menu':
      // Comandos rápidos para o menu
      if (comando === 'tarefas' || comando === 'minhas tarefas') {
        return await estadoVerTarefas(colaborador);
      } else if (comando === 'presença' || comando === 'presenca') {
        colaborador.subEstado = colaborador.obras ? colaborador.obras[0] : null;
        return {
          resposta: `📍 Registro de Presença\n\nVocê deseja registrar:\n1. Entrada\n2. Saída\n\nOu envie "status" para verificar sua situação atual.`,
          etapaNova: 'registrando_presenca'
        };
      } else if (comando === 'equipe' || comando === 'colaboradores') {
        return await estadoVerColaboradores(colaborador);
      } else if (comando === 'problema' || comando === 'relatar') {
        colaborador.subEstado = 'descricao';
        return {
          resposta: `📝 Por favor, descreva o problema encontrado na obra:`,
          etapaNova: 'relatando_problema_descricao'
        };
      } else if (comando === 'resumo') {
        return {
          resposta: await gerarResumoContextual(colaborador, 'menu'),
          etapaNova: 'menu'
        };
      }
      
      return await estadoMenu(colaborador, mensagemTexto);

    case 'criando_obra_nome':
    case 'criando_obra_endereco':
    case 'criando_obra_almoco_inicio':
    case 'criando_obra_almoco_hora_inicio':
    case 'criando_obra_almoco_hora_fim':
      return await estadoCriandoObra(colaborador, mensagemTexto);

    case 'entrando_obra_codigo':
      return await estadoEntrandoObra(colaborador, mensagemTexto);
      
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

    case 'ver_tarefas':
      return await estadoVerTarefas(colaborador, mensagemTexto);
      
    // Novo estado para ver detalhes de uma tarefa
    case 'ver_tarefa_detalhe':
      return await estadoVerTarefaDetalhe(colaborador, mensagemTexto);

    case 'criando_tarefa_titulo':
    case 'criando_tarefa_descricao':
    case 'criando_tarefa_prazo':
    case 'criando_tarefa_atribuicao':
      return await estadoCriandoTarefa(colaborador, mensagemTexto);

    case 'cadastrando_colab_nome':
    case 'cadastrando_colab_telefone':
    case 'cadastrando_colab_tipo':
    case 'cadastrando_colab_funcao':
      return await estadoCadastrarColaborador(colaborador, mensagemTexto);

    case 'ver_colaboradores':
      return await estadoVerColaboradores(colaborador, mensagemTexto);

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

    case 'guia_startia':
      return await estadoGuiaStartIA(colaborador, mensagemTexto);
      
    // Estados para problemas
    case 'relatando_problema_descricao':
    case 'relatando_problema_foto':
      return await estadoRelatandoProblema(colaborador, mensagemTexto, contexto);
      
    case 'vendo_problemas':
      return await estadoVerProblemas(colaborador, mensagemTexto);

    // Fallback de segurança
    default:
      console.warn(`⚠️ Estado desconhecido: ${colaborador.etapaCadastro}. Resetando para menu.`);
      colaborador.etapaCadastro = 'menu';
      await colaborador.save();

      return {
        resposta: `⚠️ Ocorreu um erro ou estado desconhecido.\n\n🔄 Retornando ao menu principal...\n\n📋 Menu Principal:\n1️⃣ Criar nova obra\n2️⃣ Entrar em uma obra existente\n3️⃣ Ver minhas tarefas\n4️⃣ Registrar presença\n5️⃣ Cadastrar tarefa\n6️⃣ Cadastrar colaborador\n7️⃣ Ver equipe da obra\n8️⃣ O que é o StartIA?\n9️⃣ Relatar problema\n🔟 Ver problemas

💡 Digite "ajuda" a qualquer momento para ver os comandos disponíveis.`,
        etapaNova: 'menu'
      };
  }
}

module.exports = { fsmResponder };