
<div align="center">
  <img src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500" alt="AgendaLink 2.0 Logo" width="100"/>
  <h1>AgendaLink 2.0</h1>
  <p>✨ <strong>Uma aplicação web PWA completa para profissionais de beleza, com painel administrativo avançado e agendamento inteligente para clientes.</strong> ✨</p>
  <p>
    <img src="https://img.shields.io/badge/React-18.2.0-blue?logo=react" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.0.4-blue?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.3.3-blue?logo=tailwind-css" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/PWA-Ready-green?logo=pwa" alt="PWA Ready">
  </p>
</div>

## 🌟 Visão Geral

AgendaLink 2.0 é uma solução "tudo-em-um" projetada para modernizar a gestão de salões de beleza, barbearias e estúdios. A plataforma oferece uma experiência de usuário fluida para clientes e um conjunto poderoso de ferramentas para administradores, tudo em uma aplicação web progressiva (PWA) rápida e responsiva.

## 🎨 Screenshot

<img src="https://i.imgur.com/kF7dM8x.png" alt="Screenshot do Aplicativo AgendaLink 2.0" width="100%"/>

## ✨ Funcionalidades Principais

### 👤 Para Clientes
- **Catálogo de Serviços:** Navegue por serviços com filtros, busca e detalhes completos.
- **Agendamento Inteligente:** Escolha datas e horários disponíveis em tempo real, sem conflitos.
- **Promoções e Descontos:** Aplique códigos promocionais e aproveite ofertas com contagem regressiva.
- **Pagamentos Flexíveis:** Simulação de pagamento via PIX Online ou diretamente no local.
- **Área do Cliente:** Acesse o histórico de agendamentos, gerencie o perfil e altere a senha.
- **Design Mobile-First:** Experiência otimizada para acesso via smartphones.

### 💼 Para Administradores
- **Dashboard Analítico:** Métricas de receita, clientes e agendamentos com gráficos interativos.
- **Gestão de Agendamentos:** Aprove, cancele, finalize e edite agendamentos com facilidade.
- **Gerenciador de Serviços:** Crie, edite e exclua serviços (CRUD completo) com opção de destaque.
- **Gerenciador de Clientes:** Visualize o histórico de clientes e adicione anotações privadas.
- **Sistema de Promoções:** Crie campanhas de desconto (percentual ou fixo) com regras de validade, limites de uso e códigos promocionais.
- **Personalização (Branding):** Altere o nome, logo e paleta de cores da aplicação.
- **Modo Manutenção:** Ative um aviso de manutenção para os clientes.
- **Backup e Restauração:** Exporte e importe todos os dados da aplicação em formato JSON.
- **Reset de Senha:** Gere senhas aleatórias para clientes que esqueceram o acesso.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Gráficos:** Recharts
- **Estado:** React Context API
- **Persistência:** LocalStorage (para simulação de backend)

## 🚀 Começando

Siga estas instruções para obter uma cópia do projeto e executá-la em sua máquina local para desenvolvimento e testes.

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação
1. Clone o repositório:
   ```sh
   git clone https://github.com/seu-usuario/agendalink-2.0.git
   ```
2. Navegue até o diretório do projeto:
   ```sh
   cd agendalink-2.0
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```sh
   npm start
   ```
A aplicação estará disponível em `http://localhost:3000`.

## 💻 Como Usar

A aplicação vem com dados de teste para facilitar a exploração das funcionalidades. Use as seguintes credenciais para fazer login:

- **Login de Administrador:**
  - **Email:** `admin@agendalink.com`
  - **Senha:** `admin`

- **Login de Cliente:**
  - **Email:** `cliente@agendalink.com`
  - **Senha:** `123`

Como administrador, você terá acesso ao "Painel Admin", de onde poderá gerenciar toda a aplicação. Você também pode alternar para a visão do cliente através do botão no canto inferior direito.

## 📁 Estrutura de Arquivos

O projeto é organizado de forma modular para facilitar a manutenção e escalabilidade.

```
/
├── public/
│   ├── manifest.json
│   └── index.html
├── src/
│   ├── components/
│   │   ├── admin/         # Componentes do painel administrativo
│   │   ├── auth/          # Componentes de autenticação (Login)
│   │   ├── client/        # Componentes da visão do cliente
│   │   └── common/        # Componentes reutilizáveis (Header, Icons)
│   ├── App.tsx            # Componente raiz e gerenciador de estado global
│   ├── constants.ts       # Dados iniciais e mockados
│   ├── index.tsx          # Ponto de entrada da aplicação React
│   └── types.ts           # Definições de tipos TypeScript
└── README.md
```

## 🗺️ Roadmap (Melhorias Futuras)

- [ ] Implementar backend real com Node.js/Express.
- [ ] Trocar LocalStorage por um banco de dados (PostgreSQL/MongoDB).
- [ ] Sistema de autenticação com JWT (Access/Refresh Tokens).
- [ ] Integração real com API de pagamentos PIX.
- [ ] Notificações push para lembretes de agendamento e promoções.
- [ ] Testes unitários e de integração.
- [ ] Scripts de deploy e CI/CD.

---

Feito com ❤️ para simplificar a vida dos profissionais da beleza.
