const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Funcionario = require('./Funcionario');

const RegistroPonto = sequelize.define('RegistroPonto', {
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
  tipo: {
    type: DataTypes.ENUM('Entrada', 'Saída', 'Pausa Início', 'Pausa Fim'),
    allowNull: false
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metodo_registro: {
    type: DataTypes.ENUM('Web', 'Mobile', 'Tablet', 'Biométrico', 'QR', 'PIN', 'Facial'),
    allowNull: false,
    defaultValue: 'Web'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  local_trabalho_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ip_dispositivo: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  dispositivo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  validado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'funcionarios',
      key: 'id'
    }
  },
  data_validacao: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'registros_ponto',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

// Relacionamentos
RegistroPonto.belongsTo(Funcionario, { foreignKey: 'funcionario_id', as: 'funcionario' });
RegistroPonto.belongsTo(Funcionario, { foreignKey: 'validado_por', as: 'validador' });

module.exports = RegistroPonto;
