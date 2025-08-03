#!/bin/bash

echo "🚀 Deploy do Sistema de Leads - Jasson Oliveira & Co"
echo "=================================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o Node.js primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo "✅ npm encontrado: $(npm --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Build do projeto
echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Faça upload da pasta para seu servidor"
    echo "2. Execute 'npm start' no servidor"
    echo "3. Configure o Supabase (opcional)"
    echo ""
    echo "🌐 Ou use um serviço de deploy:"
    echo "- Vercel: https://vercel.com"
    echo "- Netlify: https://netlify.com"
    echo "- Railway: https://railway.app"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi
