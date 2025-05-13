// src/services/s3.service.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configuração do S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-2'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'startone-assets';

// Esta função é mantida para compatibilidade, mas não será usada no fluxo principal
async function uploadImageToS3(imageBuffer, namePrefix) {
  const publicId = `${namePrefix}_${uuidv4()}`;
  const params = {
    Bucket: BUCKET_NAME,
    Key: `fotos/${publicId}.jpg`,
    Body: imageBuffer,
    ContentType: 'image/jpeg'
    // ACL: 'public-read' foi removido para evitar erros
  };

  try {
    const result = await s3.upload(params).promise();
    console.log('✅ Upload para S3 bem-sucedido:', result.Location);
    
    return {
      url: result.Location, // Esta é a URL pública gerada pelo S3
      publicId
    };
  } catch (error) {
    console.error('❌ Erro ao fazer upload para S3:', error);
    throw error;
  }
}

async function deleteImageFromS3(publicId) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `fotos/${publicId}.jpg`
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar imagem do S3:', error);
    return false;
  }
}

module.exports = {
  uploadImageToS3,
  deleteImageFromS3
};