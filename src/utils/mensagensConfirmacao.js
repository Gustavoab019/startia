// src/utils/mensagensConfirmacao.js - VERSÃO MELHORADA

/**
 * Gera mensagem de confirmação formatada
 * @param {Object} opcoes - Opções da mensagem
 * @returns {String} Mensagem formatada
 */
function gerarConfirmacao({ 
  titulo, 
  detalhes = {}, 
  proximosPassos = [],
  emoji = '✅',
  breadcrumb = null,
  rodape = null
}) {
  let mensagem = `${emoji} *${titulo}*\n\n`;
  
  // Adicionar detalhes se houver
  if (Object.keys(detalhes).length > 0) {
    mensagem += `📋 *Detalhes:*\n`;
    
    for (const [chave, valor] of Object.entries(detalhes)) {
      mensagem += `${chave}: ${valor}\n`;
    }
    
    mensagem += '\n';
  }
  
  // Adicionar próximos passos se fornecidos
  if (proximosPassos.length > 0) {
    mensagem += `🎯 *Próximos passos:*\n`;
    proximosPassos.forEach((passo, index) => {
      mensagem += `${index + 1}️⃣ ${passo}\n`;
    });
    mensagem += '\n';
  }
  
  // Adicionar breadcrumb se fornecido
  if (breadcrumb) {
    mensagem += `${breadcrumb}\n\n`;
  }
  
  // Adicionar rodapé se fornecido
  if (rodape) {
    mensagem += `💡 ${rodape}\n`;
  }
  
  return mensagem.trim();
}

/**
 * Templates pré-definidos de mensagens melhorados
 */
