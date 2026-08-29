# BACKLOG — Signage 24h (retomada pós-reboot)

> Última atualização: 19/08/2026 — diagnóstico da tela offline + plano modo kiosk A11+.

## Redeploy do painel com a aba Grupos ✅

1. `cd admin; vercel --prod` falhou com "Not authorized" sem `--scope` (o projeto pertence ao time, a CLI default usa o escopo pessoal).
2. Com escopo explícito funcionou: `vercel --prod --scope team_jnF0xqAEqrDtu5h7WMyC9K9C` (ou `--scope victoreduardo104949s-projects`).
3. Produção: https://signage24h-admin.vercel.app — HTTP 200 na raiz e no fallback `/grupos`.
4. `vercel whoami` → victoreduardo104949; token local OK.

## GitHub MCP (opencode) ✅

1. Adicionado em `~/.config/opencode/opencode.jsonc`: servidor `github` tipo `remote` com URL `https://api.githubcopilot.com/mcp/` (login OAuth device flow na primeira conexão).
2. Nota: o formato colado pelo usuário (`servers` + `type: "http"`) era de outro cliente (Claude Code/Cursor); no opencode é `mcp` + `type: "remote"`.
3. **Fix (17/08)**: o servidor GitHub Copilot MCP falhava (`server unavailable`, 401) porque o opencode tenta OAuth com registro dinâmico de client, que esse servidor não suporta. Solução: header `Authorization: Bearer <PAT>` (fine-grained, repositório adboard, permissões Contents/PR/Issues) direto no `mcp.github.headers` do `opencode.jsonc`. Validado com `opencode mcp debug github` → HTTP 200. Requer reiniciar a sessão do opencode para carregar.

## Segmentação por grupo de dispositivos ✅

1. Banco: tabela `groups`, coluna `screens.group_id`, junção `ad_groups` (N:N), RLS admin-only; `verify_screen` agora retorna `group_id`; nova RPC `get_playlist(p_code)` (security definer) que devolve ads ativas que são globais **ou** do grupo da tela.
2. Player: `PlayerScreen` busca a playlist via `supabase.rpc('get_playlist', { p_code: code })` (loop de 60s mantido).
3. Painel admin:
   - Nova aba **Grupos**: criar/renomear/excluir grupos.
   - **Telas**: select de grupo por tela (vazio = "Sem grupo").
   - **Anúncios**: checkboxes "Exibir nos grupos" (sem seleção = todas as telas); badges de grupo na lista.
4. Validação: RPC testado no banco (tela do grupo vê anúncio segmentado, tela sem grupo não) e limpeza feita; typecheck mobile e lint+build admin OK.
5. Regra de negócio: anúncio **sem grupo** continua tocando em **todas** as telas (comportamento antigo preservado).

## Deploy do painel admin na Vercel ✅

1. **Projeto**: `signage24h-admin` (escopo `victoreduardo104949s-projects`).
2. **URL de produção**: https://signage24h-admin.vercel.app (login normal com usuário admin do Supabase).
3. Env vars de produção configuradas via `vercel env add`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy sem git (upload direto via CLI); `vercel --prod` em `admin/` = rebuild. Vite detectado (build `tsc -b && vite build`, output `dist`).
5. Validação: HTTP 200 na raiz e no fallback SPA (`/telas`).
6. **Dica**: se "Not authorized" no `--prod`, rodar com `--scope team_jnF0xqAEqrDtu5h7WMyC9K9C` (projeto está em um time, não no escopo pessoal).

## Contexto

- Projeto: `C:\Users\Victor ED\adboard` (admin/ + mobile/ + supabase/)
- Objetivo atual: rodar o app mobile em **emulador Android no PC** (Expo Go).

## Concluído ✅

1. Build/produção configurado:
   - `mobile/eas.json` (perfis development/preview/production)
   - `mobile/app.json` → `android.package: com.signage24h.player`, `versionCode: 1`
   - `mobile/.easignore` + `.gitignore` (não envia `.env` ao EAS)
   - `admin/public/_redirects` (Netlify) e `admin/vercel.json` (Vercel)
   - README atualizado (seção 4: deploy do painel + EAS Build)
   - Validação OK: typecheck mobile limpo, build admin passou.
2. Android Studio 2026.1.3.7 instalado via winget (`C:\Program Files\Android\Android Studio`, Java embutido em `jbr`).
3. SDK em `%LOCALAPPDATA%\Android\Sdk`:
   - platform-tools (adb) ✅
   - emulator ✅
   - system image `system-images;android-36;google_apis;x86_64` ✅
   - cmdline-tools versão 15859902 ✅
   - Licenças aceitas ✅
4. AVD criado: **signage_tablet** (Pixel Tablet, Android 16) — `C:\Users\Victor ED\.android\avd\signage_tablet.avd`
5. Script auxiliar: `C:\Users\Victor ED\AppData\Local\Temp\opencode\install-aehd.ps1` (instala driver com log em `aehd_install.log`)

## Pós-reboot ✅

