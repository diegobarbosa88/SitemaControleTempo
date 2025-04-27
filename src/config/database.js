const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME || 'sistema_controle_tempo',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00', // Fuso horário do Brasil
  }
);

module.exports = {
  sequelize,
  Sequelize
};
