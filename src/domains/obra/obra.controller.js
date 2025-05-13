const { criarObra, obterObraAtiva, vincularColaboradorObra } = require('./obra.service');
const Obra = require('./obra.model');

/**
 * Controller para criação de uma nova obra
 */
async function criarObraController(req, res) {
  try {
    const { 
      nome, 
      endereco, 
      responsavel,
      responsavelId, 
      horaInicioAlmoco,
      horaFimAlmoco 
    } = req.body;

    if (!nome || !endereco || !responsavel) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, endereco, responsavel' });
    }

    // Validar horários de almoço se fornecidos
    if (horaInicioAlmoco || horaFimAlmoco) {
      const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      
      if (horaInicioAlmoco && !regex.test(horaInicioAlmoco)) {
        return res.status(400).json({ erro: 'Formato de hora inválido para início do almoço. Use HH:MM' });
      }
      
      if (horaFimAlmoco && !regex.test(horaFimAlmoco)) {
        return res.status(400).json({ erro: 'Formato de hora inválido para fim do almoço. Use HH:MM' });
      }
    }

    const obra = await criarObra({ 
      nome, 
      endereco, 
      responsavel,
      responsavelId,
      horaInicioAlmoco,
      horaFimAlmoco
    });
    
    res.status(201).json(obra);
  } catch (err) {
    console.error('Erro ao criar obra:', err);
    res.status(500).json({ erro: 'Erro ao criar obra' });
  }
}

/**
 * Controller para obter detalhes de uma obra
 */
async function obterObraController(req, res) {
  try {
    const { id } = req.params;
    
    const obra = await Obra.findById(id)
      .populate('responsavel', 'nome telefone')
      .populate('colaboradores', 'nome telefone tipo funcao');
      
    if (!obra) {
      return res.status(404).json({ erro: 'Obra não encontrada' });
    }
    
    res.json(obra);
  } catch (err) {
    console.error('Erro ao obter obra:', err);
    res.status(500).json({ erro: 'Erro ao obter detalhes da obra' });
  }
}

/**
 * Controller para listar obras
 */
async function listarObrasController(req, res) {
  try {
    const { status } = req.query;
    
    const filtro = {};
    if (status) {
      filtro.status = status;
    }
    
    const obras = await Obra.find(filtro)
      .populate('responsavel', 'nome telefone')
      .sort({ createdAt: -1 });
      
    res.json(obras);
  } catch (err) {
    console.error('Erro ao listar obras:', err);
    res.status(500).json({ erro: 'Erro ao listar obras' });
  }
}

/**
 * Controller para atualizar obra
 */
async function atualizarObraController(req, res) {
  try {
    const { id } = req.params;
    const { nome, endereco, status, responsavel } = req.body;
    
    const obra = await Obra.findById(id);
    if (!obra) {
      return res.status(404).json({ erro: 'Obra não encontrada' });
    }
    
    // Atualizar campos
    if (nome) obra.nome = nome;
    if (endereco) obra.endereco = endereco;
    if (status) obra.status = status;
    if (responsavel) obra.responsavel = responsavel;
    
    await obra.save();
    res.json(obra);
  } catch (err) {
    console.error('Erro ao atualizar obra:', err);
    res.status(500).json({ erro: 'Erro ao atualizar obra' });
  }
}

/**
 * Controller para definir horário de almoço
 */
async function definirHorarioAlmocoController(req, res) {
  try {
    const { id } = req.params;
    const { horaInicio, horaFim } = req.body;
    
    // Validações básicas
    if (!horaInicio || !horaFim) {
      return res.status(400).json({ erro: 'Horários de início e fim são obrigatórios' });
    }
    
    // Validar formato (HH:MM)
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!regex.test(horaInicio) || !regex.test(horaFim)) {
      return res.status(400).json({ erro: 'Formato de hora inválido. Use HH:MM' });
    }
    
    // Validar que fim é depois do início
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const [horaF, minF] = horaFim.split(':').map(Number);
    
    const inicioMinutos = horaI * 60 + minI;
    const fimMinutos = horaF * 60 + minF;
    
    if (inicioMinutos >= fimMinutos && (fimMinutos + 24*60 - inicioMinutos) > 240) {
      return res.status(400).json({ erro: 'Horário de fim deve ser depois do horário de início e a duração não pode exceder 4 horas' });
    }
    
    // Atualizar obra
    const obra = await Obra.findByIdAndUpdate(
      id, 
      {
        horaInicioAlmoco: horaInicio,
        horaFimAlmoco: horaFim
      },
      { new: true }
    );
    
    if (!obra) {
      return res.status(404).json({ erro: 'Obra não encontrada' });
    }
    
    res.json({
      mensagem: 'Horário de almoço configurado com sucesso',
      obra: {
        id: obra._id,
        nome: obra.nome,
        horaInicioAlmoco: obra.horaInicioAlmoco,
        horaFimAlmoco: obra.horaFimAlmoco,
        duracaoAlmocoMinutos: obra.duracaoAlmocoMinutos
      }
    });
  } catch (err) {
    console.error('Erro ao configurar horário de almoço:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

/**
 * Controller para obter configuração de almoço
 */
async function obterHorarioAlmocoController(req, res) {
  try {
    const { id } = req.params;
    
    const obra = await Obra.findById(id, 'nome horaInicioAlmoco horaFimAlmoco duracaoAlmocoMinutos');
    
    if (!obra) {
      return res.status(404).json({ erro: 'Obra não encontrada' });
    }
    
    res.json({
      id: obra._id,
      nome: obra.nome,
      horaInicioAlmoco: obra.horaInicioAlmoco,
      horaFimAlmoco: obra.horaFimAlmoco,
      duracaoAlmocoMinutos: obra.duracaoAlmocoMinutos
    });
  } catch (err) {
    console.error('Erro ao obter configuração de almoço:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

/**
 * Controller para vincular colaborador à obra
 */
async function vincularColaboradorController(req, res) {
  try {
    const { obraId, colaboradorId } = req.body;
    
    if (!obraId || !colaboradorId) {
      return res.status(400).json({ erro: 'IDs de obra e colaborador são obrigatórios' });
    }
    
    const resultado = await vincularColaboradorObra(obraId, colaboradorId);
    res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao vincular colaborador:', err);
    res.status(500).json({ erro: 'Erro ao vincular colaborador à obra', mensagem: err.message });
  }
}

module.exports = {
  criarObraController,
  obterObraController,
  listarObrasController,
  atualizarObraController,
  definirHorarioAlmocoController,
  obterHorarioAlmocoController,
  vincularColaboradorController
};