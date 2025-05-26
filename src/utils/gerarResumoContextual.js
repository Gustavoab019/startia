// src/utils/gerarResumoContextual.js - VERSÃO ATUALIZADA

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
      const quickStats = await obterEstatisticasRapidas(colaborador);
      resumo += `\n\n📊 ${quickStats}`;
      resumo += '\n\n📋 Você está no menu principal.';
      break;
      
    case 'em_obra':
      const obraAtiva = await obterObraAtiva(colaborador);
      if (obraAtiva) {
        resumo += `\n\n🏗️ Você está na obra "${obraAtiva.nome}"`;
        
        // Adicionar estatísticas da obra se disponíveis
        const stats = await obterEstatisticasObra(obraAtiva._id);
        if (stats) {
          resumo += `\n👷 ${stats.colaboradoresAtivos} colaboradores presentes hoje`;
          resumo += `\n📝 ${stats.tarefasPendentes} tarefas disponíveis no POOL`;
          
          if (stats.problemasAbertos > 0) {
            resumo += `\n⚠️ ${stats.problemasAbertos} problema${stats.problemasAbertos > 1 ? 's' : ''} em aberto`;
          }
        }
      }
      break;
      
    case 'ver_tarefas':
      const infoTarefas = await obterInfoTarefas(colaborador);
      resumo += `\n\n📋 ${infoTarefas}`;
      break;
      
    case 'registrando_presenca':
      const statusPresenca = await verificarStatusPresenca(colaborador);
      resumo += `\n\n⏱️ ${statusPresenca}`;
      break;
      
    case 'criando_tarefa_titulo':
      resumo += '\n\n📝 Criando nova tarefa (1/5: título)';
      resumo += '\n💡 Digite o nome da atividade a ser realizada';
      break;
      
    case 'criando_tarefa_unidades':
      resumo += '\n\n📝 Criando nova tarefa (2/5: unidades)';
      resumo += `\n🏷️ Tarefa: "${colaborador.tempTituloTarefa}"`;
      resumo += '\n💡 Defina onde a tarefa será executada';
      break;
      
    case 'criando_tarefa_fase':
      resumo += '\n\n📝 Criando nova tarefa (3/5: tipo de trabalho)';
      resumo += `\n🏷️ Tarefa: "${colaborador.tempTituloTarefa}"`;
      resumo += `\n🏠 Unidades: ${colaborador.tempUnidadesTarefa ? colaborador.tempUnidadesTarefa.length : 0}`;
      resumo += '\n💡 Escolha o tipo de trabalho a ser realizado';
      break;
      
    case 'criando_tarefa_prazo':
      resumo += '\n\n📝 Criando nova tarefa (4/5: prazo)';
      resumo += `\n🏷️ Tarefa: "${colaborador.tempTituloTarefa}" - ${colaborador.tempFaseTarefa}`;
      resumo += `\n🏠 Unidades: ${colaborador.tempUnidadesTarefa ? colaborador.tempUnidadesTarefa.length : 0}`;
      resumo += '\n💡 Defina quando a tarefa deve ser concluída';
      break;
      
    case 'criando_tarefa_confirmacao':
      resumo += '\n\n📝 Criando nova tarefa (5/5: confirmação)';
      resumo += `\n🏷️ Tarefa: "${colaborador.tempTituloTarefa}" - ${colaborador.tempFaseTarefa}`;
      resumo += `\n🏠 Unidades: ${colaborador.tempUnidadesTarefa ? colaborador.tempUnidadesTarefa.length : 0}`;
      resumo += `\n📅 Prazo: ${colaborador.tempPrazoTarefaFinal ? colaborador.tempPrazoTarefaFinal.toLocaleDateString('pt-PT') : 'Sem prazo'}`;
      resumo += '\n💡 Revise e confirme os dados antes da criação';
      break;
      
    case 'relatando_problema_descricao':
      resumo += '\n\n❗ Relatando problema (1/2: descrição)';
      resumo += '\n💡 Descreva detalhadamente o que está acontecendo';
      break;
      
    case 'relatando_problema_foto':
      resumo += '\n\n❗ Relatando problema (2/2: foto)';
      resumo += `\n📝 Problema: "${colaborador.tempDescricaoProblema ? colaborador.tempDescricaoProblema.substring(0, 30) + '...' : ''}"`;
      resumo += '\n💡 Envie uma foto do problema (ou digite "pular")';
      break;
      
    case 'vendo_problemas':
      const infoProblemas = await obterInfoProblemas(colaborador);
      resumo += `\n\n🔍 ${infoProblemas}`;
      break;
      
    case 'cadastrando_colab_nome':
      resumo += '\n\n👤 Cadastrando colaborador (1/4: nome)';
      resumo += '\n💡 Digite o nome completo da pessoa';
      break;
      
    case 'cadastrando_colab_telefone':
      resumo += '\n\n👤 Cadastrando colaborador (2/4: telefone)';
      resumo += `\n👤 Nome: "${colaborador.tempNovoNome}"`;
      resumo += '\n💡 Digite o telefone no formato 351XXXXXXXXX';
      break;
      
    case 'cadastrando_colab_tipo':
      resumo += '\n\n👤 Cadastrando colaborador (3/4: tipo)';
      resumo += `\n👤 Nome: "${colaborador.tempNovoNome}"`;
      resumo += `\n📱 Telefone: ${colaborador.tempNovoTelefone}`;
      resumo += '\n💡 Escolha se é colaborador ou encarregado';
      break;
      
    case 'cadastrando_colab_funcao':
      resumo += '\n\n👤 Cadastrando colaborador (4/4: função)';
      resumo += `\n👤 Nome: "${colaborador.tempNovoNome}"`;
      resumo += `\n🏷️ Tipo: ${colaborador.tempNovoTipo}`;
      resumo += '\n💡 Digite a função/especialidade da pessoa';
      break;
      
    case 'criando_obra_nome':
      resumo += '\n\n🏗️ Criando nova obra (1/3: nome)';
      resumo += '\n💡 Digite um nome identificativo para a obra';
      break;
      
    case 'criando_obra_endereco':
      resumo += '\n\n🏗️ Criando nova obra (2/3: endereço)';
      resumo += `\n🏷️ Obra: "${colaborador.tempNomeObra}"`;
      resumo += '\n💡 Digite o endereço completo da obra';
      break;
      
    case 'criando_obra_almoco_inicio':
    case 'criando_obra_almoco_hora_inicio':
    case 'criando_obra_almoco_hora_fim':
      resumo += '\n\n🏗️ Criando nova obra (3/3: horário de almoço)';
      resumo += `\n🏷️ Obra: "${colaborador.tempNomeObra}"`;
      resumo += `\n📍 Endereço: ${colaborador.tempEnderecoObra}`;
      resumo += '\n💡 Configure o horário de almoço da equipe';
      break;
      
    case 'entrando_obra_codigo':
      resumo += '\n\n🔑 Entrando em obra existente';
      resumo += '\n💡 Digite o código de 6 caracteres fornecido pelo responsável';
      break;
      
    case 'ver_colaboradores':
      const infoColaboradores = await obterInfoColaboradores(colaborador);
      resumo += `\n\n👥 ${infoColaboradores}`;
      break;
      
    case 'guia_startia':
      resumo += '\n\n📖 Consultando o guia do StartIA';
      resumo += '\n💡 Explore as funcionalidades e aprenda a usar o sistema';
      break;

    case 'coletando_nome':
      resumo += '\n\n👤 Configuração inicial';
      resumo += '\n💡 Precisamos saber seu nome para personalizar a experiência';
      break;
  }
  
  // Adicionar breadcrumb de navegação
  resumo += '\n\n' + gerarBreadcrumb(estadoAtual);
  
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

  return resumo;
}

/**
 * Obtém estatísticas rápidas para o menu
 */
async function obterEstatisticasRapidas(colaborador) {
  try {
    if (!colaborador.obras || colaborador.obras.length === 0) {
      return 'Entre em uma obra para ver suas estatísticas.';
    }

    const obraId = colaborador.subEstado || colaborador.obras[0];
    
    const [minhasTarefas, statusPresenca] = await Promise.all([
      Tarefa.countDocuments({
        atribuidaPara: colaborador._id,
        status: { $ne: 'concluida' }
      }),
      verificarStatusPresencaRapido(colaborador._id, obraId)
    ]);

    let stats = '';
    
    if (minhasTarefas > 0) {
      stats += `📝 ${minhasTarefas} tarefa${minhasTarefas > 1 ? 's' : ''} em andamento`;
    } else {
      stats += '📝 Nenhuma tarefa em andamento';
    }
    
    stats += ` | ${statusPresenca}`;
    
    return stats;
  } catch (error) {
    console.error(`❌ Erro ao obter estatísticas rápidas: ${error.message}`);
    return 'Estatísticas não disponíveis no momento.';
  }
}

/**
 * Obtém informações sobre tarefas
 */
async function obterInfoTarefas(colaborador) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    
    if (!obraId) {
      return 'Visualizando tarefas (entre em uma obra primeiro)';
    }

    const [minhasTarefas, tarefasDisponiveis] = await Promise.all([
      Tarefa.countDocuments({
        atribuidaPara: colaborador._id,
        status: { $ne: 'concluida' }
      }),
      Tarefa.countDocuments({
        obra: obraId,
        status: 'pendente',
        atribuidaPara: { $size: 0 }
      })
    ]);

    return `Suas tarefas: ${minhasTarefas} | Disponíveis no POOL: ${tarefasDisponiveis}`;
  } catch (error) {
    console.error(`❌ Erro ao obter info de tarefas: ${error.message}`);
    return 'Informações de tarefas não disponíveis.';
  }
}

