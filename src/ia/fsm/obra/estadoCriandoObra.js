const { criarObra } = require('../../../domains/obra/obra.service');

module.exports = async function estadoCriandoObra(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  if (colaborador.etapaCadastro === 'criando_obra_nome') {
    colaborador.tempNomeObra = mensagem;
    etapaNova = 'criando_obra_endereco';
    resposta = `📍 Agora informe o *endereço* da obra.`;
  }
  
  else if (colaborador.etapaCadastro === 'criando_obra_endereco') {
    colaborador.tempEnderecoObra = mensagem;
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

  return { resposta, etapaNova };
};

// Função para validar formato de hora HH:MM
function validarFormatoHora(hora) {
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(hora);
}

// Função para validar que o fim é depois do início
function validarHorarioAlmoco(inicio, fim) {
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  
  const inicioMinutos = horaInicio * 60 + minInicio;
  const fimMinutos = horaFim * 60 + minFim;
  
  // Permitir horários que cruzam a meia-noite (ex: início 23:00, fim 00:30)
  if (fimMinutos > inicioMinutos) {
    return true;
  }
  
  // Se for trabalho noturno e o almoço cruzar a meia-noite
  // Por exemplo, início 23:00, fim 00:30
  if (fimMinutos < inicioMinutos && (24 * 60 - inicioMinutos + fimMinutos) <= 240) {
    return true;
  }
  
  return false;
}

// Função para finalizar a criação da obra
async function finalizarCriacaoObra(colaborador, opcoesAlmoco) {
  try {
    const nome = colaborador.tempNomeObra;
    const endereco = colaborador.tempEnderecoObra;
    
    const novaObra = await criarObra({
      nome,
      endereco,
      responsavel: colaborador.telefone,
      responsavelId: colaborador._id,
      horaInicioAlmoco: opcoesAlmoco.horaInicioAlmoco,
      horaFimAlmoco: opcoesAlmoco.horaFimAlmoco
    });

    // Garantir que o array de obras exista
    if (!colaborador.obras) {
      colaborador.obras = [];
    }

    colaborador.obras.push(novaObra._id);
    colaborador.subEstado = novaObra._id; // Define a obra como ativa
    
    // Limpar dados temporários
    colaborador.tempNomeObra = undefined;
    colaborador.tempEnderecoObra = undefined;
    colaborador.tempHoraInicioAlmoco = undefined;
    colaborador.tempHoraFimAlmoco = undefined;
    
    let resposta = `✅ Obra criada com sucesso!\n\n`;
    resposta += `📄 Nome: ${nome}\n`;
    resposta += `📍 Endereço: ${endereco}\n`;
    resposta += `⏰ Horário de almoço: ${opcoesAlmoco.horaInicioAlmoco} - ${opcoesAlmoco.horaFimAlmoco}\n`;
    resposta += `🔑 Código de acesso: ${novaObra.codigoAcesso}`;
    
    return { 
      resposta, 
      etapaNova: 'em_obra'
    };
  } catch (error) {
    console.error('❌ Erro ao criar obra:', error);
    
    // Mensagem de erro mais amigável para o usuário
    let resposta = `❌ Não foi possível criar a obra. Ocorreu um erro no sistema.\n\n`;
    resposta += `Por favor, tente novamente mais tarde ou entre em contato com o suporte.`;
    
    return {
      resposta,
      etapaNova: 'menu'
    };
  }
}