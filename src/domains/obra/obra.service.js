// src/domains/obra/obra.service.js
const mongoose = require('mongoose');
const Obra = require('./obra.model');
const gerarCodigo = require('../../utils/gerarCodigo');

async function criarObra({ 
  nome, 
  endereco, 
  responsavel, 
  responsavelId,
  horaInicioAlmoco = '12:00',
  horaFimAlmoco = '13:00'
}) {
    let codigoAcesso;
    let obraExistente;
  
    do {
      codigoAcesso = gerarCodigo(6);
      obraExistente = await Obra.findOne({ codigoAcesso });
    } while (obraExistente);
  
    // Converter responsavelId para ObjectId se for string válida
    let responsavelObjId = null;
    if (responsavelId && mongoose.Types.ObjectId.isValid(responsavelId)) {
      responsavelObjId = new mongoose.Types.ObjectId(responsavelId);
    }
  
    const novaObra = new Obra({
      nome,
      endereco,
      codigoAcesso,
      responsavel: responsavelObjId, // Usar ObjectId ou null
      responsavelTelefone: responsavel, // Salvar o telefone do responsável
      colaboradores: responsavelObjId ? [responsavelObjId] : [],
      horaInicioAlmoco,
      horaFimAlmoco
    });
  
    await novaObra.save();
    return novaObra;
}

async function obterObraAtiva(colaborador) {
  if (!colaborador.obras || colaborador.obras.length === 0) {
    return null;
  }
  
  // Se houver subEstado com ID de obra, usar ele
  if (colaborador.subEstado && mongoose.Types.ObjectId.isValid(colaborador.subEstado)) {
    const obraAtiva = await Obra.findById(colaborador.subEstado);
    if (obraAtiva) return obraAtiva;
  }
  
  // Caso contrário, assume que a primeira obra da lista é a ativa
  const obraId = colaborador.obras[0];
  return await Obra.findById(obraId);
}

module.exports = {
  criarObra,
  obterObraAtiva
};