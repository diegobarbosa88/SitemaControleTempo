const { Departamento, Funcionario } = require('../models');

// Controlador para gestão de departamentos
const departamentoController = {
  // Listar todos os departamentos
  listarDepartamentos: async (req, res) => {
    try {
      const departamentos = await Departamento.findAll({
        include: [
          { model: Funcionario, as: 'responsavel', attributes: ['id', 'nome', 'email'] }
        ],
        order: [['nome', 'ASC']]
      });
      
      return res.status(200).json({ departamentos });
    } catch (error) {
      console.error('Erro ao listar departamentos:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Obter detalhes de um departamento específico
  obterDepartamento: async (req, res) => {
    try {
      const { id } = req.params;
      
      const departamento = await Departamento.findByPk(id, {
        include: [
          { model: Funcionario, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
          { model: Funcionario, as: 'funcionarios', attributes: ['id', 'nome', 'email', 'cargo', 'status'] }
        ]
      });
      
      if (!departamento) {
        return res.status(404).json({ mensagem: 'Departamento não encontrado' });
      }
      
      return res.status(200).json({ departamento });
    } catch (error) {
      console.error('Erro ao obter departamento:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Criar novo departamento
  criarDepartamento: async (req, res) => {
    try {
      const { nome, descricao, responsavel_id } = req.body;
      
      // Validar dados obrigatórios
      if (!nome) {
        return res.status(400).json({ mensagem: 'Nome do departamento é obrigatório' });
      }
      
      // Verificar se responsável existe, se fornecido
      if (responsavel_id) {
        const responsavel = await Funcionario.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(400).json({ mensagem: 'Responsável não encontrado' });
        }
      }
      
      // Criar departamento
      const departamento = await Departamento.create({
        nome,
        descricao,
        responsavel_id
      });
      
      // Buscar departamento criado com relacionamentos
      const departamentoCriado = await Departamento.findByPk(departamento.id, {
        include: [
          { model: Funcionario, as: 'responsavel', attributes: ['id', 'nome', 'email'] }
        ]
      });
      
      return res.status(201).json({
        mensagem: 'Departamento criado com sucesso',
        departamento: departamentoCriado
      });
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Atualizar departamento existente
  atualizarDepartamento: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, responsavel_id } = req.body;
      
      // Verificar se departamento existe
      const departamento = await Departamento.findByPk(id);
      if (!departamento) {
        return res.status(404).json({ mensagem: 'Departamento não encontrado' });
      }
      
      // Verificar se responsável existe, se fornecido
      if (responsavel_id) {
        const responsavel = await Funcionario.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(400).json({ mensagem: 'Responsável não encontrado' });
        }
      }
      
      // Atualizar departamento
      await departamento.update({
        nome: nome || departamento.nome,
        descricao: descricao !== undefined ? descricao : departamento.descricao,
        responsavel_id: responsavel_id !== undefined ? responsavel_id : departamento.responsavel_id
      });
      
      // Buscar departamento atualizado com relacionamentos
      const departamentoAtualizado = await Departamento.findByPk(id, {
        include: [
          { model: Funcionario, as: 'responsavel', attributes: ['id', 'nome', 'email'] }
        ]
      });
      
      return res.status(200).json({
        mensagem: 'Departamento atualizado com sucesso',
        departamento: departamentoAtualizado
      });
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Excluir departamento
  excluirDepartamento: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se departamento existe
      const departamento = await Departamento.findByPk(id);
      if (!departamento) {
        return res.status(404).json({ mensagem: 'Departamento não encontrado' });
      }
      
      // Verificar se há funcionários associados
      const funcionariosAssociados = await Funcionario.count({
        where: { departamento_id: id }
      });
      
      if (funcionariosAssociados > 0) {
        return res.status(400).json({
          mensagem: 'Não é possível excluir este departamento pois existem funcionários associados',
          funcionarios_associados: funcionariosAssociados
        });
      }
      
      // Excluir departamento
      await departamento.destroy();
      
      return res.status(200).json({
        mensagem: 'Departamento excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = departamentoController;
