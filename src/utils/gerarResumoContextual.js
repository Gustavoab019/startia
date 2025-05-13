// src/utils/gerarResumoContextual.js

const Obra = require('../domains/obra/obra.model');
const Tarefa = require('../domains/tarefa/tarefa.model');
const Presenca = require('../domains/presenca/presenca.model');
const Problema = require('../domains/problema/problema.model');

/**
 * Gera um resumo contextual baseado no estado atual do colaborador
 * @param {Object} colaborador - Objeto colaborador
 * @param {String} estado - Estado atual (opcional, usa etapaCadastro se não fornecido)
 * @returns {Promise<String>} Resumo formatado
 */
async function gerarResumoContextual(colaborador, estado = null) {
  // Estado atual do colaborador
  const estadoAtual = estado || colaborador.etapaCadastro;
  
  // Obtém informações básicas primeiro
  let resumo = await gerarResumoBasico(colaborador);
  
  // Adiciona informações contextuais baseadas no estado
  switch (estadoAtual) {
    case 'menu':
      resumo += '\n\n📋 Você está no menu principal.';
      break;
      
    case 'em_obra':
      const obraAtiva = await obterObraAtiva(colaborador);
      if (obraAtiva) {
        resumo += `\n\n🏗️ Você está na obra "${obraAtiva.nome}"`;
        
        // Adicionar estatísticas da obra se disponíveis
        const stats = await obterEstatisticasObra(obraAtiva._id);
        if (stats) {
          resumo += `\n👷 ${stats.colaboradoresAtivos} colaboradores ativos`;
          resumo += `\n📝 ${stats.tarefasPendentes} tarefas pendentes`;
        }
      }
      break;
      
    case 'ver_tarefas':
      resumo += '\n\n📋 Visualizando suas tarefas.';
      break;
      
    case 'registrando_presenca':
      const statusPresenca = await verificarStatusPresenca(colaborador);
      resumo += `\n\n⏱️ ${statusPresenca}`;
      break;
      
    case 'criando_tarefa_titulo':
      resumo += '\n\n📝 Você está criando uma nova tarefa (etapa 1/4: título).';
      break;
      
    case 'criando_tarefa_descricao':
      resumo += '\n\n📝 Você está criando uma nova tarefa (etapa 2/4: descrição).';
      break;
      
    case 'criando_tarefa_prazo':
      resumo += '\n\n📝 Você está criando uma nova tarefa (etapa 3/4: prazo).';
      break;
      
    case 'criando_tarefa_atribuicao':
      resumo += '\n\n📝 Você está criando uma nova tarefa (etapa 4/4: atribuição).';
      break;
      
    case 'relatando_problema_descricao':
      resumo += '\n\n❗ Você está relatando um problema (etapa 1/2: descrição).';
      break;
      
    case 'relatando_problema_foto':
      resumo += '\n\n❗ Você está relatando um problema (etapa 2/2: foto).';
      break;
      
    case 'vendo_problemas':
      resumo += '\n\n🔍 Você está visualizando os problemas reportados.';
      break;
      
    case 'cadastrando_colab_nome':
      resumo += '\n\n👤 Você está cadastrando um novo colaborador (etapa 1/4: nome).';
      break;
      
    case 'cadastrando_colab_telefone':
      resumo += '\n\n👤 Você está cadastrando um novo colaborador (etapa 2/4: telefone).';
      break;
      
    case 'cadastrando_colab_tipo':
      resumo += '\n\n👤 Você está cadastrando um novo colaborador (etapa 3/4: tipo).';
      break;
      
    case 'cadastrando_colab_funcao':
      resumo += '\n\n👤 Você está cadastrando um novo colaborador (etapa 4/4: função).';
      break;
      
    case 'criando_obra_nome':
      resumo += '\n\n🏗️ Você está criando uma nova obra (etapa 1/3: nome).';
      break;
      
    case 'criando_obra_endereco':
      resumo += '\n\n🏗️ Você está criando uma nova obra (etapa 2/3: endereço).';
      break;
      
    case 'criando_obra_almoco_inicio':
    case 'criando_obra_almoco_hora_inicio':
    case 'criando_obra_almoco_hora_fim':
      resumo += '\n\n🏗️ Você está criando uma nova obra (etapa 3/3: horário de almoço).';
      break;
      
    case 'entrando_obra_codigo':
      resumo += '\n\n🔑 Você está tentando entrar em uma obra com código de acesso.';
      break;
      
    case 'ver_colaboradores':
      resumo += '\n\n👥 Você está visualizando a equipe da obra.';
      break;
      
    case 'guia_startia':
      resumo += '\n\n📖 Você está consultando o guia do StartIA.';
      break;
  }
  
  // Adicionar breadcrumb de navegação
  resumo += '\n\n' + gerarBreadcrumb(estadoAtual);
  
  // Adicionar dica de ajuda
  resumo += '\n\n💡 Digite "ajuda" a qualquer momento para ver comandos disponíveis.';
  
  return resumo;
}

/**
 * Gera resumo básico com informações do colaborador
 */