/**
 * Obtém informações sobre problemas
 */
async function obterInfoProblemas(colaborador) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    
    if (!obraId) {
      return 'Visualizando problemas (entre em uma obra primeiro)';
    }

    const problemasAbertos = await Problema.countDocuments({
      obra: obraId,
      status: { $ne: 'resolvido' }
    });

    return `${problemasAbertos} problema${problemasAbertos !== 1 ? 's' : ''} em aberto na obra`;
  } catch (error) {
    console.error(`❌ Erro ao obter info de problemas: ${error.message}`);
    return 'Informações de problemas não disponíveis.';
  }
}

/**
 * Obtém informações sobre colaboradores
 */
async function obterInfoColaboradores(colaborador) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    
    if (!obraId) {
      return 'Visualizando equipe (entre em uma obra primeiro)';
    }

    const obra = await Obra.findById(obraId).populate('colaboradores', 'nome tipo');
    
    if (!obra) {
      return 'Obra não encontrada';
    }

    const totalColaboradores = obra.colaboradores.length;
    const encarregados = obra.colaboradores.filter(c => c.tipo === 'encarregado').length;

    return `Equipe da obra: ${totalColaboradores} pessoa${totalColaboradores !== 1 ? 's' : ''} (${encarregados} encarregado${encarregados !== 1 ? 's' : ''})`;
  } catch (error) {
    console.error(`❌ Erro ao obter info de colaboradores: ${error.message}`);
    return 'Informações da equipe não disponíveis.';
  }
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
    'criando_tarefa_unidades': 'Criando Tarefa > Unidades',
    'criando_tarefa_fase': 'Criando Tarefa > Tipo de Trabalho',
    'criando_tarefa_prazo': 'Criando Tarefa > Prazo',
    'criando_tarefa_confirmacao': 'Criando Tarefa > Confirmação',
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
    'coletando_nome': 'Configuração Inicial',
    'novo': 'Boas-vindas'
  };
  
  return `🔍 Você está em: ${estadosTexto[estado] || estado}`;
}

/**
 * Obtém estatísticas resumidas de uma obra
 */
async function obterEstatisticasObra(obraId) {
  try {
    // Obter data de hoje para filtrar presenças
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    // Buscas em paralelo para melhor performance
    const [colaboradoresAtivos, tarefasPendentes, problemasAbertos] = await Promise.all([
      // Colaboradores que registraram presença hoje e ainda estão na obra
      Presenca.countDocuments({
        obra: obraId,
        status: 'pendente',
        dataEntrada: { $gte: inicioHoje }
      }),
      
      // Tarefas pendentes da obra (disponíveis no POOL)
      Tarefa.countDocuments({
        obra: obraId,
        status: 'pendente',
        atribuidaPara: { $size: 0 }
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
      const horas = Math.round(status.horasPassadas * 10) / 10;
      return `Você está na obra há ${horas} horas`;
    } else if (status.status === 'concluido') {
      return `Expediente encerrado (${status.horasTrabalhadas} horas trabalhadas)`;
    } else {
      return 'Você ainda não registrou presença hoje';
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar status de presença: ${error.message}`);
    return 'Status de presença não disponível';
  }
}

/**
 * Verifica status de presença de forma rápida (para estatísticas)
 */
async function verificarStatusPresencaRapido(colaboradorId, obraId) {
  try {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const registroHoje = await Presenca.findOne({
      colaborador: colaboradorId,
      obra: obraId,
      dataEntrada: { $gte: inicioHoje }
    }).sort({ dataEntrada: -1 });
    
    if (!registroHoje) {
      return '⚪ Não registrou presença';
    }
    
    if (registroHoje.status === 'pendente') {
      return '🟢 Presente na obra';
    } else {
      return '🔴 Expediente encerrado';
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar presença rápido: ${error.message}`);
    return '❓ Status desconhecido';
  }
}

/**
 * Obtém obra ativa do colaborador
 */
async function obterObraAtiva(colaborador) {
  try {
    const obraId = colaborador.subEstado || (colaborador.obras && colaborador.obras[0]);
    
    if (!obraId) {
      return null;
    }
    
    const obra = await Obra.findById(obraId);
    return obra;
  } catch (error) {
    console.error(`❌ Erro ao obter obra ativa: ${error.message}`);
    return null;
  }
}

module.exports = { 
  gerarResumoContextual,
  gerarResumoBasico,
  gerarBreadcrumb,
  obterEstatisticasObra,
  verificarStatusPresenca,
  obterObraAtiva
};