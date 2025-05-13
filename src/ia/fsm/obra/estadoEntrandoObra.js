// src/ia/fsm/obra/estadoEntrandoObra.js
const Obra = require('../../../domains/obra/obra.model');
const mongoose = require('mongoose');

module.exports = async function estadoEntrandoObra(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  console.log('🔍 Tentando entrar na obra com código:', mensagem);

  try {
    // Verificar se o código existe
    const obra = await Obra.findOne({ codigoAcesso: mensagem.toUpperCase() });

    if (!obra) {
      console.log('❌ Obra não encontrada com código:', mensagem);
      resposta = `❌ Código inválido. Tente novamente ou digite "menu" para voltar.`;
      return { resposta, etapaNova };
    }

    console.log('✅ Obra encontrada:', obra.nome, 'ID:', obra._id);

    // Verificar se o colaborador já está vinculado à obra (usando toString() para comparação segura)
    let obraJaVinculada = false;
    if (colaborador.obras && colaborador.obras.length > 0) {
      obraJaVinculada = colaborador.obras.some(obraId => {
        console.log('🔍 Comparando:', obraId, 'com', obra._id);
        return obraId.toString() === obra._id.toString();
      });
    }

    // Se não estiver vinculado, adicionar
    if (!obraJaVinculada) {
      console.log('⚙️ Adicionando obra ao colaborador...');
      
      // Criar array de obras se não existir
      if (!colaborador.obras) {
        colaborador.obras = [];
      }
      
      // Adicionar a obra ao colaborador - garantir que seja um ObjectId
      try {
        const objectId = new mongoose.Types.ObjectId(obra._id);
        console.log('✅ ObjectId criado:', objectId);
        
        // Usar unshift para colocar a obra no topo da lista (torná-la ativa)
        colaborador.obras.unshift(objectId);
        console.log('✅ Obra adicionada ao colaborador:', colaborador.obras);
      } catch (error) {
        console.error('❌ Erro ao converter ID:', error);
        
        // Tentar adicionar diretamente como string
        colaborador.obras.unshift(obra._id);
        console.log('⚠️ ID adicionado como string:', obra._id);
      }

      // Também adicionar o colaborador à obra se ainda não estiver
      // Corrigido: usar some() com toString() em vez de includes()
      const colaboradorJaAdicionado = obra.colaboradores.some(colabId => 
        colabId.toString() === colaborador._id.toString()
      );
      
      if (!colaboradorJaAdicionado) {
        obra.colaboradores.push(colaborador._id);
        await obra.save();
        console.log('✅ Colaborador adicionado à obra');
      } else {
        console.log('ℹ️ Colaborador já estava na lista da obra');
      }
    } else {
      console.log('ℹ️ Colaborador já vinculado a esta obra');
      
      // Se já estiver vinculado, vamos mover esta obra para a primeira posição (ativa)
      const obraIndex = colaborador.obras.findIndex(oId => oId.toString() === obra._id.toString());
      if (obraIndex > 0) {  // Se não for o primeiro item
        const obraId = colaborador.obras.splice(obraIndex, 1)[0];  // Remove a obra da posição atual
        colaborador.obras.unshift(obraId);  // Adiciona no início do array
        console.log('🔄 Obra movida para a posição ativa');
      }
      
      // Verificar se o colaborador está na lista da obra (corrigido)
      const colaboradorJaAdicionado = obra.colaboradores.some(colabId => 
        colabId.toString() === colaborador._id.toString()
      );
      
      if (!colaboradorJaAdicionado) {
        obra.colaboradores.push(colaborador._id);
        await obra.save();
        console.log('✅ Colaborador adicionado à obra (relação estava inconsistente)');
      }
    }

    // Definir esta obra como obra ativa no subEstado
    colaborador.subEstado = obra._id;
    
    // Atualizar o estado do colaborador
    await colaborador.save();
    console.log('✅ Colaborador salvo com obras:', colaborador.obras);
    console.log('✅ Obra ativa definida como:', colaborador.subEstado);

    resposta = `✅ Você entrou na obra *${obra.nome}*!\nEndereço: ${obra.endereco}\nResponsável: ${obra.responsavel}\n\nDigite qualquer coisa para ver o menu.`;
    etapaNova = 'em_obra';
    
    // Log final para verificar o estado
    console.log('🔚 Estado final do colaborador:', {
      id: colaborador._id,
      nome: colaborador.nome,
      obras: colaborador.obras,
      obraAtiva: colaborador.subEstado,
      novoEstado: etapaNova
    });

  } catch (error) {
    console.error('❌ Erro ao entrar na obra:', error);
    resposta = `⚠️ Ocorreu um erro ao entrar na obra. Por favor, tente novamente.`;
  }

  return { resposta, etapaNova };
};