const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Departamento = sequelize.define('Departamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsavel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'funcionarios',
      key: 'id'
    }
  }
}, {
  tableName: 'departamentos',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

module.exports = Departamento;
