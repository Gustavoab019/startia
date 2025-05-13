const Colaborador = require('../../../domains/colaborador/colaborador.model');
const Obra = require('../../../domains/obra/obra.model');

module.exports = async function estadoCadastrarColaborador(colaborador, mensagem) {
  let resposta = '';
  let etapaNova = colaborador.etapaCadastro;

  switch (colaborador.etapaCadastro) {
    case 'cadastrando_colab_nome':
      colaborador.tempNovoNome = mensagem;
      etapaNova = 'cadastrando_colab_telefone';
      resposta = '📱 Qual o *telefone* do colaborador? (ex: 351912345678)';
      await colaborador.save();
      break;

    case 'cadastrando_colab_telefone':
      const telefoneValido = mensagem.replace(/\D/g, '');
      if (!telefoneValido.startsWith('351') || telefoneValido.length < 9) {
        return { resposta: '❌ Telefone inválido. Ex: 351912345678', etapaNova };
      }

      colaborador.tempNovoTelefone = telefoneValido;
      etapaNova = 'cadastrando_colab_tipo';
      resposta = '👥 Qual o tipo?\n1️⃣ Colaborador\n2️⃣ Encarregado';
      await colaborador.save();
      break;

    case 'cadastrando_colab_tipo':
      if (mensagem !== '1' && mensagem !== '2') {
        return { resposta: '❌ Escolha 1 para Colaborador ou 2 para Encarregado.', etapaNova };
      }

      colaborador.tempNovoTipo = mensagem === '1' ? 'colaborador' : 'encarregado';
      etapaNova = 'cadastrando_colab_funcao';
      resposta = '🛠️ Qual a *função* do colaborador? (ex: Montador, Ajudante...)';
      await colaborador.save();
      break;

    case 'cadastrando_colab_funcao':
      colaborador.tempNovoFuncao = mensagem;

      const obraAtualId = colaborador.obras[colaborador.obras.length - 1];

      // Criar novo colaborador
      const novoColaborador = new Colaborador({
        nome: colaborador.tempNovoNome,
        telefone: colaborador.tempNovoTelefone,
        tipo: colaborador.tempNovoTipo,
        funcao: colaborador.tempNovoFuncao,
        obras: [obraAtualId]
      });

      await novoColaborador.save();

      // Adicionar o novo colaborador na obra também
      await Obra.findByIdAndUpdate(obraAtualId, {
        $addToSet: { colaboradores: novoColaborador._id }
      });

      // Limpar campos temporários
      colaborador.tempNovoNome = undefined;
      colaborador.tempNovoTelefone = undefined;
      colaborador.tempNovoTipo = undefined;
      colaborador.tempNovoFuncao = undefined;

      etapaNova = 'menu';
      resposta = `✅ Colaborador *${novoColaborador.nome}* cadastrado e vinculado à obra com sucesso!`;
      await colaborador.save();
      break;
  }

  return { resposta, etapaNova };
};
