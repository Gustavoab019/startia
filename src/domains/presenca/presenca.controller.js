const express = require('express');
const router = express.Router();
const Presenca = require('./presenca.model');
const {
  registrarEntrada,
  registrarSaida,
  verificarStatusPresenca,
  buscarHistoricoColaborador
} = require('./presenca.service');

// 📝 Registrar entrada de colaborador na obra
router.post('/entrada', async (req, res) => {
  try {
    const { colaboradorId, obraId, observacoes } = req.body;

    if (!colaboradorId || !obraId) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Colaborador e obra são campos obrigatórios' 
      });
    }

    const resultado = await registrarEntrada(colaboradorId, obraId, { observacoes });
    
    if (!resultado.sucesso) {
      return res.status(400).json(resultado);
    }
    
    res.status(201).json(resultado);
  } catch (err) {
    console.error('❌ Erro ao registrar entrada:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao registrar entrada' 
    });
  }
});

// 📝 Registrar saída de colaborador da obra
router.post('/saida', async (req, res) => {
  try {
    const { colaboradorId, obraId, observacoes } = req.body;

    if (!colaboradorId || !obraId) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Colaborador e obra são campos obrigatórios' 
      });
    }

    const resultado = await registrarSaida(colaboradorId, obraId, { observacoes });
    
    if (!resultado.sucesso) {
      return res.status(400).json(resultado);
    }
    
    res.status(200).json(resultado);
  } catch (err) {
    console.error('❌ Erro ao registrar saída:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao registrar saída' 
    });
  }
});

// 📊 Verificar status de presença atual
router.get('/status/:colaboradorId/:obraId', async (req, res) => {
  try {
    const { colaboradorId, obraId } = req.params;
    const status = await verificarStatusPresenca(colaboradorId, obraId);
    
    if (status.status === 'erro') {
      return res.status(400).json(status);
    }
    
    res.json(status);
  } catch (err) {
    console.error('❌ Erro ao verificar status de presença:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao verificar status de presença' 
    });
  }
});

// 📅 Listar presenças por colaborador
router.get('/colaborador/:id', async (req, res) => {
  try {
    const { dataInicial, dataFinal, obraId } = req.query;
    const resultado = await buscarHistoricoColaborador(req.params.id, {
      dataInicial,
      dataFinal,
      obraId
    });
    
    if (!resultado.sucesso) {
      return res.status(400).json(resultado);
    }
    
    res.json(resultado.presencas || []);
  } catch (err) {
    console.error('❌ Erro ao buscar presenças do colaborador:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao buscar presenças do colaborador' 
    });
  }
});

// 🏗️ Listar presenças por obra
router.get('/obra/:id', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;
    
    // Validar ID da obra
    if (!req.params.id || !require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de obra inválido'
      });
    }
    
    // Construir filtro
    const filtro = { obra: req.params.id };
    
    if (dataInicial || dataFinal) {
      filtro.dataEntrada = {};
      
      if (dataInicial) {
        filtro.dataEntrada.$gte = new Date(dataInicial);
      }
      
      if (dataFinal) {
        const dataFim = new Date(dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        filtro.dataEntrada.$lte = dataFim;
      }
    }
    
    const presencas = await Presenca.find(filtro)
      .populate('colaborador', 'nome telefone tipo funcao')
      .sort({ dataEntrada: -1 });
      
    res.json({
      sucesso: true,
      presencas
    });
  } catch (err) {
    console.error('❌ Erro ao buscar presenças da obra:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao buscar presenças da obra' 
    });
  }
});