async function gerarResumoBasico(colaborador) {
  let resumo = '';

  // Nome e função
  resumo += `👤 ${colaborador.nome || 'Colaborador'} `;
  if (colaborador.funcao) {
    resumo += `(${colaborador.funcao})`;
  }
  resumo += '\n';

  // Obra atual
  if (colaborador.obras && colaborador.obras.length > 0) {
    try {
      const obraId = colaborador.subEstado || colaborador.obras[0];
      const obra = await Obra.findById(obraId);
      
      if (obra) {
        resumo += `🏗️ Obra atual: *${obra.nome}*\n`;
        resumo += `📍 ${obra.endereco || 'Local não especificado'}\n`;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar obra: ${error.message}`);
    }
  } else {
    resumo += '❗ Você não está vinculado a nenhuma obra.\n';
  }

  // Contagem de tarefas
  try {
    const [tarefasPendentes, tarefasConcluidas] = await Promise.all([
      Tarefa.countDocuments({
        atribuidaPara: colaborador._id,
        status: { $ne: 'concluida' }
      }),
      Tarefa.countDocuments({
        atribuidaPara: colaborador._id,
        status: 'concluida'
      })
    ]);

    if (tarefasPendentes > 0) {
      resumo += `📝 ${tarefasPendentes} tarefa${tarefasPendentes > 1 ? 's' : ''} pendente${tarefasPendentes > 1 ? 's' : ''}\n`;
    }
    if (tarefasConcluidas > 0) {
      resumo += `✅ ${tarefasConcluidas} tarefa${tarefasConcluidas > 1 ? 's' : ''} concluída${tarefasConcluidas > 1 ? 's' : ''}\n`;
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar tarefas: ${error.message}`);
  }

  return resumo;
}

/**
 * Gera breadcrumb baseado no estado atual
 */
function gerarBreadcrumb(estado) {
  // Mapeamento de estados para texto legível
  const estadosTexto = {
    'menu': 'Menu Principal',
    'em_obra': 'Em Obra',
    'ver_tarefas': 'Visualizando Tarefas',
    'criando_tarefa_titulo': 'Criando Tarefa > Título',
    'criando_tarefa_descricao': 'Criando Tarefa > Descrição',
    'criando_tarefa_prazo': 'Criando Tarefa > Prazo',
    'criando_tarefa_atribuicao': 'Criando Tarefa > Atribuição',
    'registrando_presenca': 'Registrando Presença',
    'relatando_problema_descricao': 'Relatando Problema > Descrição',
    'relatando_problema_foto': 'Relatando Problema > Foto',
    'vendo_problemas': 'Visualizando Problemas',
    'cadastrando_colab_nome': 'Cadastrando Colaborador > Nome',
    'cadastrando_colab_telefone': 'Cadastrando Colaborador > Telefone',
    'cadastrando_colab_tipo': 'Cadastrando Colaborador > Tipo',
    'cadastrando_colab_funcao': 'Cadastrando Colaborador > Função',
    'criando_obra_nome': 'Criando Obra > Nome',
    'criando_obra_endereco': 'Criando Obra > Endereço',
    'criando_obra_almoco_inicio': 'Criando Obra > Almoço (1/3)',
    'criando_obra_almoco_hora_inicio': 'Criando Obra > Almoço (2/3)',
    'criando_obra_almoco_hora_fim': 'Criando Obra > Almoço (3/3)',
    'entrando_obra_codigo': 'Entrando na Obra',
    'ver_colaboradores': 'Visualizando Equipe',
    'guia_startia': 'Guia StartIA',
    'novo': 'Boas-vindas'
  };
  
  return `🔍 Você está em: ${estadosTexto[estado] || estado}`;
}

/**
 * Obtém estatísticas resumidas de uma obra
 */
async function obterEstatisticasObra(obraId) {
  try {
    // Buscas em paralelo para melhor performance
    const [colaboradoresAtivos, tarefasPendentes, problemasAbertos] = await Promise.all([
      // Colaboradores que registraram presença hoje
      Presenca.countDocuments({
        obra: obraId,
        status: 'pendente',
        dataEntrada: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      
      // Tarefas pendentes da obra
      Tarefa.countDocuments({
        obra: obraId,
        status: { $ne: 'concluida' }
      }),
      
      // Problemas não resolvidos
      Problema.countDocuments({
        obra: obraId,
        status: { $ne: 'resolvido' }
      })
    ]);
    
    return {
      colaboradoresAtivos,
      tarefasPendentes,
      problemasAbertos
    };
  } catch (error) {
    console.error(`❌ Erro ao obter estatísticas da obra: ${error.message}`);
    return null;
  }
}

/**
 * Verifica status de presença e retorna texto descritivo
 */
async function verificarStatusPresenca(colaborador) {
  try {
    if (!colaborador.subEstado) {
      return 'Status de presença não disponível';
    }
    
    const { verificarStatusPresenca } = require('../domains/presenca/presenca.service');
    const status = await verificarStatusPresenca(colaborador._id, colaborador.subEstado);
    
    if (status.status === 'trabalhando') {
      return `Você está na obra há ${status.horasPassadas} horas`;
    } else if (status.status === 'concluido') {
      return `Você já encerrou o expediente hoje (${status.horasTrabalhadas} horas)`;
    } else {
      return 'Você ainda não registrou presença hoje';
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar status de presença: ${error.message}`);
    return 'Status de presença não disponível';
  }
}

/**
 * Obtém obra ativa do colaborador
 */
async function obterObraAtiva(colaborador) {
  const { obterObraAtiva } = require('../domains/obra/obra.service');
  return await obterObraAtiva(colaborador);
}

module.exports = { 
  gerarResumoContextual,
  gerarResumoBasico,
  gerarBreadcrumb 
};