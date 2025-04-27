const { Op } = require('sequelize');
const { RegistroPonto, Funcionario, LocalTrabalho } = require('../models');
const moment = require('moment-timezone');

// Controlador para registro de ponto
const registroPontoController = {
  // Registrar entrada, saída ou pausa
  registrarPonto: async (req, res) => {
    try {
      const { tipo, latitude, longitude, local_trabalho_id, observacao, metodo_registro } = req.body;
      const funcionario_id = req.funcionario.id;

      // Validar tipo de registro
      if (!['Entrada', 'Saída', 'Pausa Início', 'Pausa Fim'].includes(tipo)) {
        return res.status(400).json({ mensagem: 'Tipo de registro inválido' });
      }

      // Verificar se já existe um registro do mesmo tipo no mesmo dia
      const dataAtual = moment().tz('America/Sao_Paulo').startOf('day').toDate();
      const fimDoDia = moment().tz('America/Sao_Paulo').endOf('day').toDate();
      
      const registroExistente = await RegistroPonto.findOne({
        where: {
          funcionario_id,
          tipo,
          data_hora: {
            [Op.between]: [dataAtual, fimDoDia]
          }
        }
      });

      if (registroExistente && tipo === 'Entrada') {
        return res.status(400).json({ mensagem: 'Já existe um registro de entrada para hoje' });
      }

      // Verificar localização se fornecida e se há um local de trabalho
      if (latitude && longitude && local_trabalho_id) {
        const localTrabalho = await LocalTrabalho.findByPk(local_trabalho_id);
        
        if (localTrabalho) {
          // Calcular distância entre as coordenadas (fórmula de Haversine)
          const distancia = calcularDistancia(
            latitude, 
            longitude, 
            localTrabalho.latitude, 
            localTrabalho.longitude
          );
          
          // Verificar se está dentro do raio permitido
          if (distancia > localTrabalho.raio_permitido) {
            return res.status(400).json({ 
              mensagem: 'Localização fora do raio permitido para este local de trabalho',
              distancia: Math.round(distancia),
              raio_permitido: localTrabalho.raio_permitido
            });
          }
        }
      }

      // Obter informações do dispositivo
      const ip_dispositivo = req.ip || req.connection.remoteAddress;
      const dispositivo = req.headers['user-agent'] || 'Desconhecido';

      // Criar registro de ponto
      const registro = await RegistroPonto.create({
        funcionario_id,
        tipo,
        data_hora: moment().tz('America/Sao_Paulo').toDate(),
        metodo_registro: metodo_registro || 'Web',
        latitude,
        longitude,
        local_trabalho_id,
        ip_dispositivo,
        dispositivo,
        observacao,
        validado: true,
        data_validacao: moment().tz('America/Sao_Paulo').toDate()
      });

      // Buscar dados completos do registro criado
      const registroCompleto = await RegistroPonto.findByPk(registro.id, {
        include: [
          { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'email'] },
          { model: LocalTrabalho, as: 'local_trabalho', attributes: ['id', 'nome', 'endereco'] }
        ]
      });

      return res.status(201).json({
        mensagem: `Registro de ${tipo.toLowerCase()} realizado com sucesso`,
        registro: registroCompleto
      });
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  // Listar registros de ponto do funcionário logado
  listarRegistros: async (req, res) => {
    try {
      const funcionario_id = req.funcionario.id;
      const { data_inicio, data_fim } = req.query;

      // Definir período de busca
      let inicio = data_inicio 
        ? moment(data_inicio).tz('America/Sao_Paulo').startOf('day').toDate()
        : moment().tz('America/Sao_Paulo').startOf('day').toDate();
      
      let fim = data_fim
        ? moment(data_fim).tz('America/Sao_Paulo').endOf('day').toDate()
        : moment().tz('America/Sao_Paulo').endOf('day').toDate();

      // Buscar registros
      const registros = await RegistroPonto.findAll({
        where: {
          funcionario_id,
          data_hora: {
            [Op.between]: [inicio, fim]
          }
        },
        include: [
          { model: LocalTrabalho, as: 'local_trabalho', attributes: ['id', 'nome', 'endereco'] }
        ],
        order: [['data_hora', 'DESC']]
      });

      return res.status(200).json({ registros });
    } catch (error) {
      console.error('Erro ao listar registros:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  // Obter status atual do funcionário
  obterStatusAtual: async (req, res) => {
    try {
      const funcionario_id = req.funcionario.id;
      
      // Buscar o último registro do funcionário
      const ultimoRegistro = await RegistroPonto.findOne({
        where: { funcionario_id },
        order: [['data_hora', 'DESC']]
      });

      // Determinar o status atual
      let status = 'Fora do Trabalho';
      let desde = null;
      
      if (ultimoRegistro) {
        if (ultimoRegistro.tipo === 'Entrada') {
          status = 'Trabalhando';
          desde = ultimoRegistro.data_hora;
        } else if (ultimoRegistro.tipo === 'Pausa Início') {
          status = 'Em Pausa';
          desde = ultimoRegistro.data_hora;
        }
      }

      return res.status(200).json({
        status,
        desde,
        ultimo_registro: ultimoRegistro
      });
    } catch (error) {
      console.error('Erro ao obter status atual:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

// Função auxiliar para calcular distância entre coordenadas (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distância em metros

  return d;
}

module.exports = registroPontoController;
