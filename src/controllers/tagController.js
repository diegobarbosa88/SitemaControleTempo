const { Tag, Funcionario, FuncionarioTag } = require('../models');

// Controlador para gestão de tags
const tagController = {
  // Listar todas as tags
  listarTags: async (req, res) => {
    try {
      const tags = await Tag.findAll({
        order: [['nome', 'ASC']]
      });
      
      return res.status(200).json({ tags });
    } catch (error) {
      console.error('Erro ao listar tags:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Obter detalhes de uma tag específica
  obterTag: async (req, res) => {
    try {
      const { id } = req.params;
      
      const tag = await Tag.findByPk(id, {
        include: [
          { 
            model: Funcionario, 
            as: 'funcionarios', 
            attributes: ['id', 'nome', 'email', 'cargo', 'status'],
            through: { attributes: [] } // Não incluir atributos da tabela de junção
          }
        ]
      });
      
      if (!tag) {
        return res.status(404).json({ mensagem: 'Tag não encontrada' });
      }
      
      return res.status(200).json({ tag });
    } catch (error) {
      console.error('Erro ao obter tag:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Criar nova tag
  criarTag: async (req, res) => {
    try {
      const { nome, cor, descricao } = req.body;
      
      // Validar dados obrigatórios
      if (!nome) {
        return res.status(400).json({ mensagem: 'Nome da tag é obrigatório' });
      }
      
      // Verificar se já existe tag com o mesmo nome
      const tagExistente = await Tag.findOne({ where: { nome } });
      if (tagExistente) {
        return res.status(400).json({ mensagem: 'Já existe uma tag com este nome' });
      }
      
      // Criar tag
      const tag = await Tag.create({
        nome,
        cor,
        descricao
      });
      
      return res.status(201).json({
        mensagem: 'Tag criada com sucesso',
        tag
      });
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Atualizar tag existente
  atualizarTag: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cor, descricao } = req.body;
      
      // Verificar se tag existe
      const tag = await Tag.findByPk(id);
      if (!tag) {
        return res.status(404).json({ mensagem: 'Tag não encontrada' });
      }
      
      // Verificar se já existe outra tag com o mesmo nome
      if (nome && nome !== tag.nome) {
        const tagExistente = await Tag.findOne({ where: { nome } });
        if (tagExistente) {
          return res.status(400).json({ mensagem: 'Já existe outra tag com este nome' });
        }
      }
      
      // Atualizar tag
      await tag.update({
        nome: nome || tag.nome,
        cor: cor !== undefined ? cor : tag.cor,
        descricao: descricao !== undefined ? descricao : tag.descricao
      });
      
      return res.status(200).json({
        mensagem: 'Tag atualizada com sucesso',
        tag
      });
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Excluir tag
  excluirTag: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se tag existe
      const tag = await Tag.findByPk(id);
      if (!tag) {
        return res.status(404).json({ mensagem: 'Tag não encontrada' });
      }
      
      // Verificar se há funcionários associados
      const funcionariosAssociados = await FuncionarioTag.count({
        where: { tag_id: id }
      });
      
      if (funcionariosAssociados > 0) {
        return res.status(400).json({
          mensagem: 'Não é possível excluir esta tag pois existem funcionários associados',
          funcionarios_associados: funcionariosAssociados
        });
      }
      
      // Excluir tag
      await tag.destroy();
      
      return res.status(200).json({
        mensagem: 'Tag excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Associar tag a funcionário
  associarTagFuncionario: async (req, res) => {
    try {
      const { funcionario_id, tag_id, data_inicio, data_fim } = req.body;
      
      // Validar dados obrigatórios
      if (!funcionario_id || !tag_id) {
        return res.status(400).json({ mensagem: 'IDs do funcionário e da tag são obrigatórios' });
      }
      
      // Verificar se funcionário existe
      const funcionario = await Funcionario.findByPk(funcionario_id);
      if (!funcionario) {
        return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
      }
      
      // Verificar se tag existe
      const tag = await Tag.findByPk(tag_id);
      if (!tag) {
        return res.status(404).json({ mensagem: 'Tag não encontrada' });
      }
      
      // Verificar se já existe associação
      const associacaoExistente = await FuncionarioTag.findOne({
        where: { funcionario_id, tag_id }
      });
      
      if (associacaoExistente) {
        // Atualizar associação existente
        await associacaoExistente.update({
          data_inicio: data_inicio || associacaoExistente.data_inicio,
          data_fim: data_fim !== undefined ? data_fim : associacaoExistente.data_fim,
          ativo: true
        });
        
        return res.status(200).json({
          mensagem: 'Associação atualizada com sucesso',
          associacao: associacaoExistente
        });
      }
      
      // Criar nova associação
      const associacao = await FuncionarioTag.create({
        funcionario_id,
        tag_id,
        data_inicio,
        data_fim,
        ativo: true
      });
      
      return res.status(201).json({
        mensagem: 'Tag associada ao funcionário com sucesso',
        associacao
      });
    } catch (error) {
      console.error('Erro ao associar tag a funcionário:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Remover associação entre tag e funcionário
  removerTagFuncionario: async (req, res) => {
    try {
      const { funcionario_id, tag_id } = req.params;
      
      // Verificar se associação existe
      const associacao = await FuncionarioTag.findOne({
        where: { funcionario_id, tag_id }
      });
      
      if (!associacao) {
        return res.status(404).json({ mensagem: 'Associação não encontrada' });
      }
      
      // Remover associação
      await associacao.destroy();
      
      return res.status(200).json({
        mensagem: 'Associação removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover associação:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = tagController;
