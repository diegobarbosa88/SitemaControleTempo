const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Funcionario = sequelize.define('Funcionario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cargo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  data_contratacao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Ativo', 'Inativo', 'Férias', 'Licença'),
    defaultValue: 'Ativo'
  },
  jornada_contratada: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Horas de trabalho contratadas por semana'
  },
  tipo_autenticacao: {
    type: DataTypes.ENUM('Biométrico', 'QR', 'PIN', 'Facial', 'Email'),
    defaultValue: 'Email'
  },
  codigo_pin: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nivel_acesso: {
    type: DataTypes.ENUM('Admin', 'Gestor', 'Funcionário'),
    defaultValue: 'Funcionário'
  }
}, {
  tableName: 'funcionarios',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao',
  hooks: {
    beforeCreate: async (funcionario) => {
      if (funcionario.senha) {
        funcionario.senha = await bcrypt.hash(funcionario.senha, 10);
      }
    },
    beforeUpdate: async (funcionario) => {
      if (funcionario.changed('senha')) {
        funcionario.senha = await bcrypt.hash(funcionario.senha, 10);
      }
    }
  }
});

// Método para verificar senha
Funcionario.prototype.verificarSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = Funcionario;
