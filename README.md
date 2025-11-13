# 🚀 Agenda Colaborativa PWA

Bem-vindo à Agenda Colaborativa! Este é um sistema de agendamento completo, construído do zero como um **Progressive Web App (PWA)**, permitindo sincronização em tempo real entre todos os usuários conectados.

Quando um usuário reserva um horário, ele se torna indisponível instantaneamente para todos os outros. Um administrador pode visualizar e remover agendamentos existentes.

O projeto foi construído com foco em tecnologias fundamentais e sem dependências de serviços externos, usando um backend Node.js com um banco de dados SQL puro (SQLite).

---

## ✨ Funcionalidades

- **Visualização Compartilhada:** Todos os usuários veem a mesma grade de horários com status "Livre" ou "Ocupado".
- **Sincronização em Tempo Real:** Agendamentos e cancelamentos são refletidos instantaneamente em todas as telas abertas, sem a necessidade de recarregar a página, graças ao Socket.io.
- **Reserva de Horário Simples:** Clique em um horário livre, digite seu nome e confirme para agendar.
- **Modo Administrador:** Um seletor na interface ativa o modo admin, permitindo o cancelamento de qualquer agendamento.
- **PWA Completo:** O aplicativo é instalável em dispositivos móveis e desktops, funcionando offline (para visualização) e oferecendo uma experiência de aplicativo nativo.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, Socket.io
- **Banco de Dados:** SQLite (`better-sqlite3`) com SQL puro. O arquivo do banco é criado em `server/database.db`.
- **Frontend:** React, Vite, TailwindCSS
- **PWA:** `vite-plugin-pwa` para geração automática de Service Worker e Manifest.
- **Orquestração:** `concurrently` e `nodemon` para um ambiente de desenvolvimento simplificado.

---

## 🚀 Como Rodar o Projeto (Instruções)

O projeto foi configurado para ser extremamente simples de iniciar.

### 1. Instale as Dependências

Abra o terminal na pasta raiz do projeto e execute o seguinte comando. Ele instalará as dependências tanto do frontend (cliente) quanto do backend (servidor).

```bash
npm install
```

### 2. Inicie a Aplicação

Agora, execute o comando `start`. Ele irá iniciar o servidor backend e o cliente de desenvolvimento simultaneamente.

```bash
npm start
```

O terminal indicará que o servidor está rodando (geralmente na porta `3001`) e o frontend está disponível em uma URL local (geralmente `http://localhost:5173`).

### 3. Teste a Sincronização

- Abra a URL do frontend (`http://localhost:5173`) em **duas ou mais janelas do navegador**.
- Faça um agendamento em uma janela.
- Observe como o horário fica ocupado instantaneamente na outra janela.
- Ative o "Modo Admin" em uma das janelas e remova o agendamento. Ele ficará livre novamente em todas as janelas.

Aproveite sua nova aplicação de agendamento em tempo real!