const templates = {
  // ✅ NOVO: Template para preview de tarefas
  previewTarefas: (dadosTarefas) => {
    const { titulo, fase, unidades, prazo, estimativaTotal } = dadosTarefas;
    
    return gerarConfirmacao({
      titulo: 'Preview das tarefas a serem criadas',
      detalhes: {
        '🏷️ Tipo': `${titulo} - ${fase}`,
        '🏠 Quantidade': `${unidades.length} unidade${unidades.length > 1 ? 's' : ''}`,
        '📅 Prazo': prazo ? prazo : 'Sem prazo definido',
        '⏱️ Estimativa': estimativaTotal ? `${estimativaTotal} minutos total` : 'Não calculada'
      },
      proximosPassos: [
        'Confirmar criação (digite "1")',
        'Editar informações (digite "2")',
        'Cancelar operação (digite "0")'
      ],
      emoji: '📋'
    });
  },

  // ✅ MELHORADO: Template para tarefa criada
  tarefaCriada: (dadosTarefas) => {
    const { quantidade, titulo, fase, distribuicao, estimativaTotal } = dadosTarefas;
    
    let detalhes = {
      '🏷️ Tipo': `${titulo} - ${fase}`,
      '📊 Quantidade': `${quantidade} tarefa${quantidade > 1 ? 's' : ''} criada${quantidade > 1 ? 's' : ''}`,
      '🎯 Status': 'Disponível no POOL para qualquer colaborador'
    };
    
    if (distribuicao) {
      detalhes['🏢 Distribuição'] = distribuicao;
    }
    
    if (estimativaTotal) {
      detalhes['⏱️ Tempo estimado'] = `${estimativaTotal} horas total`;
    }
    
    return gerarConfirmacao({
      titulo: 'Tarefas criadas com sucesso!',
      detalhes,
      proximosPassos: [
        'Ver todas as tarefas (digite "3")',
        'Criar mais tarefas (digite "5")',
        'Registrar presença e começar (digite "4")',
        'Voltar ao menu (digite "menu")'
      ],
      emoji: '🎉',
      rodape: 'As tarefas estão no POOL - qualquer colaborador pode pegá-las!'
    });
  },
  
  // ✅ MELHORADO: Template para presença registrada
  presencaRegistrada: (tipo, hora, dadosExtra = {}) => {
    const { duracao, descontoAlmoco, nomeObra } = dadosExtra;
    
    let detalhes = {
      '⏰ Horário': hora
    };
    
    if (nomeObra) {
      detalhes['🏗️ Obra'] = nomeObra;
    }
    
    if (tipo === 'saida' && duracao) {
      detalhes['⏱️ Horas trabalhadas'] = duracao;
      if (descontoAlmoco) {
        detalhes['🍽️ Desconto almoço'] = 'Aplicado automaticamente';
      }
    }
    
    const proximosPassos = tipo === 'entrada' ? 
      [
        'Registrar saída quando terminar (digite "4")',
        'Ver suas tarefas (digite "3")',
        'Relatar problema se necessário (digite "9")'
      ] :
      [
        'Ver resumo do dia (digite "status")',
        'Ver suas tarefas de amanhã (digite "3")',
        'Voltar ao menu (digite "menu")'
      ];
    
    return gerarConfirmacao({
      titulo: `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`,
      detalhes,
      proximosPassos,
      emoji: tipo === 'entrada' ? '🟢' : '🔴',
      rodape: tipo === 'entrada' ? 
        'Bom trabalho! Lembre-se de registrar sua saída.' : 
        'Obrigado pelo trabalho de hoje! Descanse bem.'
    });
  },
  
  // ✅ MELHORADO: Template para problema relatado
  problemaRelatado: (dadosProblema) => {
    const { descricao, temFoto, nomeObra, urgencia } = dadosProblema;
    
    return gerarConfirmacao({
      titulo: 'Problema relatado com sucesso!',
      detalhes: {
        '📝 Descrição': descricao.length > 50 ? `${descricao.substring(0, 50)}...` : descricao,
        '📸 Foto anexada': temFoto ? 'Sim' : 'Não',
        '🏗️ Obra': nomeObra || 'Obra atual',
        '⚠️ Urgência': urgencia || 'Normal',
        '📊 Status': 'Aberto (aguardando análise)'
      },
      proximosPassos: [
        'Ver todos os problemas (digite "10")',
        'Relatar outro problema (digite "9")',
        'Continuar trabalhando (digite "3")',
        'Voltar ao menu (digite "menu")'
      ],
      emoji: '❗',
      rodape: 'O responsável pela obra foi notificado automaticamente.'
    });
  },
  
  // ✅ MELHORADO: Template para colaborador cadastrado
  colaboradorCadastrado: (dadosColaborador) => {
    const { nome, funcao, tipo, telefone, nomeObra } = dadosColaborador;
    
    return gerarConfirmacao({
      titulo: 'Colaborador cadastrado com sucesso!',
      detalhes: {
        '👤 Nome': nome,
        '💼 Função': funcao,
        '🏷️ Tipo': tipo === 'encarregado' ? 'Encarregado' : 'Colaborador',
        '📱 Telefone': telefone,
        '🏗️ Obra': nomeObra || 'Obra atual'
      },
      proximosPassos: [
        'Cadastrar outro colaborador (digite "6")',
        'Ver equipe completa (digite "7")',
        'Criar tarefas para a equipe (digite "5")',
        'Voltar ao menu (digite "menu")'
      ],
      emoji: '👤',
      rodape: 'O colaborador já pode acessar o sistema via WhatsApp!'
    });
  },
  
  // ✅ MELHORADO: Template para obra criada
  obraCriada: (dadosObra) => {
    const { nome, endereco, horaInicioAlmoco, horaFimAlmoco, codigoAcesso, responsavel } = dadosObra;
    
    return gerarConfirmacao({
      titulo: 'Obra criada com sucesso!',
      detalhes: {
        '🏗️ Nome': nome,
        '📍 Endereço': endereco,
        '👤 Responsável': responsavel,
        '🍽️ Horário de almoço': `${horaInicioAlmoco} às ${horaFimAlmoco}`,
        '🔑 Código de acesso': `*${codigoAcesso}*`
      },
      proximosPassos: [
        'Cadastrar colaboradores (digite "6")',
        'Criar primeiras tarefas (digite "5")',
        'Registrar sua presença (digite "4")',
        'Compartilhar código com a equipe'
      ],
      emoji: '🏗️',
      rodape: `Compartilhe o código "${codigoAcesso}" com sua equipe para eles entrarem na obra!`
    });
  },
  
  // ✅ MELHORADO: Template para obra acessada
  obraAcessada: (dadosObra) => {
    const { nome, endereco, responsavel, totalColaboradores, tarefasPendentes } = dadosObra;
    
    let detalhes = {
      '🏗️ Nome': nome,
      '📍 Endereço': endereco
    };
    
    if (responsavel) {
      detalhes['👤 Responsável'] = responsavel;
    }
    
    if (totalColaboradores) {
      detalhes['👥 Equipe'] = `${totalColaboradores} colaborador${totalColaboradores > 1 ? 'es' : ''}`;
    }
    
    if (tarefasPendentes !== undefined) {
      detalhes['📋 Tarefas pendentes'] = `${tarefasPendentes} tarefa${tarefasPendentes !== 1 ? 's' : ''}`;
    }
    
    return gerarConfirmacao({
      titulo: 'Acesso à obra realizado com sucesso!',
      detalhes,
      proximosPassos: [
        'Registrar presença (digite "4")',
        'Ver tarefas disponíveis (digite "3")',
        'Ver equipe da obra (digite "7")',
        'Explorar funcionalidades (digite "8")'
      ],
      emoji: '🔑',
      rodape: 'Bem-vindo à obra! Você já pode começar a trabalhar.'
    });
  },

  // ✅ NOVO: Template para erro com orientação
  erroComOrientacao: (tipoErro, mensagemErro, acoesSugeridas = []) => {
    const emojiErro = {
      'validacao': '⚠️',
      'sistema': '❌',
      'rede': '📶',
      'permissao': '🔒'
    };
    
    const acoesDefault = [
      'Tente novamente',
      'Digite "ajuda" para ver comandos',
      'Digite "menu" para voltar ao menu'
    ];
    
    return gerarConfirmacao({
      titulo: 'Ops! Algo deu errado',
      detalhes: {
        '❌ Erro': mensagemErro,
        '🔍 Tipo': tipoErro
      },
      proximosPassos: acoesSugeridas.length > 0 ? acoesSugeridas : acoesDefault,
      emoji: emojiErro[tipoErro] || '❌',
      rodape: 'Se o problema persistir, entre em contato com o suporte.'
    });
  },

  // ✅ NOVO: Template para status de progresso
  progressoAtividade: (dadosProgresso) => {
    const { atividade, etapaAtual, totalEtapas, percentual, proximaEtapa } = dadosProgresso;
    
    // Barra de progresso visual
    const barraCheia = Math.floor(percentual / 10);
    const barraVazia = 10 - barraCheia;
    const barraProgresso = '█'.repeat(barraCheia) + '░'.repeat(barraVazia);
    
    return gerarConfirmacao({
      titulo: `Progresso: ${atividade}`,
      detalhes: {
        '📊 Progresso': `${barraProgresso} ${percentual}%`,
        '🎯 Etapa atual': `${etapaAtual} de ${totalEtapas}`,
        '▶️ Próxima etapa': proximaEtapa || 'Finalização'
      },
      emoji: '📈',
      rodape: 'Continue seguindo as instruções para completar a atividade.'
    });
  }
};

module.exports = {
  gerarConfirmacao,
  templates
};