1. **SVM habilitado no BIOS**: `VirtualizationFirmwareEnabled = True` (AMD Ryzen 7 5700G).
2. **AEHD dispensado**: VBS/Hyper-V ativo no Windows → `emulator-check accel` retorna **WHPX instalado e utilizável** (usado automaticamente).
3. **Emulador subindo**: `emulator -avd signage_tablet -gpu auto` → boot completo.
4. **App rodando**: `npx expo start --android` → Expo Go instalado automaticamente, bundle carregado sem erros, tela de pareamento ativa com código **TL7FCL** (a cada execução o código muda).

## Próximos passos ⏳

1. Registrar o tablet no painel: `cd admin; npm run dev` → login → **Telas** → digitar o código exibido no emulador.
2. Validar: tablet aparece online no painel e começa a reproduzir a playlist.

## Sessão de 08/08 — loop completo validado ✅

1. Emulador `signage_tablet` subido: `emulator -avd signage_tablet -gpu auto` (WHPX).
2. App `com.signage24h.player` (build standalone, bundle embutido) abre direto na PlayerScreen — pareamento persistiu no AsyncStorage (tela **9SQJ3V / "Emulador Teste"**).
3. `npx expo start --android` não é necessário: erro 101 no Expo Go é irrelevante; o build do emulador não carrega bundle do Metro (nenhum request em `expo.log`).
4. Supabase confirmado:
   - 3 telas registradas (TL7FCL "carro 1", LJMKMX "teste r 1", 9SQJ3V "Emulador Teste") — heartbeat ativo (last_seen ≈ agora).
   - 3 anúncios (2 ativos: "Video 1", "teste"); play_count subiu +2 em 45s no emulador → ciclo de reprodução funcionando.
5. Painel admin: `cd admin; npm run dev` → http://localhost:5173 ✅

## Próximos passos ⏳

1. Testar um **APK real de produção**: `cd mobile; eas build --platform android --profile preview` e instalar via adb no emulador (valida EAS + .env embutido + storage offline).
2. Adicionar um anúncio de **imagem** (expo-image) na playlist para validar o ciclo imagem→vídeo.
3. Validação visual no painel (login em http://localhost:5173 → Telas vê "Emulador Teste" online).
4. Testar na tecla de sair (PIN de saída em Configurações) antes de disponibilizar nos tablets dos clientes.

## Observações

- Se `sc query aehd` falhar com "não existe", rodar o script elevado:
  `Start-Process powershell -Verb RunAs -ArgumentList "-File C:\Users\Victor ED\AppData\Local\Temp\opencode\install-aehd.ps1"` e aceitar o UAC.
- Alternativa sem driver: habilitar a feature do Windows `HypervisorPlatform` (requer admin + reboot).
- Se algo não funcionar no emulador, opção mais simples: Expo Go no celular físico (`npx expo start` + QR) ou versão web (`npx expo install react-dom react-native-web && npx expo start --web`).

## Modo kiosk no Samsung A11+ (botões Home/Voltar) ⏳ — 19/08

**Contexto**: tela "carro joão" (JNJMD9) criada no painel ficou Offline — nunca recebeu ping
do tablet (last_seen_at NULL). Config .env/APK conferem com o projeto Supabase; suspeita:
tablet sem rede ou app travado na tela de pareamento (PairingScreen ignora erros de rede
silenciosamente — `const { data } = ...` sem checar `error`).

**Fase 1 — provisionar A11+ como device owner (sem rebuild)**:
1. Conectar via USB; habilitar Modo desenvolvedor → Depuração USB.
2. Remover conta Samsung temporariamente (One UI bloqueia dpm com conta ativa).
3. Instalar o APK v1.0.0 (Signage24h-Player-v1.0.0.apk) e abrir o app uma vez.
4. ADB: `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe` (não está no PATH)
   `adb shell dpm set-device-owner com.signage24h.player/expo.modules.kiosk.DeviceAdminReceiver`
5. Pronto: lock task ativo → Home/Voltar bloqueados; BootReceiver sobe o app sozinho.
6. Desfazer: `adb shell dpm remove-active-admin com.signage24h.player/expo.modules.kiosk.DeviceAdminReceiver`
   (com device owner o app NÃO desinstala sem isso).

**Fase 2 — melhorias no código + rebuild (APK v1.1.0)**:
1. `KioskModule.kt`: `startLockTask()` retornar Boolean (hoje engole SecurityException) +
   verificar isDeviceOwnerApp/isLockTaskPermitted.
2. `kiosk.ts` + `modules/kiosk/index.ts`: propagar retorno.
3. `PlayerScreen.tsx`: aviso visível na tela quando kiosk não ativar (sem parar reprodução).
4. Scripts `provision.bat` / `deprovision.bat` + instruções no README.
5. Bump versionCode → 2; rebuild via skill apk-build (expo-updates está desabilitado neste
   build — instalar APK manualmente).

**Fora de escopo**: bloqueio extra (keyguard/root); lock task na tela de pareamento.
