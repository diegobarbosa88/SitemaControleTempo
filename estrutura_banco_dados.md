# Estrutura do Banco de Dados - Sistema de Controle de Tempo

## Visão Geral
Este documento descreve a estrutura do banco de dados para o Sistema de Controle de Tempo, incluindo as tabelas principais, seus campos e relacionamentos.

## Diagrama de Entidade-Relacionamento

```
Funcionários (1) --- (N) Registros de Ponto
Funcionários (N) --- (N) Turnos
Departamentos (1) --- (N) Funcionários
Tags (N) --- (N) Funcionários
Locais de Trabalho (1) --- (N) Registros de Ponto
```

## Tabelas

### 1. Funcionários (funcionarios)
Armazena informações sobre os funcionários da empresa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do funcionário (PK) |
| nome | VARCHAR(100) | Nome completo do funcionário |
| email | VARCHAR(100) | Email do funcionário (único) |
| senha | VARCHAR(255) | Senha criptografada |
| telefone | VARCHAR(20) | Número de telefone |
| cargo | VARCHAR(50) | Cargo do funcionário |
| departamento_id | INT | Departamento ao qual pertence (FK) |
| data_contratacao | DATE | Data de contratação |
| status | ENUM | Ativo, Inativo, Férias, Licença |
| jornada_contratada | INT | Horas de trabalho contratadas por semana |
| tipo_autenticacao | ENUM | Biométrico, QR, PIN, Facial |
| codigo_pin | VARCHAR(10) | Código PIN para autenticação (se aplicável) |
| foto | VARCHAR(255) | Caminho para a foto do funcionário |
| nivel_acesso | ENUM | Admin, Gestor, Funcionário |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 2. Departamentos (departamentos)
Armazena informações sobre os departamentos da empresa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do departamento (PK) |
| nome | VARCHAR(50) | Nome do departamento |
| descricao | TEXT | Descrição do departamento |
| responsavel_id | INT | ID do funcionário responsável (FK) |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 3. Registros de Ponto (registros_ponto)
Armazena os registros de entrada e saída dos funcionários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do registro (PK) |
| funcionario_id | INT | ID do funcionário (FK) |
| tipo | ENUM | Entrada, Saída, Pausa Início, Pausa Fim |
| data_hora | DATETIME | Data e hora do registro |
| metodo_registro | ENUM | Web, Mobile, Tablet, Biométrico, QR, PIN, Facial |
| latitude | DECIMAL(10,8) | Latitude da localização (se disponível) |
| longitude | DECIMAL(11,8) | Longitude da localização (se disponível) |
| local_trabalho_id | INT | ID do local de trabalho (FK) |
| ip_dispositivo | VARCHAR(45) | Endereço IP do dispositivo |
| dispositivo | VARCHAR(100) | Informações sobre o dispositivo |
| observacao | TEXT | Observações adicionais |
| validado | BOOLEAN | Indica se o registro foi validado |
| validado_por | INT | ID do funcionário que validou (FK) |
| data_validacao | DATETIME | Data da validação |

### 4. Turnos (turnos)
Armazena informações sobre os turnos de trabalho.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do turno (PK) |
| nome | VARCHAR(50) | Nome do turno (ex: Manhã, Tarde, Noite) |
| hora_inicio | TIME | Hora de início do turno |
| hora_fim | TIME | Hora de fim do turno |
| dias_semana | VARCHAR(20) | Dias da semana (ex: 1,2,3,4,5 para seg-sex) |
| cor | VARCHAR(7) | Código de cor para interface (ex: #FF5733) |
| descricao | TEXT | Descrição do turno |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 5. Atribuição de Turnos (atribuicao_turnos)
Relaciona funcionários e turnos (N:N).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único da atribuição (PK) |
| funcionario_id | INT | ID do funcionário (FK) |
| turno_id | INT | ID do turno (FK) |
| data_inicio | DATE | Data de início da atribuição |
| data_fim | DATE | Data de fim da atribuição (null para indefinido) |
| recorrente | BOOLEAN | Indica se é uma atribuição recorrente |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 6. Tags (tags)
Armazena tags para categorizar funcionários por cliente ou projeto.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único da tag (PK) |
| nome | VARCHAR(50) | Nome da tag |
| descricao | TEXT | Descrição da tag |
| cor | VARCHAR(7) | Código de cor para interface (ex: #FF5733) |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 7. Atribuição de Tags (atribuicao_tags)
Relaciona funcionários e tags (N:N).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único da atribuição (PK) |
| funcionario_id | INT | ID do funcionário (FK) |
| tag_id | INT | ID da tag (FK) |
| data_inicio | DATE | Data de início da atribuição |
| data_fim | DATE | Data de fim da atribuição (null para indefinido) |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 8. Locais de Trabalho (locais_trabalho)
Armazena informações sobre os locais de trabalho permitidos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do local (PK) |
| nome | VARCHAR(100) | Nome do local |
| endereco | TEXT | Endereço completo |
| latitude | DECIMAL(10,8) | Latitude da localização |
| longitude | DECIMAL(11,8) | Longitude da localização |
| raio_permitido | INT | Raio em metros permitido para registro |
| ativo | BOOLEAN | Indica se o local está ativo |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 9. Relatórios (relatorios)
Armazena configurações de relatórios salvos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único do relatório (PK) |
| nome | VARCHAR(100) | Nome do relatório |
| descricao | TEXT | Descrição do relatório |
| tipo | ENUM | Horas Trabalhadas, Ausências, Atrasos, Turnos, Personalizado |
| filtros | TEXT | Filtros em formato JSON |
| criado_por | INT | ID do funcionário que criou (FK) |
| programacao | VARCHAR(50) | Programação de execução (se recorrente) |
| formato_saida | ENUM | PDF, Excel, CSV |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### 10. Configurações (configuracoes)
Armazena configurações gerais do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único da configuração (PK) |
| chave | VARCHAR(50) | Nome da configuração |
| valor | TEXT | Valor da configuração |
| descricao | TEXT | Descrição da configuração |
| data_atualizacao | DATETIME | Data da última atualização |

## Índices e Chaves Estrangeiras

### Índices
- funcionarios: email (UNIQUE)
- registros_ponto: (funcionario_id, data_hora)
- atribuicao_turnos: (funcionario_id, turno_id, data_inicio)
- atribuicao_tags: (funcionario_id, tag_id)

### Chaves Estrangeiras
- funcionarios.departamento_id → departamentos.id
- departamentos.responsavel_id → funcionarios.id
- registros_ponto.funcionario_id → funcionarios.id
- registros_ponto.local_trabalho_id → locais_trabalho.id
- registros_ponto.validado_por → funcionarios.id
- atribuicao_turnos.funcionario_id → funcionarios.id
- atribuicao_turnos.turno_id → turnos.id
- atribuicao_tags.funcionario_id → funcionarios.id
- atribuicao_tags.tag_id → tags.id
- relatorios.criado_por → funcionarios.id

## Considerações de Implementação
- Todos os timestamps devem ser armazenados em UTC
- Senhas devem ser armazenadas com hash seguro (bcrypt ou similar)
- Campos de geolocalização devem ter precisão suficiente para verificação de localização
- Considerar particionamento da tabela registros_ponto por data para melhor desempenho
- Implementar soft delete para registros importantes (flag de exclusão em vez de remoção física)
