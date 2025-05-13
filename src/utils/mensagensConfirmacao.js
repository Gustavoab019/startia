// src/utils/mensagensConfirmacao.js

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
    breadcrumb = null
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
      mensagem += `🔜 *O que fazer agora?*\n`;
      proximosPassos.forEach((passo, index) => {
        mensagem += `${index + 1}. ${passo}\n`;
      });
      mensagem += '\n';
    }
    
    // Adicionar breadcrumb se fornecido
    if (breadcrumb) {
      mensagem += `${breadcrumb}\n\n`;
    }
    
    return mensagem.trim();
  }
  
  /**
   * Templates pré-definidos de mensagens
   */
  const templates = {
    tarefaCriada: (tarefa, atribuido) => gerarConfirmacao({
      titulo: 'Tarefa criada com sucesso!',
      detalhes: {
        'Título': tarefa.titulo,
        'Descrição': tarefa.descricao || 'Não fornecida',
        'Prazo': tarefa.prazo ? tarefa.prazo.toLocaleDateString('pt-PT') : 'Sem prazo',
        'Atribuída para': atribuido
      },
      proximosPassos: [
        'Criar outra tarefa (digite "5")',
        'Ver todas as tarefas (digite "3")',
        'Voltar ao menu principal (digite "menu")'
      ]
    }),
    
    presencaRegistrada: (tipo, hora, duracao = null) => gerarConfirmacao({
      titulo: `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`,
      detalhes: tipo === 'entrada' ? 
        { 'Horário': hora } : 
        { 'Horário': hora, 'Horas trabalhadas': duracao },
      emoji: tipo === 'entrada' ? '🟢' : '🔴',
      proximosPassos: tipo === 'entrada' ? 
        ['Quando terminar, registre sua saída (digite "4")'] :
        ['Ver minhas tarefas (digite "3")', 'Relatar problema (digite "9")']
    }),
    
    problemaRelatado: (descricao, temFoto) => gerarConfirmacao({
      titulo: 'Problema relatado com sucesso!',
      detalhes: {
        'Descrição': descricao,
        'Foto anexada': temFoto ? 'Sim' : 'Não',
        'Status': 'Aberto'
      },
      emoji: '❗',
      proximosPassos: [
        'Ver todos os problemas (digite "10")',
        'Relatar outro problema (digite "9")',
        'Voltar ao menu principal (digite "menu")'
      ]
    }),
    
    colaboradorCadastrado: (nome, funcao, tipo) => gerarConfirmacao({
      titulo: 'Colaborador cadastrado com sucesso!',
      detalhes: {
        'Nome': nome,
        'Função': funcao,
        'Tipo': tipo === 'encarregado' ? 'Encarregado' : 'Colaborador'
      },
      emoji: '👤',
      proximosPassos: [
        'Cadastrar outro colaborador (digite "6")',
        'Ver equipe completa (digite "7")',
        'Voltar ao menu principal (digite "menu")'
      ]
    }),
    
    obraCriada: (obra) => gerarConfirmacao({
      titulo: 'Obra criada com sucesso!',
      detalhes: {
        'Nome': obra.nome,
        'Endereço': obra.endereco,
        'Horário de almoço': `${obra.horaInicioAlmoco} - ${obra.horaFimAlmoco}`,
        'Código de acesso': obra.codigoAcesso
      },
      emoji: '🏗️',
      proximosPassos: [
        'Cadastrar colaboradores (digite "6")',
        'Registrar presença (digite "4")',
        'Voltar ao menu principal (digite "menu")'
      ]
    }),
    
    obraAcessada: (obra) => gerarConfirmacao({
      titulo: 'Você entrou na obra com sucesso!',
      detalhes: {
        'Nome': obra.nome,
        'Endereço': obra.endereco
      },
      emoji: '🔑',
      proximosPassos: [
        'Registrar presença (digite "4")',
        'Ver tarefas (digite "3")',
        'Ver equipe (digite "7")'
      ]
    })
  };
  
  module.exports = {
    gerarConfirmacao,
    templates
  };