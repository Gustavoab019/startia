const { criarObra } = require('../../../domains/obra/obra.service');
const Obra = require('../../../domains/obra/obra.model');

module.exports = async function estadoCriandoObra(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  if (colaborador.etapaCadastro === 'criando_obra_nome') {
    // Validar nome da obra
    if (!mensagem || mensagem.trim().length < 3) {
      resposta = `⚠️ O nome da obra deve ter pelo menos 3 caracteres.\n\nPor favor, digite o *nome da obra*:\n(Ex: "Residencial Vila Nova" ou "Reforma Apartamento 302")`;
      return { resposta, etapaNova };
    }
    
    colaborador.tempNomeObra = mensagem.trim();
    etapaNova = 'criando_obra_endereco';
    resposta = `📍 Agora informe o *endereço* da obra.`;
  }
  
  else if (colaborador.etapaCadastro === 'criando_obra_endereco') {
    // Validar endereço
    if (!mensagem || mensagem.trim().length < 5) {
      resposta = `⚠️ O endereço deve ter pelo menos 5 caracteres.\n\nPor favor, informe o *endereço* da obra:`;
      return { resposta, etapaNova };
    }
    
    colaborador.tempEnderecoObra = mensagem.trim();
    etapaNova = 'criando_obra_almoco_inicio';
    resposta = `⏰ Define o horário de almoço da obra?\n\n1. Sim\n2. Não (usar padrão: 12:00-13:00)`;
  }
  
  else if (colaborador.etapaCadastro === 'criando_obra_almoco_inicio') {
    // Verificar se quer definir horário personalizado ou usar o padrão
    if (mensagem === '2' || mensagem.toLowerCase() === 'não' || mensagem.toLowerCase() === 'nao') {
      // Usar horário padrão
      return finalizarCriacaoObra(colaborador, {
        horaInicioAlmoco: '12:00',
        horaFimAlmoco: '13:00'
      });
    }
    
    // Quer definir horário personalizado
    etapaNova = 'criando_obra_almoco_hora_inicio';
    resposta = `⏰ Informe o horário de *início* do almoço no formato HH:MM (ex: 12:00):`;
  }
  
  else if (colaborador.etapaCadastro === 'criando_obra_almoco_hora_inicio') {
    // Validar formato HH:MM
    if (!validarFormatoHora(mensagem)) {
      resposta = `⚠️ Formato inválido. Use o formato HH:MM (exemplo: 12:00).\n\nInforme o horário de *início* do almoço:`;
      return { resposta, etapaNova };
    }
    
    colaborador.tempHoraInicioAlmoco = mensagem;
    etapaNova = 'criando_obra_almoco_hora_fim';
    resposta = `⏰ Agora informe o horário de *término* do almoço no formato HH:MM (ex: 13:00):`;
  }
  
  else if (colaborador.etapaCadastro === 'criando_obra_almoco_hora_fim') {
    // Validar formato HH:MM
    if (!validarFormatoHora(mensagem)) {
      resposta = `⚠️ Formato inválido. Use o formato HH:MM (exemplo: 13:00).\n\nInforme o horário de *término* do almoço:`;
      return { resposta, etapaNova };
    }
    
    // Verificar se fim é depois do início
    const horaInicio = colaborador.tempHoraInicioAlmoco;
    const horaFim = mensagem;
    
    if (!validarHorarioAlmoco(horaInicio, horaFim)) {
      resposta = `⚠️ O horário de término deve ser depois do horário de início.\n\nInforme o horário de *término* do almoço:`;
      return { resposta, etapaNova };
    }
    
    // Finalizar criação com os horários definidos
    return finalizarCriacaoObra(colaborador, {
      horaInicioAlmoco: horaInicio,
      horaFimAlmoco: horaFim
    });
  }

  // Estado para confirmação de obra duplicata
  else if (colaborador.etapaCadastro === 'confirmando_obra_duplicata') {
    if (mensagem.toLowerCase() === 'sim' || mensagem === '1') {
      // Continuar com a criação forçada
      return finalizarCriacaoObraForcado(colaborador, {
        horaInicioAlmoco: colaborador.tempHoraInicioAlmoco || '12:00',
        horaFimAlmoco: colaborador.tempHoraFimAlmoco || '13:00'
      });
    } else {
      // Cancelar criação
      await limparDadosTemporarios(colaborador);
      
      return {
        resposta: `❌ Criação da obra cancelada.\n\nVoltando ao menu principal.\n\nDigite qualquer coisa para ver o menu.`,
        etapaNova: 'menu'
      };
    }
  }

  return { resposta, etapaNova };
};

// Função para validar formato de hora HH:MM
function validarFormatoHora(hora) {
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(hora);
}

// Função para validar que o fim é depois do início (simplificada)
function validarHorarioAlmoco(inicio, fim) {
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  
  const inicioMinutos = horaInicio * 60 + minInicio;
  const fimMinutos = horaFim * 60 + minFim;
  
  // Validação simples: fim deve ser maior que início (mesmo dia)
  if (fimMinutos > inicioMinutos) {
    return true;
  }
  
  // Permitir apenas casos específicos de horário noturno (ex: 23:00 - 00:30)
  // Máximo de 4 horas de diferença para evitar configurações estranhas
  if (fimMinutos < inicioMinutos && (24 * 60 - inicioMinutos + fimMinutos) <= 240) {
    return true;
  }
  
  return false;
}

