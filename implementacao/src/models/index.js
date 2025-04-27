const Funcionario = require('./Funcionario');
const RegistroPonto = require('./RegistroPonto');
const Departamento = require('./Departamento');
const LocalTrabalho = require('./LocalTrabalho');

// Estabelecer relacionamentos entre os modelos
Funcionario.belongsTo(Departamento, { foreignKey: 'departamento_id', as: 'departamento' });
Departamento.hasMany(Funcionario, { foreignKey: 'departamento_id', as: 'funcionarios' });
Departamento.belongsTo(Funcionario, { foreignKey: 'responsavel_id', as: 'responsavel' });

RegistroPonto.belongsTo(LocalTrabalho, { foreignKey: 'local_trabalho_id', as: 'local_trabalho' });
LocalTrabalho.hasMany(RegistroPonto, { foreignKey: 'local_trabalho_id', as: 'registros' });

module.exports = {
  Funcionario,
  RegistroPonto,
  Departamento,
  LocalTrabalho
};
