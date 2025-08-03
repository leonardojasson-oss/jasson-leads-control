# 📋 Guia Completo de Deploy

## 🎯 3 Formas Fáceis de Fazer Deploy

### 🥇 **OPÇÃO 1: Vercel (Mais Fácil)**

1. **Acesse**: [vercel.com](https://vercel.com)
2. **Clique**: "Sign up" (criar conta gratuita)
3. **Conecte**: sua conta GitHub
4. **Clique**: "New Project"
5. **Importe**: este código
6. **Deploy**: automático em 2 minutos!

**✅ Vantagens**: Deploy automático, domínio grátis, SSL incluso

---

### 🥈 **OPÇÃO 2: Netlify (Arrastar e Soltar)**

1. **Acesse**: [netlify.com](https://netlify.com)
2. **Crie conta** gratuita
3. **Execute**: `npm run build` no seu computador
4. **Arraste** a pasta `out` para o Netlify
5. **Pronto**: site no ar!

**✅ Vantagens**: Super simples, sem configuração

---

### 🥉 **OPÇÃO 3: Railway (Alternativa)**

1. **Acesse**: [railway.app](https://railway.app)
2. **Conecte**: GitHub
3. **Selecione**: este repositório
4. **Deploy**: automático

---

## 🗄️ **Configurar Banco de Dados (Opcional)**

### Passo 1: Criar Conta Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique "Start your project"
3. Crie conta gratuita

### Passo 2: Criar Projeto
1. Clique "New Project"
2. Escolha nome: "jasson-leads"
3. Defina senha forte
4. Aguarde criação (2-3 minutos)

### Passo 3: Executar SQL
1. Vá em "SQL Editor"
2. Cole o conteúdo de `scripts/create-leads-table.sql`
3. Clique "Run"

### Passo 4: Configurar Variáveis
1. Vá em "Settings" > "API"
2. Copie:
   - Project URL
   - anon public key
3. Configure no seu deploy:
   - `NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui`

---

## 🎯 **Testando o Deploy**

Após o deploy, teste:

1. ✅ **Página carrega** corretamente
2. ✅ **Criar lead** funciona
3. ✅ **Editar lead** funciona
4. ✅ **Filtros** funcionam
5. ✅ **Dashboard** mostra dados

---

## 🆘 **Problemas Comuns**

### ❌ "Build Failed"
- Verifique se todos os arquivos estão presentes
- Execute `npm install` localmente primeiro

### ❌ "Supabase Error"
- Verifique as variáveis de ambiente
- Sistema funciona sem Supabase (modo local)

### ❌ "Page Not Found"
- Aguarde alguns minutos após deploy
- Limpe cache do navegador

---

## 📞 **Precisa de Ajuda?**

Se tiver dificuldades:
1. Tente a **Opção 1 (Vercel)** - é a mais fácil
2. O sistema funciona **sem banco** também
3. Entre em contato para suporte

**🎉 Seu sistema estará online em menos de 10 minutos!**
