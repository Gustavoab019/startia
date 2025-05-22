// fix-database.js
const mongoose = require('mongoose');

// Use a mesma string de conexão do seu projeto
// Verifique no seu arquivo .env ou config
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://gustavoamorim0180:dPVA3Jrbtc9Q01TH@cluster0.ykwi4dy.mongodb.net/StartIA?retryWrites=true&w=majority';

async function fixDatabase() {
  console.log('🚀 Iniciando correção do banco de dados...\n');
  
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado com sucesso!\n');
    
    const db = mongoose.connection.db;
    const obraCollection = db.collection('obras');
    
    // 1. Listar índices atuais
    console.log('📊 Verificando índices atuais da coleção "obras"...');
    const indexes = await obraCollection.indexes();
    
    console.log('Índices encontrados:');
    indexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name} -> ${JSON.stringify(idx.key)}`);
    });
    console.log('');
    
    // 2. Verificar se existe o índice problemático
    const problematicIndex = indexes.find(idx => idx.name === 'codigo_1');
    
    if (problematicIndex) {
      console.log('🚨 ÍNDICE PROBLEMÁTICO ENCONTRADO: "codigo_1"');
      console.log('🗑️ Removendo índice "codigo_1"...');
      
      try {
        await obraCollection.dropIndex('codigo_1');
        console.log('✅ Índice "codigo_1" removido com sucesso!\n');
      } catch (dropError) {
        if (dropError.codeName === 'IndexNotFound') {
          console.log('ℹ️ Índice "codigo_1" já foi removido anteriormente.\n');
        } else {
          throw dropError;
        }
      }
    } else {
      console.log('ℹ️ Índice "codigo_1" não encontrado (já foi removido ou nunca existiu).\n');
    }
    
    // 3. Verificar documentos com campo 'codigo'
    console.log('🔍 Verificando documentos com campo "codigo"...');
    const docsWithCodigo = await obraCollection.find({ 
      codigo: { $exists: true } 
    }).toArray();
    
    console.log(`Encontrados ${docsWithCodigo.length} documentos com campo "codigo"`);
    
    if (docsWithCodigo.length > 0) {
      console.log('Documentos encontrados:');
      docsWithCodigo.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.nome || 'Sem nome'} (codigo: ${doc.codigo})`);
      });
      
      console.log('\n🧹 Removendo campo "codigo" desnecessário...');
      const updateResult = await obraCollection.updateMany(
        { codigo: { $exists: true } },
        { $unset: { codigo: "" } }
      );
      console.log(`✅ Campo "codigo" removido de ${updateResult.modifiedCount} documentos\n`);
    } else {
      console.log('ℹ️ Nenhum documento com campo "codigo" encontrado.\n');
    }
    
    // 4. Verificar se há documentos com codigoAcesso null
    console.log('🔍 Verificando documentos com codigoAcesso null...');
    const docsWithNullCodigo = await obraCollection.find({ 
      codigoAcesso: null 
    }).toArray();
    
    if (docsWithNullCodigo.length > 0) {
      console.log(`🚨 Encontrados ${docsWithNullCodigo.length} documentos com codigoAcesso null`);
      console.log('🗑️ Removendo documentos inválidos...');
      
      const deleteResult = await obraCollection.deleteMany({ codigoAcesso: null });
      console.log(`✅ ${deleteResult.deletedCount} documentos inválidos removidos\n`);
    } else {
      console.log('ℹ️ Nenhum documento com codigoAcesso null encontrado.\n');
    }
    
    // 5. Listar índices finais
    console.log('📊 Verificando índices após correção...');
    const finalIndexes = await obraCollection.indexes();
    
    console.log('Índices atuais:');
    finalIndexes.forEach((idx, i) => {
      console.log(`  ${i + 1}. ${idx.name} -> ${JSON.stringify(idx.key)}`);
    });
    
    // 6. Teste de criação
    console.log('\n🧪 Testando criação de obra...');
    const testObra = {
      nome: 'Teste Correção DB',
      endereco: 'Endereço Teste',
      responsavel: '351999999999',
      responsavelId: new mongoose.Types.ObjectId(),
      codigoAcesso: 'TEST' + Math.random().toString(36).substr(2, 3).toUpperCase(),
      horaInicioAlmoco: '12:00',
      horaFimAlmoco: '13:00'
    };
    
    const insertResult = await obraCollection.insertOne(testObra);
    console.log('✅ Teste de inserção bem-sucedido!');
    console.log(`   ID: ${insertResult.insertedId}`);
    console.log(`   Código: ${testObra.codigoAcesso}\n`);
    
    // Remover o documento de teste
    await obraCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🧹 Documento de teste removido.\n');
    
    console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ O banco está pronto para criar novas obras.');
    console.log('🚀 Você pode reiniciar a aplicação agora.\n');
    
  } catch (error) {
    console.error('❌ ERRO durante a correção:', error);
    console.log('\n🔍 Informações do erro:');
    console.log('Mensagem:', error.message);
    if (error.code) {
      console.log('Código:', error.code);
    }
    console.log('\n💡 Tente executar o script novamente ou entre em contato com suporte.');
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Desconectado do MongoDB');
    } catch (disconnectError) {
      console.log('⚠️ Erro ao desconectar:', disconnectError.message);
    }
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  fixDatabase();
}

module.exports = fixDatabase;