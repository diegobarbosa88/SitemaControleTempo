// Funções para interagir com a API do sistema
const API_URL = '/api';

// Função para realizar login
async function realizarLogin(email, senha) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.mensagem || 'Erro ao realizar login');
    }
    
    // Armazenar token e dados do usuário no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.funcionario));
    
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Função para verificar se o usuário está autenticado
async function verificarAutenticacao() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    const response = await fetch(`${API_URL}/auth/verificar`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      return false;
    }
    
    const data = await response.json();
    // Atualizar dados do usuário no localStorage
    localStorage.setItem('usuario', JSON.stringify(data.funcionario));
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

// Função para realizar logout
function realizarLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login.html';
}

// Função para obter dados do usuário logado
function obterUsuarioLogado() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}

// Função para registrar ponto (entrada, saída ou pausa)
async function registrarPonto(tipo, latitude, longitude, local_trabalho_id, observacao, metodo_registro) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/registro-ponto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo,
        latitude,
        longitude,
        local_trabalho_id,
        observacao,
        metodo_registro
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.mensagem || 'Erro ao registrar ponto');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    throw error;
  }
}

// Função para listar registros de ponto
async function listarRegistrosPonto(dataInicio, dataFim) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    let url = `${API_URL}/registro-ponto`;
    
    // Adicionar parâmetros de data se fornecidos
    if (dataInicio || dataFim) {
      url += '?';
      if (dataInicio) {
        url += `data_inicio=${dataInicio}`;
      }
      if (dataFim) {
        url += dataInicio ? `&data_fim=${dataFim}` : `data_fim=${dataFim}`;
      }
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.mensagem || 'Erro ao listar registros de ponto');
    }
    
    return data.registros;
  } catch (error) {
    console.error('Erro ao listar registros de ponto:', error);
    throw error;
  }
}

// Função para obter o status atual do funcionário
async function obterStatusAtual() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    const response = await fetch(`${API_URL}/registro-ponto/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.mensagem || 'Erro ao obter status atual');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter status atual:', error);
    throw error;
  }
}

// Função para obter a localização atual do usuário
function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada pelo navegador'));
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let mensagemErro = 'Erro desconhecido ao obter localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensagemErro = 'Permissão para geolocalização negada';
            break;
          case error.POSITION_UNAVAILABLE:
            mensagemErro = 'Informação de localização indisponível';
            break;
          case error.TIMEOUT:
            mensagemErro = 'Tempo esgotado ao obter localização';
            break;
        }
        
        reject(new Error(mensagemErro));
      }
    );
  });
}

// Exportar funções
window.api = {
  realizarLogin,
  verificarAutenticacao,
  realizarLogout,
  obterUsuarioLogado,
  registrarPonto,
  listarRegistrosPonto,
  obterStatusAtual,
  obterLocalizacao
};
