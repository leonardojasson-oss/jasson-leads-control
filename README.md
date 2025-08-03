# 🚀 Sistema de Controle de Leads - Jasson Oliveira & Co

Sistema completo de gestão de leads e vendas desenvolvido para a Jasson Oliveira & Co.

## ✨ Funcionalidades

- 📋 **Lista de Leads**: Visualização completa com filtros e busca
- 📊 **Dashboard Analytics**: KPIs e métricas de performance
- 💰 **Controle de Comissões**: Gestão de comissões SDR e Closer
- 📈 **Acompanhamento de Vendas**: Pipeline de vendas detalhado
- 🔄 **Preenchimento Automático**: Parser inteligente de dados
- 💾 **Persistência de Dados**: Supabase + fallback localStorage

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados
- **Radix UI** - Componentes acessíveis

## 🚀 Deploy Rápido

### Opção 1: Vercel (Recomendado)
1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu GitHub
3. Importe este projeto
4. Deploy automático!

### Opção 2: Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta do projeto
3. Deploy instantâneo!

## 🗄️ Configuração do Banco (Opcional)

Para persistência permanente, configure o Supabase:

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Execute o SQL em `scripts/create-leads-table.sql`
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📱 Como Usar

1. **Adicionar Lead**: Clique em "Novo Lead"
2. **Preenchimento Automático**: Cole dados do lead no campo especial
3. **Editar/Excluir**: Use os botões na lista
4. **Filtrar**: Use a busca e filtros por status
5. **Analytics**: Veja métricas na aba Dashboard

## 🎯 Status do Sistema

- ✅ **Modo Local**: Funciona sem configuração (dados no navegador)
- ✅ **Modo Supabase**: Dados persistentes na nuvem
- ✅ **Modo Híbrido**: Fallback automático

## 📞 Suporte

Sistema desenvolvido especialmente para Jasson Oliveira & Co.
Para suporte, entre em contato com a equipe de desenvolvimento.
