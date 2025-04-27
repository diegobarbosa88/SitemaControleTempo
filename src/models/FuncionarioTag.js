const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Funcionario = require('./Funcionario');
const Tag = require('./Tag');

const FuncionarioTag = sequelize.define('FuncionarioTag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  funcionario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'funcionarios',
      key: 'id'
    }
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    }
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'funcionarios_tags',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

// Estabelecer relacionamentos
Funcionario.belongsToMany(Tag, { 
  through: FuncionarioTag,
  foreignKey: 'funcionario_id',
  otherKey: 'tag_id',
  as: 'tags'
});

Tag.belongsToMany(Funcionario, { 
  through: FuncionarioTag,
  foreignKey: 'tag_id',
  otherKey: 'funcionario_id',
  as: 'funcionarios'
});

module.exports = FuncionarioTag;