// Função para limpar dados temporários
async function limparDadosTemporarios(colaborador) {
  colaborador.tempNomeObra = undefined;
  colaborador.tempEnderecoObra = undefined;
  colaborador.tempHoraInicioAlmoco = undefined;
  colaborador.tempHoraFimAlmoco = undefined;
  await colaborador.save();
}

// Função para finalizar a criação da obra com verificação de duplicata
async function finalizarCriacaoObra(colaborador, opcoesAlmoco) {
  try {
    const nome = colaborador.tempNomeObra;
    const endereco = colaborador.tempEnderecoObra;
    
    // Verificar se já existe obra similar para este responsável
    const obraExistente = await Obra.findOne({
      nome: { $regex: new RegExp(`^${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      responsavelId: colaborador._id
    });
    
    if (obraExistente) {
      // Salvar temporariamente as opções de almoço para usar na confirmação
      colaborador.tempHoraInicioAlmoco = opcoesAlmoco.horaInicioAlmoco;
      colaborador.tempHoraFimAlmoco = opcoesAlmoco.horaFimAlmoco;
      await colaborador.save();
      
      return {
        resposta: `⚠️ OBRA SIMILAR ENCONTRADA\n\nVocê já possui uma obra com nome similar:\n"${obraExistente.nome}"\n\nDeseja criar mesmo assim?\n\n1. Sim, criar nova obra\n2. Não, cancelar criação`,
        etapaNova: 'confirmando_obra_duplicata'
      };
    }

    return await criarObraFinal(colaborador, nome, endereco, opcoesAlmoco);

  } catch (error) {
    console.error('❌ Erro ao verificar obras existentes:', error);
    return await criarObraFinal(colaborador, colaborador.tempNomeObra, colaborador.tempEnderecoObra, opcoesAlmoco);
  }
}

// Função para finalizar criação forçada (ignorando duplicatas)
async function finalizarCriacaoObraForcado(colaborador, opcoesAlmoco) {
  const nome = colaborador.tempNomeObra;
  const endereco = colaborador.tempEnderecoObra;
  
  return await criarObraFinal(colaborador, nome, endereco, opcoesAlmoco);
}

// Função para criar a obra no banco de dados
async function criarObraFinal(colaborador, nome, endereco, opcoesAlmoco) {
  try {
    console.log('🏗️ Iniciando criação da obra:', { nome, endereco, opcoesAlmoco });

    const novaObra = await criarObra({
      nome,
      endereco,
      responsavel: colaborador.telefone,
      responsavelId: colaborador._id,
      horaInicioAlmoco: opcoesAlmoco.horaInicioAlmoco,
      horaFimAlmoco: opcoesAlmoco.horaFimAlmoco
    });

    console.log('✅ Obra criada no banco:', novaObra._id);

    // Garantir que o array de obras exista
    if (!colaborador.obras) {
      colaborador.obras = [];
    }

    // Adicionar a obra ao colaborador
    colaborador.obras.push(novaObra._id);
    colaborador.subEstado = novaObra._id; // Define a obra como ativa
    
    console.log('📝 Definindo obra como ativa para o colaborador:', novaObra._id);
    
    // ✅ CORREÇÃO PRINCIPAL: SALVAR O COLABORADOR ANTES DE CONTINUAR
    await colaborador.save();
    console.log('✅ Colaborador salvo com nova obra');
    
    // ✅ GARANTIR RELAÇÃO BIDIRECIONAL
    // Verificar se o colaborador já está na lista da obra
    if (!novaObra.colaboradores.some(colabId => colabId.toString() === colaborador._id.toString())) {
      novaObra.colaboradores.push(colaborador._id);
      await novaObra.save();
      console.log('✅ Colaborador adicionado à lista da obra');
    }
    
    // Limpar dados temporários
    await limparDadosTemporarios(colaborador);
    console.log('🧹 Dados temporários limpos');
    
    let resposta = `✅ OBRA CRIADA COM SUCESSO!\n\n`;
    resposta += `📄 *Nome:* ${nome}\n`;
    resposta += `📍 *Endereço:* ${endereco}\n`;
    resposta += `⏰ *Horário de almoço:* ${opcoesAlmoco.horaInicioAlmoco} - ${opcoesAlmoco.horaFimAlmoco}\n`;
    resposta += `🔑 *Código de acesso:* ${novaObra.codigoAcesso}\n\n`;
    resposta += `🎉 Agora você pode:\n`;
    resposta += `• Compartilhar o código com sua equipe\n`;
    resposta += `• Cadastrar colaboradores\n`;
    resposta += `• Registrar sua presença\n`;
    resposta += `• Criar tarefas\n\n`;
    resposta += `📋 Digite qualquer coisa para ver o menu da obra.`;
    
    return { 
      resposta, 
      etapaNova: 'em_obra'
    };

  } catch (error) {
    console.error('❌ Erro ao criar obra:', error);
    console.error('Stack de erro:', error.stack);
    
    // Limpar dados temporários em caso de erro
    try {
      await limparDadosTemporarios(colaborador);
    } catch (cleanupError) {
      console.error('❌ Erro ao limpar dados temporários:', cleanupError);
    }
    
    let resposta = `❌ ERRO AO CRIAR OBRA\n\n`;
    resposta += `Não foi possível criar a obra devido a um erro no sistema.\n\n`;
    resposta += `📞 Por favor:\n`;
    resposta += `• Tente novamente mais tarde\n`;
    resposta += `• Ou entre em contato com o suporte técnico\n\n`;
    resposta += `🔄 Retornando ao menu principal...`;
    
    return {
      resposta,
      etapaNova: 'menu'
    };
  }
}