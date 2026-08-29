# 📺 Signage 24h — Plataforma de Digital Signage & Mídia Indoor

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL_15+-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 🎯 Sobre o Projeto

O **Signage 24h (Adboard)** é uma solução completa e robusta de **Digital Signage (Publicidade Digital Indoor)** projetada para operação autônoma e contínua (24 horas por dia, 7 dias por semana) em tablets e displays Android.

### 🚗 Casos de Uso
- **Veículos de Aplicativo & Táxis:** Displays instalados nos encostos de cabeça dos bancos dianteiros, exibindo vídeos e imagens para passageiros com segmentação geográfica ou de frota.
- **Varejo e Pontos de Venda (PDV):** Vitrines digitais, totens interativos e telas informativas em lojas físicas.
- **Recepções e Lobbies:** Exibição de avisos corporativos, promoções e conteúdos institucionais em hotéis, clínicas e condomínios empresariais.
- **Monetização de Mídia:** Gestão de anunciantes, controle de tempo de tela e auditoria de visualizações por meio de métricas de reprodução (*play count*).

---

## 🏛️ Arquitetura do Sistema

O ecossistema é composto por três pilares integrados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (Backend & BaaS)                         │
│  • PostgreSQL 15+ (Tabelas: ads, screens, groups, ad_groups, settings)      │
│  • Row Level Security (RLS) & RPCs Seguras (SET search_path = '')          │
│  • Storage (Bucket público "ad-media" para streaming de vídeos e fotos)     │
│  • Authentication (Gestão segura de administradores com JWT)                │
│  • Criptografia (Hash SHA-256 para PIN de liberação do modo quiosque)      │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│        MOBILE PLAYER (mobile/)        │ │        PAINEL WEB (admin/)        │
│  • Roda em loop 24/7 no tablet        │ │  • Gestão de conteúdos e mídias   │
│  • Pareamento instantâneo via QR/Code │ │  • Segmentação por grupos/frotas  │
│  • Modo Kiosk Nativo (Device Owner)   │ │  • Monitoramento Online/Offline   │
│  • Cache local & Fallback offline     │ │  • Configuração do PIN de quiosque│
│  • KeepAwake (tela não desliga)       │ │  • Métricas de reprodução (plays) │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 🛠️ Stacks Tecnológicas

### 📱 1. Player Mobile (`mobile/`)
- **React Native 0.86 & Expo SDK 57**: Base para performance nativa.
- **`expo-video`**: Reprodução de vídeo em alta performance com aceleração de hardware (`TextureView`), sem controles visíveis e com *caching* automático.
- **`expo-image`**: Renderização ultra-rápida de imagens com cache inteligente em memória e em disco (`memory-disk`).
- **Módulo Nativo Kiosk (`modules/kiosk`)**: Módulo customizado em Kotlin para integração com Android Device Owner (`LockTaskMode`), bloqueando botões físicos/virtuais de sistema (Home, Voltar, Visão Geral) e barra de status.
- **`expo-keep-awake`**: Garante que o display nunca entre em modo de suspensão/tela preta.
- **`react-native-qrcode-svg`**: Geração dinâmica do QR Code de pareamento na tela de boas-vindas do tablet.
- **`@react-native-async-storage/async-storage`**: Persistência do código de pareamento no dispositivo.
- **EAS Build**: Pipeline de compilação na nuvem para APK (instalação direta) e AAB (Google Play).

### 💻 2. Painel Administrativo Web (`admin/`)
- **React 19 & TypeScript**: Interface reativa, modular e com tipagem estrita.
- **Vite 8**: Build otimizado e desenvolvimento instantâneo (HMR).
- **React Router DOM v7**: Roteamento client-side em SPA.
- **Lucide React**: Biblioteca de ícones modernos e consistentes.
- **Oxlint**: Análise estática e linting de alta velocidade.
- **Vercel / Netlify**: Hospedagem otimizada com rewrites configurados (`vercel.json` e `_redirects`).

