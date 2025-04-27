# Plano de Testes - Sistema de Controle de Tempo

## 1. Introdução

Este documento descreve o plano de testes para o Sistema de Controle de Tempo. O objetivo é garantir que todas as funcionalidades implementadas estejam operando corretamente e que o sistema atenda aos requisitos especificados.

## 2. Escopo dos Testes

Os testes abrangerão as seguintes áreas do sistema:

1. Autenticação e segurança
2. Registro de entrada/saída
3. Gestão de funcionários
4. Geração de relatórios
5. Interface de usuário e responsividade
6. Desempenho e escalabilidade

## 3. Tipos de Testes

### 3.1 Testes de Funcionalidade

Verificação de que cada funcionalidade do sistema opera conforme esperado.

### 3.2 Testes de Usabilidade

Avaliação da experiência do usuário e facilidade de uso do sistema.

### 3.3 Testes de Responsividade

Verificação de que o sistema funciona adequadamente em diferentes dispositivos e tamanhos de tela.

### 3.4 Testes de Desempenho

Avaliação do tempo de resposta e capacidade de processamento do sistema.

## 4. Casos de Teste

### 4.1 Autenticação e Segurança

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| AT01 | Login com credenciais válidas | 1. Acessar página de login<br>2. Inserir email e senha válidos<br>3. Clicar em "Entrar" | Usuário é autenticado e redirecionado para o dashboard |
| AT02 | Login com credenciais inválidas | 1. Acessar página de login<br>2. Inserir email e senha inválidos<br>3. Clicar em "Entrar" | Mensagem de erro é exibida e usuário permanece na página de login |
| AT03 | Logout | 1. Clicar no botão de logout | Usuário é deslogado e redirecionado para a página de login |
| AT04 | Acesso a página protegida sem autenticação | 1. Tentar acessar uma página protegida sem estar autenticado | Usuário é redirecionado para a página de login |
| AT05 | Acesso a funcionalidade restrita | 1. Autenticar como usuário com nível de acesso "Funcionário"<br>2. Tentar acessar funcionalidade restrita a "Admin" | Acesso é negado com mensagem apropriada |

### 4.2 Registro de Entrada/Saída

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| RE01 | Registrar entrada | 1. Acessar página de registro de ponto<br>2. Clicar no botão "Entrada" | Registro de entrada é criado e status é atualizado para "Trabalhando" |
| RE02 | Registrar saída | 1. Acessar página de registro de ponto<br>2. Clicar no botão "Saída" | Registro de saída é criado e status é atualizado para "Fora do Trabalho" |
| RE03 | Registrar pausa | 1. Acessar página de registro de ponto<br>2. Clicar no botão "Pausa" | Registro de pausa é criado e status é atualizado para "Em Pausa" |
| RE04 | Retornar da pausa | 1. Acessar página de registro de ponto<br>2. Clicar no botão "Retornar" | Registro de fim de pausa é criado e status é atualizado para "Trabalhando" |
| RE05 | Verificar geolocalização | 1. Acessar página de registro de ponto<br>2. Permitir acesso à localização<br>3. Registrar ponto | Coordenadas de geolocalização são capturadas e armazenadas com o registro |

### 4.3 Gestão de Funcionários

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| GF01 | Listar funcionários | 1. Acessar página de gestão de funcionários | Lista de funcionários é exibida corretamente |
| GF02 | Criar novo funcionário | 1. Acessar página de gestão de funcionários<br>2. Clicar em "Novo Funcionário"<br>3. Preencher formulário<br>4. Clicar em "Salvar" | Novo funcionário é criado e aparece na lista |
| GF03 | Editar funcionário | 1. Acessar página de gestão de funcionários<br>2. Clicar no ícone de edição de um funcionário<br>3. Modificar dados<br>4. Clicar em "Salvar" | Dados do funcionário são atualizados |
| GF04 | Excluir funcionário | 1. Acessar página de gestão de funcionários<br>2. Clicar no ícone de exclusão de um funcionário<br>3. Confirmar exclusão | Funcionário é removido da lista |
| GF05 | Filtrar funcionários | 1. Acessar página de gestão de funcionários<br>2. Utilizar filtros (departamento, status, tag) | Lista é filtrada de acordo com os critérios selecionados |
| GF06 | Associar tag a funcionário | 1. Acessar página de gestão de funcionários<br>2. Editar funcionário<br>3. Adicionar tag<br>4. Salvar | Tag é associada ao funcionário |

