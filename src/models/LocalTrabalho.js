const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LocalTrabalho = sequelize.define('LocalTrabalho', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  endereco: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  raio_permitido: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 100,
    comment: 'Raio em metros permitido para registro'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'locais_trabalho',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

module.exports = LocalTrabalho;
