# AgendaLink 2.0 🚀

**Sua solução completa e moderna para gestão de beleza e agendamentos, agora como um Progressive Web App (PWA) de alta performance!**

![Banner de Tecnologia](https://camo.githubusercontent.com/820e646a6e2fa4116569b43986df8b44e2d504a28b86f5df41e8a1fc577b812a/68747470733a2f2f7777772e696e666f6d6f6e65792e636f6d2e62722f77702d636f6e74656e742f75706c6f6164732f323031392f30362f7465636e6f6c6f6769612d322e6a70673f773d393030267175616c6974793d37302673747269703d616c6c)

---

## 📝 Sobre o Projeto

O AgendaLink 2.0 é uma aplicação web completa, projetada para profissionais da beleza que buscam otimizar a gestão de seus negócios. A plataforma oferece um painel administrativo robusto e uma interface de agendamento inteligente e intuitiva para clientes.

Totalmente transformado em um **Progressive Web App**, o AgendaLink 2.0 combina a acessibilidade da web com a experiência de um aplicativo nativo, funcionando perfeitamente em celulares, tablets e desktops, com dados salvos em um **banco de dados SQLite local** para uma experiência offline superior.

---

## ✨ Funcionalidades Principais

O AgendaLink 2.0 é repleto de funcionalidades para atender tanto o administrador do negócio quanto o cliente final.

### 👩‍💼 Para Clientes:
- **Catálogo de Serviços Detalhado:** Explore serviços com descrições, preços e durações.
- **Agendamento Inteligente:** Escolha a data e o horário com base na disponibilidade em tempo real.
- **Promoções e Descontos:** Aplique códigos promocionais e aproveite ofertas especiais.
- **Pagamento via PIX:** Gere QR Codes para pagamento direto no app.
- **Perfil Pessoal:** Acompanhe seu histórico de agendamentos e gerencie suas informações.

### 👑 Para Administradores:
- **Dashboard Analítico:** Visualize a saúde do seu negócio com gráficos de receita e serviços populares.
- **Gestão de Agendamentos:** Confirme, cancele e finalize agendamentos com facilidade.
- **Gerenciador de Serviços e Clientes:** Cadastre, edite e remova serviços e clientes.
- **Criação de Promoções:** Crie campanhas de desconto (percentual ou fixo) com limites de uso e validade.
- **Personalização (Branding):** Altere o nome, o logo e as cores do aplicativo para combinar com sua marca.
- **Modo Manutenção Avançado:** Ative um modo que bloqueia o acesso para clientes, enquanto administradores podem continuar a usar o sistema. Inclui uma página de manutenção personalizável com um **login secreto para administradores** (clique 5 vezes no logo/ícone). Um banner de alerta é exibido para o admin para evitar que o modo seja esquecido ativo.
- **Gerenciamento de Dados Completo:** Faça backup de todos os dados da aplicação com a função de **Exportar**. Restaure um backup a qualquer momento com a função de **Importar**. Realize uma **limpeza completa (hard reset)** para apagar todos os dados do navegador, caches e service worker.

---

## 📲 Experiência PWA (Progressive Web App)

Leve seu negócio para o próximo nível com funcionalidades de aplicativos nativos:

- **Instalável:** Adicione o AgendaLink à tela inicial do seu celular ou desktop com um único clique.
- **Funciona Offline com Banco de Dados Real:** O aplicativo carrega instantaneamente e funciona offline de forma robusta, salvando todos os dados em um banco de dados **SQLite** no navegador. Um **indicador visual** informa ao usuário quando a conexão é perdida.
- **Sincronização em Tempo Real entre Abas:** Abra o aplicativo em várias abas e veja as alterações refletidas instantaneamente em todas elas, sem precisar recarregar a página.
- **Notificações Push:** Envie lembretes de agendamento e promoções diretamente para os dispositivos dos seus clientes (requer backend).
- **Atalhos Rápidos:** Acesse seções como "Agendar" e "Minha Conta" diretamente do ícone do app.
- **Experiência Imersiva:** Uma vez instalado, o app roda em tela cheia, sem a barra de endereço do navegador.
- **Compartilhamento Nativo:** Clientes podem compartilhar promoções facilmente usando a função de compartilhamento do dispositivo.

---

## 🛠️ Tecnologias Utilizadas

- **React:** Para uma interface de usuário reativa e moderna.
- **TypeScript:** Para um código mais seguro e manutenível.
- **SQLite (via sql.js):** Para um banco de dados robusto e confiável que funciona 100% offline no navegador, substituindo o `localStorage`.
- **Tailwind CSS:** Para estilização rápida e responsiva.
- **Recharts:** Para a criação de gráficos interativos no dashboard.
- **Service Workers:** Para habilitar o cache, o funcionamento offline e as notificações.
- **Web App Manifest:** Para garantir a experiência de instalação e a aparência nativa.

---

## 🚀 Como Rodar o Projeto Localmente

Rodar o sistema na sua máquina é muito simples e rápido. Você só precisa ter o **Node.js** instalado.

Siga os passos abaixo:

1.  **Crie uma Pasta para o Projeto:**
    Crie uma nova pasta no seu computador e salve todos os arquivos do projeto dentro dela.

2.  **Abra o Terminal:**
    Abra o terminal do seu sistema (PowerShell, CMD, Terminal do VS Code, etc.) e navegue até a pasta que você criou no passo anterior.

    ```bash
    cd caminho/para/a/pasta/do-projeto
    ```

3.  **Inicie o Servidor de Desenvolvimento (Método Rápido):**
    Execute o seguinte comando no terminal. Ele irá baixar e rodar um servidor de desenvolvimento moderno (Vite) para você, sem precisar instalar nada permanentemente.

    ```bash
    npx vite
    ```

4.  **Abra no Navegador:**
    Após executar o comando, o terminal irá mostrar uma URL local. Copie e cole no seu navegador. Geralmente, será algo como:

    `http://localhost:5173`

    Pronto! O sistema estará rodando na sua máquina.

### Se o Comando Acima Falhar (Método Alternativo e mais Robusto)

Às vezes, o comando `npx` pode falhar por problemas de cache ou permissão. Se isso acontecer, siga estes passos para uma instalação local mais garantida:

1.  **Inicialize um projeto Node.js:**
    Ainda no terminal, dentro da pasta do projeto, execute:
    ```bash
    npm init -y
    ```
    Isso criará um arquivo `package.json`.

2.  **Instale o Vite localmente:**
    Este comando vai criar uma pasta `node_modules` e instalar o Vite dentro dela, especificamente para este projeto.
    ```bash
    npm install vite
    ```

3.  **Rode o Vite Novamente:**
    Agora, o mesmo comando de antes funcionará, pois ele encontrará o Vite que acabamos de instalar.
    ```bash
    npx vite
    ```

---

## 🚀 Como Usar

A aplicação simula um ambiente completo sem a necessidade de um backend. Todos os dados são salvos em um banco de dados SQLite local no seu navegador, garantindo que tudo funcione offline.

### Visão do Cliente
- **Login:** Use as credenciais `cliente@agendalink.com` / `123`.
- **Navegação:** Use a barra de navegação inferior para explorar serviços, ver promoções e acessar seu perfil.
- **Agendamento:** Escolha um serviço, selecione data/hora e confirme.
- **Instalação:** Clique no botão **"Instalar App"** que aparece no canto da tela para adicionar o AgendaLink à sua tela inicial.

### Painel do Administrador
- **Login:** Use as credenciais `admin@admin` / `admin`.
- **Acesso:** Após o login, você verá o painel administrativo.
- **Alternar Visão:** Um botão flutuante permite que você alterne entre a visão de administrador e a de cliente para testar a experiência completa.