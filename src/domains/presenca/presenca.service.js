const Presenca = require('./presenca.model');
const Obra = require('../obra/obra.model');
const Colaborador = require('../colaborador/colaborador.model');
const mongoose = require('mongoose');

/**
 * Valida IDs de colaborador e obra
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @returns {Object} Resultado da validação
 */
function validarIds(colaboradorId, obraId) {
  const resultado = { valido: true, mensagem: null };
  
  if (!mongoose.Types.ObjectId.isValid(colaboradorId)) {
    resultado.valido = false;
    resultado.mensagem = 'ID de colaborador inválido';
  } else if (!mongoose.Types.ObjectId.isValid(obraId)) {
    resultado.valido = false;
    resultado.mensagem = 'ID de obra inválido';
  }
  
  return resultado;
}

/**
 * Formata data/hora para exibição
 * @param {Date} data - Data a ser formatada
 * @returns {String} Hora formatada
 */
function formatarHora(data) {
  if (!data) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Obtém limites do dia atual
 * @returns {Object} Objeto com início e fim do dia
 */
function obterLimitesDoDia() {
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
  
  return { inicioHoje, fimHoje };
}

/**
 * Registra entrada de colaborador na obra
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} Resultado da operação
 */
async function registrarEntrada(colaboradorId, obraId, options = {}) {
  try {
    // Validar IDs
    const validacao = validarIds(colaboradorId, obraId);
    if (!validacao.valido) {
      return { sucesso: false, mensagem: validacao.mensagem };
    }
    
    // Verificar se colaborador e obra existem
    const [colaborador, obra] = await Promise.all([
      Colaborador.findById(colaboradorId),
      Obra.findById(obraId)
    ]);
    
    if (!colaborador) {
      return { sucesso: false, mensagem: 'Colaborador não encontrado' };
    }
    
    if (!obra) {
      return { sucesso: false, mensagem: 'Obra não encontrada' };
    }
    
    // Verificar se colaborador está vinculado à obra
    const colaboradorPertenceObra = colaborador.obras && 
      colaborador.obras.some(obraCol => obraCol.toString() === obraId.toString());
    
    if (!colaboradorPertenceObra && !options.forceRegister) {
      // Vincular automaticamente se solicitado
      if (options.addToObra) {
        // Adicionar colaborador à obra
        if (!obra.colaboradores) obra.colaboradores = [];
        obra.colaboradores.push(colaboradorId);
        await obra.save();
        
        // Adicionar obra ao colaborador
        if (!colaborador.obras) colaborador.obras = [];
        colaborador.obras.push(obraId);
        await colaborador.save();
        
        console.log(`👷 Colaborador ${colaborador.nome || colaborador.telefone} adicionado à obra ${obra.nome}`);
      } else {
        return { sucesso: false, mensagem: 'Colaborador não está vinculado a esta obra' };
      }
    }
    
    // Verificar se já existe registro de entrada pendente
    const { inicioHoje, fimHoje } = obterLimitesDoDia();
    
    const registroPendente = await Presenca.findOne({
      colaborador: colaboradorId,
      obra: obraId,
      dataEntrada: { $gte: inicioHoje, $lte: fimHoje },
      status: 'pendente'
    });
    
    if (registroPendente) {
      return {
        sucesso: false,
        mensagem: 'Já existe um registro de entrada pendente para hoje',
        registro: registroPendente
      };
    }
    
    // Criar registro de entrada
    const presenca = new Presenca({
      colaborador: colaboradorId,
      obra: obraId,
      dataEntrada: new Date(),
      tipo: 'entrada',
      status: 'pendente',
      observacoes: options.observacoes || ''
    });
    
    await presenca.save();
    
    return {
      sucesso: true,
      mensagem: 'Entrada registrada com sucesso',
      registro: presenca,
      horaEntrada: formatarHora(presenca.dataEntrada)
    };
  } catch (error) {
    console.error('❌ Erro ao registrar entrada:', error);
    return { sucesso: false, mensagem: `Erro ao registrar entrada: ${error.message}` };
  }
}

/**
 * Calcula horas trabalhadas com validação de datas
 * @param {Date} entrada - Data/hora de entrada
 * @param {Date} saida - Data/hora de saída
 * @param {Object} configAlmoco - Configuração de almoço
 * @returns {Number} Horas trabalhadas
 */
function calcularHorasTrabalhadas(entrada, saida, configAlmoco) {
  if (!entrada || !saida) return 0;
  
  // Garantir que temos objetos Date
  const entradaDate = entrada instanceof Date ? entrada : new Date(entrada);
  const saidaDate = saida instanceof Date ? saida : new Date(saida);
  
  // Verificar datas válidas
  if (isNaN(entradaDate.getTime()) || isNaN(saidaDate.getTime())) {
    console.error('❌ Datas inválidas para cálculo de horas:', { entrada, saida });
    return 0;
  }
  
  // Calcular diferença em milissegundos
  const diferencaMs = saidaDate.getTime() - entradaDate.getTime();
  
  // Se saída for antes da entrada (erro), retornar 0
  if (diferencaMs <= 0) {
    console.error('❌ Saída antes da entrada:', { entrada, saida });
    return 0;
  }
  
  // Converter para horas
  let horas = diferencaMs / (1000 * 60 * 60);
  
  // Descontar almoço se configurado
  if (configAlmoco && configAlmoco.duracaoAlmocoMinutos > 0) {
    const descontoHoras = configAlmoco.duracaoAlmocoMinutos / 60;
    horas -= descontoHoras;
    
    // Garantir que não fique negativo
    if (horas < 0) horas = 0;
  }
  
  // Arredondar para duas casas decimais
  return Math.round(horas * 100) / 100;
}

/**
 * Verifica se deve descontar horário de almoço
 * @param {Date} entrada - Hora de entrada
 * @param {Date} saida - Hora de saída
 * @param {Object} obra - Objeto obra com configurações de almoço
 * @returns {Boolean} Indica se deve descontar almoço
 */
function verificarDescontoAlmoco(entrada, saida, obra) {
  // Se obra não existe ou não tem config de almoço, não desconta
  if (!obra || !obra.horaInicioAlmoco || !obra.horaFimAlmoco) {
    return false;
  }
  
  try {
    // Converter strings de hora para minutos do dia
    const [horaInicio, minInicio] = obra.horaInicioAlmoco.split(':').map(Number);
    const [horaFim, minFim] = obra.horaFimAlmoco.split(':').map(Number);
    
    if (isNaN(horaInicio) || isNaN(minInicio) || isNaN(horaFim) || isNaN(minFim)) {
      return false;
    }
    
    const inicioAlmocoMin = horaInicio * 60 + minInicio;
    const fimAlmocoMin = horaFim * 60 + minFim;
    
    // Garantir que temos objetos Date
    const entradaDate = entrada instanceof Date ? entrada : new Date(entrada);
    const saidaDate = saida instanceof Date ? saida : new Date(saida);
    
    // Verificar datas válidas
    if (isNaN(entradaDate.getTime()) || isNaN(saidaDate.getTime())) {
      return false;
    }
    
    // Extrair horas e minutos da entrada/saída
    const entradaEmMin = entradaDate.getHours() * 60 + entradaDate.getMinutes();
    const saidaEmMin = saidaDate.getHours() * 60 + saidaDate.getMinutes();
    
    // Verificar se período de trabalho engloba horário de almoço
    return (
      (entradaEmMin <= inicioAlmocoMin && saidaEmMin >= fimAlmocoMin) || // Caso 1: trabalho engloba almoço
      (entradaEmMin >= inicioAlmocoMin && entradaEmMin < fimAlmocoMin) || // Caso 2: entrada durante almoço
      (saidaEmMin > inicioAlmocoMin && saidaEmMin <= fimAlmocoMin) // Caso 3: saída durante almoço
    );
  } catch (error) {
    console.error('❌ Erro ao verificar desconto de almoço:', error);
    return false;
  }
}

/**
 * Registra saída de colaborador na obra
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} Resultado da operação
 */
async function registrarSaida(colaboradorId, obraId, options = {}) {
  try {
    // Validar IDs
    const validacao = validarIds(colaboradorId, obraId);
    if (!validacao.valido) {
      return { sucesso: false, mensagem: validacao.mensagem };
    }
    
    // Buscar registro de entrada pendente
    const { inicioHoje, fimHoje } = obterLimitesDoDia();
    
    const registroPendente = await Presenca.findOne({
      colaborador: colaboradorId,
      obra: obraId,
      dataEntrada: { $gte: inicioHoje, $lte: fimHoje },
      status: 'pendente'
    });
    
    if (!registroPendente) {
      return { sucesso: false, mensagem: 'Não há registro de entrada pendente para hoje' };
    }
    
    // Buscar configuração de almoço da obra
    const obra = await Obra.findById(obraId, 'horaInicioAlmoco horaFimAlmoco duracaoAlmocoMinutos');
    
    // Atualizar registro com saída
    const horaSaida = new Date();
    registroPendente.dataSaida = horaSaida;
    registroPendente.tipo = 'saida';
    registroPendente.status = 'completo';
    
    // Verificar se deve descontar almoço
    const deveDescontarAlmoco = verificarDescontoAlmoco(
      registroPendente.dataEntrada, 
      horaSaida,
      obra
    );
    
    registroPendente.descontoAlmoco = deveDescontarAlmoco;
    
    // Calcular horas trabalhadas
    const configAlmoco = deveDescontarAlmoco ? {
      duracaoAlmocoMinutos: obra?.duracaoAlmocoMinutos || 60
    } : null;
    
    registroPendente.horasTrabalhadas = calcularHorasTrabalhadas(
      registroPendente.dataEntrada,
      horaSaida,
      configAlmoco
    );
    
    if (options.observacoes) {
      registroPendente.observacoes += options.observacoes;
    }
    
    await registroPendente.save();
    
    return {
      sucesso: true,
      mensagem: 'Saída registrada com sucesso',
      registro: registroPendente,
      horaEntrada: formatarHora(registroPendente.dataEntrada),
      horaSaida: formatarHora(registroPendente.dataSaida),
      horasTrabalhadas: registroPendente.horasTrabalhadas,
      descontoAlmoco: deveDescontarAlmoco,
      descontoTexto: deveDescontarAlmoco ? 
        `(com desconto de ${obra?.duracaoAlmocoMinutos || 60} min de almoço)` : ''
    };
  } catch (error) {
    console.error('❌ Erro ao registrar saída:', error);
    return { sucesso: false, mensagem: `Erro ao registrar saída: ${error.message}` };
  }
}

/**
 * Verifica status de presença do colaborador na obra hoje
 * @param {String} colaboradorId - ID do colaborador
 * @param {String} obraId - ID da obra
 * @returns {Promise<Object>} Status da presença
 */
async function verificarStatusPresenca(colaboradorId, obraId) {
  // Validar IDs
  const validacao = validarIds(colaboradorId, obraId);
  if (!validacao.valido) {
    return {
      presente: false,
      status: 'erro',
      mensagem: validacao.mensagem
    };
  }
  
  try {
    // Buscar registros de hoje
    const { inicioHoje, fimHoje } = obterLimitesDoDia();
    
    const registrosHoje = await Presenca.find({
      colaborador: colaboradorId,
      obra: obraId,
      dataEntrada: { $gte: inicioHoje, $lte: fimHoje }
    }).sort({ dataEntrada: -1 });
    
    if (registrosHoje.length === 0) {
      return {
        presente: false,
        status: 'ausente',
        mensagem: 'Colaborador não registrou presença hoje'
      };
    }
    
    const ultimoRegistro = registrosHoje[0];
    
    if (ultimoRegistro.status === 'pendente') {
      const horaEntrada = ultimoRegistro.dataEntrada;
      const agora = new Date();
      const horasPassadas = (agora - horaEntrada) / (1000 * 60 * 60);
      
      return {
        presente: true,
        status: 'trabalhando',
        registroId: ultimoRegistro._id,
        horaEntrada: horaEntrada,
        horaEntradaFormatada: formatarHora(horaEntrada),
        horasPassadas: Math.round(horasPassadas * 100) / 100,
        mensagem: 'Colaborador está na obra'
      };
    } else {
      return {
        presente: true,
        status: 'concluido',
        registroId: ultimoRegistro._id,
        horaEntrada: ultimoRegistro.dataEntrada,
        horaEntradaFormatada: formatarHora(ultimoRegistro.dataEntrada),
        horaSaida: ultimoRegistro.dataSaida,
        horaSaidaFormatada: formatarHora(ultimoRegistro.dataSaida),
        horasTrabalhadas: ultimoRegistro.horasTrabalhadas,
        mensagem: 'Colaborador já encerrou o expediente hoje'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status de presença:', error);
    return {
      presente: false,
      status: 'erro',
      mensagem: 'Erro ao verificar presença'
    };
  }
}

/**
 * Busca histórico de presenças por colaborador
 * @param {String} colaboradorId - ID do colaborador
 * @param {Object} options - Opções de filtro (data inicial, final, etc)
 * @returns {Promise<Array>} Lista de presenças
 */
async function buscarHistoricoColaborador(colaboradorId, options = {}) {
  try {
    // Validar ID do colaborador
    if (!mongoose.Types.ObjectId.isValid(colaboradorId)) {
      throw new Error('ID de colaborador inválido');
    }
    
    const filtro = { colaborador: colaboradorId };
    
    // Aplicar filtros de data se fornecidos
    if (options.dataInicial || options.dataFinal) {
      filtro.dataEntrada = {};
      
      if (options.dataInicial) {
        filtro.dataEntrada.$gte = new Date(options.dataInicial);
      }
      
      if (options.dataFinal) {
        const dataFim = new Date(options.dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        filtro.dataEntrada.$lte = dataFim;
      }
    }
    
    // Aplicar filtro de obra se fornecido
    if (options.obraId && mongoose.Types.ObjectId.isValid(options.obraId)) {
      filtro.obra = options.obraId;
    }
    
    const presencas = await Presenca.find(filtro)
      .populate('obra', 'nome')
      .sort({ dataEntrada: -1 });
    
    return { sucesso: true, presencas };
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de presença:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

/**
 * Limpa registros de presença duplicados do mesmo dia
 * @param {String} colaboradorId - ID do colaborador (opcional)
 * @param {String} obraId - ID da obra (opcional)
 * @returns {Promise<Object>} Resultado da operação
 */
async function limparRegistrosDuplicados(colaboradorId = null, obraId = null) {
  try {
    // Definir filtro base
    const filtro = { status: 'pendente' };
    
    // Adicionar colaborador e obra se fornecidos e válidos
    if (colaboradorId && mongoose.Types.ObjectId.isValid(colaboradorId)) {
      filtro.colaborador = colaboradorId;
    }
    
    if (obraId && mongoose.Types.ObjectId.isValid(obraId)) {
      filtro.obra = obraId;
    }
    
    // Buscar todos os registros pendentes
    const registros = await Presenca.find(filtro).sort({ dataEntrada: 1 });
    
    // Agrupar por colaborador e obra
    const grupos = {};
    const idsParaRemover = [];
    
    registros.forEach(registro => {
      const chave = `${registro.colaborador.toString()}-${registro.obra.toString()}`;
      
      if (!grupos[chave]) {
        // Primeiro registro deste colaborador/obra
        grupos[chave] = registro;
      } else {
        // Registro duplicado, marcar para remoção
        idsParaRemover.push(registro._id);
      }
    });
    
    // Remover registros duplicados
    if (idsParaRemover.length > 0) {
      const resultado = await Presenca.deleteMany({ _id: { $in: idsParaRemover } });
      
      return {
        sucesso: true,
        removidos: resultado.deletedCount,
        mensagem: `${resultado.deletedCount} registros duplicados removidos`
      };
    } else {
      return {
        sucesso: true,
        removidos: 0,
        mensagem: 'Nenhum registro duplicado encontrado'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao limpar registros duplicados:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

// Exporta as funções
module.exports = {
  registrarEntrada,
  registrarSaida,
  verificarStatusPresenca,
  buscarHistoricoColaborador,
  limparRegistrosDuplicados
};