// 📊 Resumo de presença por obra (dia atual)
router.get('/resumo/obra/:id/hoje', async (req, res) => {
  try {
    const obraId = req.params.id;
    
    // Validar ID da obra
    if (!obraId || !require('mongoose').Types.ObjectId.isValid(obraId)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de obra inválido'
      });
    }
    
    // Definir data de hoje
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    
    // Buscar todas as presenças de hoje na obra
    const presencasHoje = await Presenca.find({
      obra: obraId,
      dataEntrada: { $gte: inicioHoje, $lte: fimHoje }
    }).populate('colaborador', 'nome tipo funcao');
    
    // Calcular estatísticas
    const totalPresentes = presencasHoje.length;
    const presentesAgora = presencasHoje.filter(p => p.status === 'pendente').length;
    const jaEncerrados = presencasHoje.filter(p => p.status === 'completo').length;
    
    // Listar colaboradores presentes agora
    const presentesDetalhes = presencasHoje
      .filter(p => p.status === 'pendente')
      .map(p => ({
        id: p.colaborador._id,
        nome: p.colaborador.nome,
        funcao: p.colaborador.funcao,
        tipo: p.colaborador.tipo,
        horaEntrada: p.dataEntrada,
        horaEntradaFormatada: p.dataEntrada.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    
    res.json({
      sucesso: true,
      data: hoje,
      totalPresentes,
      presentesAgora,
      jaEncerrados,
      presentesDetalhes
    });
  } catch (err) {
    console.error('❌ Erro ao gerar resumo de presença:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao gerar resumo de presença' 
    });
  }
});

// 📆 Resumo de presença por período
router.get('/resumo/obra/:id/periodo', async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;
    const obraId = req.params.id;
    
    // Validações
    if (!obraId || !require('mongoose').Types.ObjectId.isValid(obraId)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de obra inválido'
      });
    }
    
    if (!dataInicial || !dataFinal) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Datas inicial e final são obrigatórias' 
      });
    }
    
    // Converter para datas
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    fim.setHours(23, 59, 59, 999);
    
    // Buscar presenças no período
    const presencas = await Presenca.find({
      obra: obraId,
      dataEntrada: { $gte: inicio, $lte: fim },
      status: 'completo' // Apenas registros completos para estatísticas
    }).populate('colaborador', 'nome tipo funcao');
    
    // Agrupar por colaborador
    const porColaborador = {};
    
    presencas.forEach(p => {
      const colabId = p.colaborador._id.toString();
      
      if (!porColaborador[colabId]) {
        porColaborador[colabId] = {
          id: colabId,
          nome: p.colaborador.nome,
          funcao: p.colaborador.funcao,
          tipo: p.colaborador.tipo,
          diasTrabalhados: new Set(),
          horasTotais: 0,
          presencas: []
        };
      }
      
      // Adicionar dia às estatísticas
      const data = p.dataEntrada.toISOString().split('T')[0];
      porColaborador[colabId].diasTrabalhados.add(data);
      
      // Adicionar horas
      porColaborador[colabId].horasTotais += p.horasTrabalhadas;
      
      // Adicionar presença
      porColaborador[colabId].presencas.push({
        data,
        entrada: p.dataEntrada,
        saida: p.dataSaida,
        horas: p.horasTrabalhadas
      });
    });
    
    // Converter para array e finalizar estatísticas
    const colaboradores = Object.values(porColaborador).map(c => ({
      ...c,
      diasTrabalhados: Array.from(c.diasTrabalhados),
      totalDias: c.diasTrabalhados.size,
      horasTotais: Math.round(c.horasTotais * 100) / 100
    }));
    
    // Calcular estatísticas gerais
    const totalHoras = colaboradores.reduce((sum, c) => sum + c.horasTotais, 0);
    const totalDias = new Set(
      colaboradores.flatMap(c => c.diasTrabalhados)
    ).size;
    
    res.json({
      sucesso: true,
      periodo: {
        inicio: dataInicial,
        fim: dataFinal,
        totalDias
      },
      estatisticas: {
        totalColaboradores: colaboradores.length,
        totalHoras: Math.round(totalHoras * 100) / 100,
        mediaHorasPorDia: totalDias ? Math.round((totalHoras / totalDias) * 100) / 100 : 0
      },
      colaboradores
    });
  } catch (err) {
    console.error('❌ Erro ao gerar resumo de período:', err);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao gerar resumo de período' 
    });
  }
});

module.exports = router;