### 🗄️ 3. Backend & Banco de Dados (`supabase/`)
- **PostgreSQL 15+**: Banco de dados relacional com integridade referencial.
- **Row Level Security (RLS)**: Isolamento de dados garantindo que conexões anônimas apenas visualizem anúncios ativos.
- **RPCs / Stored Procedures**: Funções PL/pgSQL blindadas com `SECURITY DEFINER` e `SET search_path = ''` (`verify_screen`, `ping_screen`, `increment_ad_play`, `get_playlist`).
- **Supabase Storage**: Bucket `ad-media` com políticas de upload restritas a usuários autenticados e leitura pública para os players.

---

## 🖥️ Telas e Funcionalidades

### 📱 Aplicativo Mobile (Player para Tablets)

| Tela / Componente | Descrição |
|---|---|
| **Tela de Pareamento (`PairingScreen.tsx`)** | Exibe um código alfanumérico aleatório de 6 caracteres (ex: `TL7FCL`) e um QR Code. Realiza polling ao Supabase a cada 5s aguardando autorização no painel admin. |
| **Tela de Reprodução (`PlayerScreen.tsx`)** | Reproduz a playlist de forma contínua em tela cheia. Imagens utilizam duração customizada (segundos) e vídeos utilizam sua duração natural. Sincroniza a playlist a cada 60s e envia batimento (*heartbeat*). |
| **Hotspot de Segurança Oculto** | Toque rápido de 5 vezes no canto inferior direito ou pressione o botão Voltar do hardware para solicitar o PIN de saída. |
| **Diálogo de Desbloqueio (`PinDialog.tsx`)** | Teclado numérico na tela para digitação do PIN de segurança (6 dígitos) com validação de hash SHA-256 local antes de liberar a saída do app. |

---

### 💻 Painel Administrativo Web

