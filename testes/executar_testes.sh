#!/bin/bash

# Script para executar todos os testes do Sistema de Controle de Tempo

echo "Iniciando testes do Sistema de Controle de Tempo..."
echo "===================================================="

# Verificar se as dependências estão instaladas
echo "Verificando dependências..."
npm install mocha chai supertest puppeteer --save-dev

# Iniciar o servidor em modo de teste
echo "Iniciando servidor em modo de teste..."
NODE_ENV=test node src/index.js &
SERVER_PID=$!

# Aguardar o servidor iniciar
echo "Aguardando o servidor iniciar..."
sleep 5

# Executar testes funcionais
echo "Executando testes funcionais..."
npx mocha testes/testes_funcionais.js --timeout 10000

# Executar testes de usabilidade
echo "Executando testes de usabilidade..."
npx mocha testes/testes_usabilidade.js --timeout 10000

# Executar testes de desempenho
echo "Executando testes de desempenho..."
npx mocha testes/testes_desempenho.js --timeout 10000

# Encerrar o servidor
echo "Encerrando servidor de teste..."
kill $SERVER_PID

echo "===================================================="
echo "Testes concluídos!"
