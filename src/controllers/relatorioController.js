const { Op } = require('sequelize');
const { RegistroPonto, Funcionario, Departamento, LocalTrabalho, Tag, FuncionarioTag } = require('../models');
const moment = require('moment-timezone');

// Controlador para geração de relatórios
const relatorioController = {
  // Gerar relatório de horas trabalhadas
  relatorioHorasTrabalhadas: async (req, res) => {
    try {
      const { data_inicio, data_fim, funcionario_id, departamento_id, tag_id, agrupar_por } = req.query;
      
      // Validar datas
      if (!data_inicio || !data_fim) {
        return res.status(400).json({ mensagem: 'Datas de início e fim são obrigatórias' });
      }
      
      // Converter datas para o formato correto
      const inicio = moment(data_inicio).tz('America/Sao_Paulo').startOf('day').toDate();
      const fim = moment(data_fim).tz('America/Sao_Paulo').endOf('day').toDate();
      
      // Construir condições de busca
      const where = {
        data_hora: {
          [Op.between]: [inicio, fim]
        }
      };
      
      // Filtrar por funcionário se especificado
      if (funcionario_id) {
        where.funcionario_id = funcionario_id;
      }
      
      // Incluir relacionamentos
      const include = [
        { 
          model: Funcionario, 
          as: 'funcionario',
          attributes: ['id', 'nome', 'email', 'cargo', 'departamento_id'],
          include: [
            { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
          ]
        },
        { model: LocalTrabalho, as: 'local_trabalho', attributes: ['id', 'nome', 'endereco'] }
      ];
      
      // Filtrar por departamento se especificado
      if (departamento_id) {
        include[0].where = { departamento_id };
      }
      
      // Buscar registros de ponto
      const registros = await RegistroPonto.findAll({
        where,
        include,
        order: [['data_hora', 'ASC']]
      });
      
      // Processar registros para calcular horas trabalhadas
      const resultado = processarRegistrosHorasTrabalhadas(registros, agrupar_por);
      
      // Filtrar por tag se especificado (pós-processamento pois requer join complexo)
      let resultadoFiltrado = resultado;
      if (tag_id) {
        // Buscar funcionários com a tag especificada
        const funcionariosComTag = await FuncionarioTag.findAll({
          where: { tag_id },
          attributes: ['funcionario_id']
        });
        
        const idsComTag = funcionariosComTag.map(ft => ft.funcionario_id);
        
        // Filtrar resultado
        if (agrupar_por === 'funcionario') {
          resultadoFiltrado = resultado.filter(item => idsComTag.includes(item.funcionario_id));
        } else {
          // Para outros agrupamentos, filtrar os funcionários dentro de cada grupo
          resultadoFiltrado = resultado.map(grupo => {
            return {
              ...grupo,
              funcionarios: grupo.funcionarios.filter(f => idsComTag.includes(f.funcionario_id))
            };
          }).filter(grupo => grupo.funcionarios.length > 0);
        }
      }
      
      return res.status(200).json({
        periodo: {
          inicio: data_inicio,
          fim: data_fim
        },
        relatorio: resultadoFiltrado
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de horas trabalhadas:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Gerar relatório de presença
  relatorioPresenca: async (req, res) => {
    try {
      const { data_inicio, data_fim, funcionario_id, departamento_id, tag_id } = req.query;
      
      // Validar datas
      if (!data_inicio || !data_fim) {
        return res.status(400).json({ mensagem: 'Datas de início e fim são obrigatórias' });
      }
      
      // Converter datas para o formato correto
      const inicio = moment(data_inicio).tz('America/Sao_Paulo').startOf('day');
      const fim = moment(data_fim).tz('America/Sao_Paulo').endOf('day');
      
      // Calcular número de dias úteis no período
      const diasUteis = calcularDiasUteis(inicio, fim);
      
      // Buscar funcionários
      const whereFuncionario = {};
      if (funcionario_id) {
        whereFuncionario.id = funcionario_id;
      }
      
      if (departamento_id) {
        whereFuncionario.departamento_id = departamento_id;
      }
      
      let funcionarios = await Funcionario.findAll({
        where: whereFuncionario,
        include: [
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        attributes: ['id', 'nome', 'email', 'cargo', 'departamento_id', 'status']
      });
      
      // Filtrar por tag se especificado
      if (tag_id) {
        const funcionariosComTag = await FuncionarioTag.findAll({
          where: { tag_id },
          attributes: ['funcionario_id']
        });
        
        const idsComTag = funcionariosComTag.map(ft => ft.funcionario_id);
        funcionarios = funcionarios.filter(f => idsComTag.includes(f.id));
      }
      
      // Para cada funcionário, buscar registros de ponto no período
      const relatorio = await Promise.all(funcionarios.map(async (funcionario) => {
        const registros = await RegistroPonto.findAll({
          where: {
            funcionario_id: funcionario.id,
            data_hora: {
              [Op.between]: [inicio.toDate(), fim.toDate()]
            },
            tipo: 'Entrada'
          },
          order: [['data_hora', 'ASC']]
        });
        
        // Agrupar registros por dia
        const diasPresentes = new Set();
        registros.forEach(registro => {
          const dia = moment(registro.data_hora).tz('America/Sao_Paulo').format('YYYY-MM-DD');
          diasPresentes.add(dia);
        });
        
        // Calcular estatísticas
        const presencas = diasPresentes.size;
        const faltas = diasUteis - presencas;
        const taxaPresenca = diasUteis > 0 ? (presencas / diasUteis) * 100 : 0;
        
        return {
          funcionario: {
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            cargo: funcionario.cargo,
            departamento: funcionario.departamento ? funcionario.departamento.nome : 'Não atribuído'
          },
          estatisticas: {
            dias_uteis: diasUteis,
            presencas,
            faltas,
            taxa_presenca: taxaPresenca.toFixed(2) + '%'
          },
          dias_presentes: Array.from(diasPresentes)
        };
      }));
      
      return res.status(200).json({
        periodo: {
          inicio: data_inicio,
          fim: data_fim,
          dias_uteis: diasUteis
        },
        relatorio
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de presença:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Gerar relatório de horas extras
  relatorioHorasExtras: async (req, res) => {
    try {
      const { data_inicio, data_fim, funcionario_id, departamento_id, tag_id } = req.query;
      
      // Validar datas
      if (!data_inicio || !data_fim) {
        return res.status(400).json({ mensagem: 'Datas de início e fim são obrigatórias' });
      }
      
      // Converter datas para o formato correto
      const inicio = moment(data_inicio).tz('America/Sao_Paulo').startOf('day').toDate();
      const fim = moment(data_fim).tz('America/Sao_Paulo').endOf('day').toDate();
      
      // Construir condições de busca
      const where = {
        data_hora: {
          [Op.between]: [inicio, fim]
        }
      };
      
      // Filtrar por funcionário se especificado
      if (funcionario_id) {
        where.funcionario_id = funcionario_id;
      }
      
      // Incluir relacionamentos
      const include = [
        { 
          model: Funcionario, 
          as: 'funcionario',
          attributes: ['id', 'nome', 'email', 'cargo', 'departamento_id', 'jornada_contratada'],
          include: [
            { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
          ]
        }
      ];
      
      // Filtrar por departamento se especificado
      if (departamento_id) {
        include[0].where = { departamento_id };
      }
      
      // Buscar registros de ponto
      const registros = await RegistroPonto.findAll({
        where,
        include,
        order: [['funcionario_id', 'ASC'], ['data_hora', 'ASC']]
      });
      
      // Processar registros para calcular horas extras
      const resultado = processarRegistrosHorasExtras(registros, inicio, fim);
      
      // Filtrar por tag se especificado
      let resultadoFiltrado = resultado;
      if (tag_id) {
        // Buscar funcionários com a tag especificada
        const funcionariosComTag = await FuncionarioTag.findAll({
          where: { tag_id },
          attributes: ['funcionario_id']
        });
        
        const idsComTag = funcionariosComTag.map(ft => ft.funcionario_id);
        resultadoFiltrado = resultado.filter(item => idsComTag.includes(item.funcionario.id));
      }
      
      return res.status(200).json({
        periodo: {
          inicio: data_inicio,
          fim: data_fim
        },
        relatorio: resultadoFiltrado
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de horas extras:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },
  
  // Listar tags para relatórios
  listarTags: async (req, res) => {
    try {
      const tags = await Tag.findAll({
        attributes: ['id', 'nome', 'cor'],
        order: [['nome', 'ASC']]
      });
      
      return res.status(200).json({ tags });
    } catch (error) {
      console.error('Erro ao listar tags para relatórios:', error);
      return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

// Função auxiliar para processar registros e calcular horas trabalhadas
function processarRegistrosHorasTrabalhadas(registros, agruparPor) {
  // Agrupar registros por funcionário
  const registrosPorFuncionario = {};
  
  registros.forEach(registro => {
    const funcionarioId = registro.funcionario_id;
    
    if (!registrosPorFuncionario[funcionarioId]) {
      registrosPorFuncionario[funcionarioId] = {
        funcionario: registro.funcionario,
        registros: []
      };
    }
    
    registrosPorFuncionario[funcionarioId].registros.push(registro);
  });
  
  // Calcular horas trabalhadas por funcionário
  const horasPorFuncionario = [];
  
  Object.values(registrosPorFuncionario).forEach(({ funcionario, registros }) => {
    // Agrupar registros por dia
    const registrosPorDia = {};
    
    registros.forEach(registro => {
      const dia = moment(registro.data_hora).tz('America/Sao_Paulo').format('YYYY-MM-DD');
      
      if (!registrosPorDia[dia]) {
        registrosPorDia[dia] = [];
      }
      
      registrosPorDia[dia].push(registro);
    });
    
    // Calcular horas trabalhadas por dia
    let totalMinutos = 0;
    const dias = [];
    
    Object.entries(registrosPorDia).forEach(([dia, registrosDia]) => {
      // Ordenar registros por data/hora
      registrosDia.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      
      let minutosNoDia = 0;
      let inicioTrabalho = null;
      let inicioPausa = null;
      
      // Processar registros do dia
      registrosDia.forEach(registro => {
        if (registro.tipo === 'Entrada') {
          inicioTrabalho = moment(registro.data_hora);
        } else if (registro.tipo === 'Saída' && inicioTrabalho) {
          const fimTrabalho = moment(registro.data_hora);
          let duracaoMinutos = fimTrabalho.diff(inicioTrabalho, 'minutes');
          
          // Subtrair pausas se houver
          if (inicioPausa) {
            duracaoMinutos -= inicioPausa.diff(inicioTrabalho, 'minutes');
          }
          
          minutosNoDia += duracaoMinutos;
          inicioTrabalho = null;
          inicioPausa = null;
        } else if (registro.tipo === 'Pausa Início' && inicioTrabalho) {
          inicioPausa = moment(registro.data_hora);
        } else if (registro.tipo === 'Pausa Fim' && inicioPausa) {
          const fimPausa = moment(registro.data_hora);
          const duracaoPausa = fimPausa.diff(inicioPausa, 'minutes');
          minutosNoDia -= duracaoPausa;
          inicioPausa = null;
        }
      });
      
      // Se o dia terminou sem registro de saída, considerar até o fim do dia
      if (inicioTrabalho) {
        const fimDia = moment(dia).tz('America/Sao_Paulo').endOf('day');
        let duracaoMinutos = fimDia.diff(inicioTrabalho, 'minutes');
        
        // Subtrair pausas se houver
        if (inicioPausa) {
          duracaoMinutos -= inicioPausa.diff(inicioTrabalho, 'minutes');
        }
        
        minutosNoDia += duracaoMinutos;
      }
      
      totalMinutos += minutosNoDia;
      
      dias.push({
        data: dia,
        horas_trabalhadas: formatarMinutosEmHoras(minutosNoDia),
        minutos_trabalhados: minutosNoDia,
        registros: registrosDia.map(r => ({
          tipo: r.tipo,
          data_hora: r.data_hora,
          local: r.local_trabalho ? r.local_trabalho.nome : 'Não especificado'
        }))
      });
    });
    
    horasPorFuncionario.push({
      funcionario_id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
      departamento: funcionario.departamento ? funcionario.departamento.nome : 'Não atribuído',
      departamento_id: funcionario.departamento_id,
      total_horas: formatarMinutosEmHoras(totalMinutos),
      total_minutos: totalMinutos,
      dias
    });
  });
  
  // Se não for para agrupar, retornar lista de funcionários
  if (!agruparPor || agruparPor === 'funcionario') {
    return horasPorFuncionario;
  }
  
  // Agrupar por departamento
  if (agruparPor === 'departamento') {
    const horasPorDepartamento = {};
    
    horasPorFuncionario.forEach(funcionario => {
      const departamentoId = funcionario.departamento_id || 'sem_departamento';
      const departamentoNome = funcionario.departamento || 'Sem Departamento';
      
      if (!horasPorDepartamento[departamentoId]) {
        horasPorDepartamento[departamentoId] = {
          departamento_id: departamentoId === 'sem_departamento' ? null : departamentoId,
          nome: departamentoNome,
          total_minutos: 0,
          funcionarios: []
        };
      }
      
      horasPorDepartamento[departamentoId].total_minutos += funcionario.total_minutos;
      horasPorDepartamento[departamentoId].funcionarios.push(funcionario);
    });
    
    // Calcular total de horas por departamento
    return Object.values(horasPorDepartamento).map(departamento => ({
      ...departamento,
      total_horas: formatarMinutosEmHoras(departamento.total_minutos)
    }));
  }
  
  // Agrupar por dia
  if (agruparPor === 'dia') {
    const horasPorDia = {};
    
    horasPorFuncionario.forEach(funcionario => {
      funcionario.dias.forEach(dia => {
        const data = dia.data;
        
        if (!horasPorDia[data]) {
          horasPorDia[data] = {
            data,
            total_minutos: 0,
            funcionarios: []
          };
        }
        
        // Verificar se o funcionário já foi adicionado para este dia
        const funcionarioExistente = horasPorDia[data].funcionarios.find(f => f.id === funcionario.funcionario_id);
        
        if (!funcionarioExistente) {
          horasPorDia[data].funcionarios.push({
            id: funcionario.funcionario_id,
            nome: funcionario.nome,
            email: funcionario.email,
            departamento: funcionario.departamento,
            minutos_trabalhados: dia.minutos_trabalhados,
            horas_trabalhadas: dia.horas_trabalhadas
          });
        }
        
        horasPorDia[data].total_minutos += dia.minutos_trabalhados;
      });
    });
    
    // Calcular total de horas por dia
    return Object.values(horasPorDia).map(dia => ({
      ...dia,
      total_horas: formatarMinutosEmHoras(dia.total_minutos)
    })).sort((a, b) => new Date(a.data) - new Date(b.data));
  }
  
  // Padrão: retornar por funcionário
  return horasPorFuncionario;
}

// Função auxiliar para processar registros e calcular horas extras
function processarRegistrosHorasExtras(registros, dataInicio, dataFim) {
  // Agrupar registros por funcionário
  const registrosPorFuncionario = {};
  
  registros.forEach(registro => {
    const funcionarioId = registro.funcionario_id;
    
    if (!registrosPorFuncionario[funcionarioId]) {
      registrosPorFuncionario[funcionarioId] = {
        funcionario: registro.funcionario,
        registros: []
      };
    }
    
    registrosPorFuncionario[funcionarioId].registros.push(registro);
  });
  
  // Calcular horas extras por funcionário
  const horasExtrasPorFuncionario = [];
  
  Object.values(registrosPorFuncionario).forEach(({ funcionario, registros }) => {
    // Verificar se o funcionário tem jornada contratada definida
    const jornadaContratadaSemanal = funcionario.jornada_contratada || 40; // Padrão: 40h semanais
    const jornadaContratadaDiaria = jornadaContratadaSemanal / 5; // Considerando 5 dias úteis
    
    // Agrupar registros por semana e por dia
    const registrosPorSemana = {};
    const registrosPorDia = {};
    
    registros.forEach(registro => {
      const data = moment(registro.data_hora).tz('America/Sao_Paulo');
      const semana = data.format('YYYY-[W]WW');
      const dia = data.format('YYYY-MM-DD');
      
      if (!registrosPorSemana[semana]) {
        registrosPorSemana[semana] = [];
      }
      
      if (!registrosPorDia[dia]) {
        registrosPorDia[dia] = [];
      }
      
      registrosPorSemana[semana].push(registro);
      registrosPorDia[dia].push(registro);
    });
    
    // Calcular horas trabalhadas por dia e por semana
    const diasComHorasExtras = [];
    let totalMinutosExtras = 0;
    
    // Processar cada dia
    Object.entries(registrosPorDia).forEach(([dia, registrosDia]) => {
      // Ordenar registros por data/hora
      registrosDia.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      
      let minutosNoDia = 0;
      let inicioTrabalho = null;
      let inicioPausa = null;
      
      // Processar registros do dia
      registrosDia.forEach(registro => {
        if (registro.tipo === 'Entrada') {
          inicioTrabalho = moment(registro.data_hora);
        } else if (registro.tipo === 'Saída' && inicioTrabalho) {
          const fimTrabalho = moment(registro.data_hora);
          let duracaoMinutos = fimTrabalho.diff(inicioTrabalho, 'minutes');
          
          // Subtrair pausas se houver
          if (inicioPausa) {
            duracaoMinutos -= inicioPausa.diff(inicioTrabalho, 'minutes');
          }
          
          minutosNoDia += duracaoMinutos;
          inicioTrabalho = null;
          inicioPausa = null;
        } else if (registro.tipo === 'Pausa Início' && inicioTrabalho) {
          inicioPausa = moment(registro.data_hora);
        } else if (registro.tipo === 'Pausa Fim' && inicioPausa) {
          const fimPausa = moment(registro.data_hora);
          const duracaoPausa = fimPausa.diff(inicioPausa, 'minutes');
          minutosNoDia -= duracaoPausa;
          inicioPausa = null;
        }
      });
      
      // Calcular horas extras do dia
      const jornadaContratadaMinutos = jornadaContratadaDiaria * 60;
      const minutosExtras = Math.max(0, minutosNoDia - jornadaContratadaMinutos);
      
      if (minutosExtras > 0) {
        diasComHorasExtras.push({
          data: dia,
          horas_trabalhadas: formatarMinutosEmHoras(minutosNoDia),
          jornada_contratada: formatarMinutosEmHoras(jornadaContratadaMinutos),
          horas_extras: formatarMinutosEmHoras(minutosExtras),
          minutos_extras: minutosExtras
        });
        
        totalMinutosExtras += minutosExtras;
      }
    });
    
    // Calcular horas extras por semana
    const semanasComHorasExtras = [];
    
    Object.entries(registrosPorSemana).forEach(([semana, registrosSemana]) => {
      // Agrupar registros por dia na semana
      const diasNaSemana = {};
      
      registrosSemana.forEach(registro => {
        const dia = moment(registro.data_hora).tz('America/Sao_Paulo').format('YYYY-MM-DD');
        
        if (!diasNaSemana[dia]) {
          diasNaSemana[dia] = [];
        }
        
        diasNaSemana[dia].push(registro);
      });
      
      // Calcular total de minutos trabalhados na semana
      let totalMinutosNaSemana = 0;
      
      Object.values(diasNaSemana).forEach(registrosDia => {
        // Ordenar registros por data/hora
        registrosDia.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
        
        let minutosNoDia = 0;
        let inicioTrabalho = null;
        let inicioPausa = null;
        
        // Processar registros do dia
        registrosDia.forEach(registro => {
          if (registro.tipo === 'Entrada') {
            inicioTrabalho = moment(registro.data_hora);
          } else if (registro.tipo === 'Saída' && inicioTrabalho) {
            const fimTrabalho = moment(registro.data_hora);
            let duracaoMinutos = fimTrabalho.diff(inicioTrabalho, 'minutes');
            
            // Subtrair pausas se houver
            if (inicioPausa) {
              duracaoMinutos -= inicioPausa.diff(inicioTrabalho, 'minutes');
            }
            
            minutosNoDia += duracaoMinutos;
            inicioTrabalho = null;
            inicioPausa = null;
          } else if (registro.tipo === 'Pausa Início' && inicioTrabalho) {
            inicioPausa = moment(registro.data_hora);
          } else if (registro.tipo === 'Pausa Fim' && inicioPausa) {
            const fimPausa = moment(registro.data_hora);
            const duracaoPausa = fimPausa.diff(inicioPausa, 'minutes');
            minutosNoDia -= duracaoPausa;
            inicioPausa = null;
          }
        });
        
        totalMinutosNaSemana += minutosNoDia;
      });
      
      // Calcular horas extras da semana
      const jornadaContratadaMinutosSemanal = jornadaContratadaSemanal * 60;
      const minutosExtrasSemana = Math.max(0, totalMinutosNaSemana - jornadaContratadaMinutosSemanal);
      
      if (minutosExtrasSemana > 0) {
        semanasComHorasExtras.push({
          semana,
          horas_trabalhadas: formatarMinutosEmHoras(totalMinutosNaSemana),
          jornada_contratada: formatarMinutosEmHoras(jornadaContratadaMinutosSemanal),
          horas_extras: formatarMinutosEmHoras(minutosExtrasSemana),
          minutos_extras: minutosExtrasSemana
        });
      }
    });
    
    horasExtrasPorFuncionario.push({
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        departamento: funcionario.departamento ? funcionario.departamento.nome : 'Não atribuído',
        jornada_contratada: jornadaContratadaSemanal
      },
      total_horas_extras: formatarMinutosEmHoras(totalMinutosExtras),
      total_minutos_extras: totalMinutosExtras,
      dias_com_horas_extras: diasComHorasExtras,
      semanas_com_horas_extras: semanasComHorasExtras
    });
  });
  
  return horasExtrasPorFuncionario;
}

// Função auxiliar para calcular dias úteis entre duas datas
function calcularDiasUteis(inicio, fim) {
  let diasUteis = 0;
  let dataAtual = moment(inicio);
  
  while (dataAtual <= fim) {
    // Considerar apenas dias de semana (1 = Segunda, 5 = Sexta)
    const diaDaSemana = dataAtual.day();
    if (diaDaSemana >= 1 && diaDaSemana <= 5) {
      diasUteis++;
    }
    
    dataAtual.add(1, 'day');
  }
  
  return diasUteis;
}

// Função auxiliar para formatar minutos em horas
function formatarMinutosEmHoras(minutos) {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return `${horas}h ${minutosRestantes}m`;
}

module.exports = relatorioController;