### 4.4 Geração de Relatórios

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| GR01 | Gerar relatório de horas trabalhadas | 1. Acessar página de relatórios<br>2. Selecionar período<br>3. Clicar em "Gerar Relatório" | Relatório de horas trabalhadas é exibido corretamente |
| GR02 | Gerar relatório de presença | 1. Acessar página de relatórios<br>2. Selecionar aba "Presença"<br>3. Selecionar período<br>4. Clicar em "Gerar Relatório" | Relatório de presença é exibido corretamente |
| GR03 | Gerar relatório de horas extras | 1. Acessar página de relatórios<br>2. Selecionar aba "Horas Extras"<br>3. Selecionar período<br>4. Clicar em "Gerar Relatório" | Relatório de horas extras é exibido corretamente |
| GR04 | Filtrar relatório por departamento | 1. Acessar página de relatórios<br>2. Selecionar departamento<br>3. Gerar relatório | Relatório é filtrado pelo departamento selecionado |
| GR05 | Filtrar relatório por tag | 1. Acessar página de relatórios<br>2. Selecionar tag<br>3. Gerar relatório | Relatório é filtrado pela tag selecionada |
| GR06 | Exportar relatório | 1. Gerar um relatório<br>2. Clicar em "Exportar" | Relatório é exportado no formato correto |

### 4.5 Interface de Usuário e Responsividade

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| UI01 | Visualização em desktop | 1. Acessar o sistema em um navegador desktop | Interface é exibida corretamente |
| UI02 | Visualização em tablet | 1. Acessar o sistema em um tablet ou emulador | Interface se adapta ao tamanho da tela |
| UI03 | Visualização em smartphone | 1. Acessar o sistema em um smartphone ou emulador | Interface se adapta ao tamanho da tela |
| UI04 | Navegação entre páginas | 1. Navegar entre as diferentes páginas do sistema | Navegação funciona corretamente sem erros |
| UI05 | Feedback visual | 1. Realizar ações que geram feedback (ex: salvar, excluir) | Feedback visual é exibido corretamente |

### 4.6 Desempenho e Escalabilidade

| ID | Descrição | Passos | Resultado Esperado |
|----|-----------|--------|-------------------|
| DE01 | Tempo de resposta para login | 1. Realizar login | Tempo de resposta menor que 2 segundos |
| DE02 | Tempo de resposta para registro de ponto | 1. Registrar ponto | Tempo de resposta menor que 2 segundos |
| DE03 | Tempo de resposta para geração de relatório | 1. Gerar relatório com grande volume de dados | Tempo de resposta menor que 5 segundos |
| DE04 | Carga de múltiplos usuários | 1. Simular acesso de múltiplos usuários simultaneamente | Sistema mantém desempenho aceitável |

## 5. Ambiente de Testes

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, Tablet, Smartphone
- **Sistemas Operacionais**: Windows, macOS, Android, iOS

## 6. Critérios de Aceitação

- Todos os testes de funcionalidade devem passar
- Pelo menos 90% dos testes de usabilidade devem passar
- Interface deve ser responsiva em todos os dispositivos testados
- Tempo de resposta deve estar dentro dos limites especificados

## 7. Cronograma de Testes

- Testes de Funcionalidade: 2 dias
- Testes de Usabilidade: 1 dia
- Testes de Responsividade: 1 dia
- Testes de Desempenho: 1 dia
- Correção de bugs e reteste: 2 dias

## 8. Responsabilidades

- Execução dos testes: Equipe de QA
- Correção de bugs: Equipe de desenvolvimento
- Aprovação final: Gerente de projeto

## 9. Relatório de Testes

Após a conclusão dos testes, será gerado um relatório contendo:

- Resumo dos testes executados
- Resultados dos testes (passou/falhou)
- Lista de bugs encontrados
- Recomendações para correção
- Conclusão sobre a qualidade do sistema