| Tela / Módulo | Funcionalidades |
|---|---|
| **Login (`Login.tsx`)** | Autenticação administrativa com e-mail e senha via Supabase Auth. |
| **Conteúdos / Playlist (`ContentManager.tsx`)** | • Upload direto de fotos e vídeos para o Supabase Storage.<br>• Definição do tempo de exibição para imagens.<br>• Reordenação da playlist com setas de prioridade (cima/baixo).<br>• Ativação/desativação imediata de anúncios.<br>• Visualização do contador total de reproduções (*play count*). |
| **Grupos (`GroupManager.tsx`)** | Criação, edição e exclusão de grupos para segmentação geográfica ou de frotas (ex: *Lobby*, *Carros VIP*, *Restaurantes*). |
| **Telas (`ScreenManager.tsx`)** | • Registro de novos tablets inserindo o código de 6 caracteres gerado pelo app.<br>• Atribuição de nome amigável ao dispositivo (ex: *Tablet Carro 01*).<br>• Vinculação da tela a um Grupo específico.<br>• Monitoramento em tempo real do status **Online/Offline** baseado no último heartbeat recebido. |
| **Configurações (`SettingsPanel.tsx`)** | Definição e alteração do PIN de segurança de 6 dígitos para saída do modo quiosque nos tablets (armazenado apenas na forma de hash criptográfico). |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 LTS ou superior)
- [NPM](https://www.npmjs.com/)
- Conta gratuita no [Supabase](https://supabase.com)
- Conta no [Expo](https://expo.dev) (para compilar APKs com EAS Build)

---

### 1. Configuração do Backend (Supabase)

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** do projeto e execute todo o conteúdo do arquivo [`supabase/migrations.sql`](file:///c:/Users/Victor%20ED/Desktop/Projetos/Fenix%20comunica%C3%A7%C3%B5es/adboard/supabase/migrations.sql).
3. Vá em **Storage > Buckets**, crie o bucket com o nome `ad-media` e marque-o como **Public bucket**.
4. Em **Authentication > Users**, crie o usuário de acesso administrativo (e-mail e senha).
5. Em **Project Settings > API**, copie as credenciais:
   - **Project URL**
   - **Project API Anon Key**

---

### 2. Painel Administrativo Web (`admin/`)

```bash
# 1. Acesse o diretório
cd admin

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com sua URL e Anon Key do Supabase

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no seu navegador e faça login com as credenciais criadas no Supabase.

#### Deploy em Produção (Vercel):
```bash
cd admin
npm run build
# Deploy via Vercel CLI (ou conecte o repositório no dashboard da Vercel)
vercel --prod
```
> O arquivo `admin/vercel.json` e `admin/public/_redirects` já contêm a configuração necessária para o roteamento SPA.

---

### 3. Player Mobile para Tablets (`mobile/`)

```bash
# 1. Acesse o diretório
cd mobile

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com sua URL e Anon Key do Supabase

# 3. Instale as dependências
npm install

# 4. Inicie o servidor Expo (para testes no Expo Go ou emulador)
npx expo start
```

---

### 4. Build do APK de Produção (EAS Build)

Para gerar o arquivo **APK** instalável diretamente nos tablets Android (sem necessidade da Google Play Store):

```bash
cd mobile

# 1. Instale a CLI do EAS globalmente
npm install -g eas-cli

# 2. Faça login na sua conta Expo
eas login

# 3. Inicialize o projeto no EAS (apenas na primeira vez)
eas init

# 4. Defina as variáveis de ambiente de produção no EAS
eas env:create production # Defina EXPO_PUBLIC_SUPABASE_URL
eas env:create production # Defina EXPO_PUBLIC_SUPABASE_ANON_KEY

# 5. Gere o build do APK (Android Preview)
eas build --platform android --profile preview
```

---

### 5. Configuração do Modo Kiosk / Quiosque (Device Owner) 🔒

Para garantir que o tablet funcione como um terminal dedicado (bloqueando a saída de passageiros ou acesso indevido ao Android):

1. Habilite a **Depuração USB** nas opções de desenvolvedor do tablet Android.
2. Instale o APK gerado no tablet e abra o aplicativo uma vez.
3. Certifique-se de que não haja contas ativas no tablet (remova contas Google/Samsung temporariamente em *Configurações > Contas*).
4. Conecte o tablet ao computador via cabo USB e execute o script utilitário:
   ```bash
   # Windows (via script batch fornecido na pasta scripts/):
   scripts\provision-kiosk.bat

   # Ou manualmente via ADB:
   adb shell dpm set-device-owner com.signage24h.player/expo.modules.kiosk.DeviceAdminReceiver
   ```
5. **Para remover o modo Device Owner (desprovisionar):**
   ```bash
   scripts\deprovision-kiosk.bat
   ```

---

## 🔐 Variáveis de Ambiente

| Projeto | Variável | Descrição | Onde Obter |
|---|---|---|---|
| `admin` | `VITE_SUPABASE_URL` | URL da API do projeto Supabase | Supabase > Settings > API |
| `admin` | `VITE_SUPABASE_ANON_KEY` | Chave pública anônima | Supabase > Settings > API |
| `mobile` | `EXPO_PUBLIC_SUPABASE_URL` | URL da API do projeto Supabase | Supabase > Settings > API |
| `mobile` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anônima | Supabase > Settings > API |

---

## 🛡️ Segurança & Boas Práticas

- **Row Level Security (RLS):** Proteção integral no banco. O player mobile (acesso anônimo) tem permissão de leitura exclusivamente para anúncios ativos e não tem acesso direto às tabelas administrativas.
- **RPCs Blindadas:** Todas as Stored Procedures utilizam `SET search_path = ''` e referências qualificadas de esquema (`public.tabela`), mitigando ataques de *schema injection*.
- **Proteção de PIN Criptografada:** O PIN do modo quiosque é armazenado exclusivamente como hash SHA-256 (`pgcrypto`). O tablet valida o PIN localmente por comparação de hash, garantindo que o PIN em texto puro nunca transite pela rede nem fique exposto no banco.

---

## 📄 Licença

Este projeto está sob a licença [MIT](file:///c:/Users/Victor%20ED/Desktop/Projetos/Fenix%20comunica%C3%A7%C3%B5es/adboard/mobile/LICENSE).
