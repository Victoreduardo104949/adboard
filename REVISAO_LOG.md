# Log de Revisão — Supabase (Segurança & Performance)

**Data:** 2026-08-17
**Escopo:** banco do projeto Signage 24h (schema `public`)
**Ferramentas:** MCP Supabase + advisors (database linter)

---

## 1. Estado antes (achados dos advisors)

### Segurança
| Achado | Severidade | Descrição |
|---|---|---|
| `rls_auto_enable` executável por `anon`/`authenticated` | WARN | Função de manutenção (`SECURITY DEFINER`, event trigger) chamável via `/rest/v1/rpc` sem login |
| `search_path` mutável em 4 funções | WARN | `get_playlist`, `verify_screen`, `ping_screen`, `increment_ad_play` sem `SET search_path` |
| 4 RPCs `SECURITY DEFINER` executáveis por `anon` | WARN | Linter genérico — avaliado como **intencional** (ver §4) |
| Proteção de senha vazada desativada | WARN | Auth não consulta HaveIBeenPwned |

### Performance
| Achado | Severidade | Descrição |
|---|---|---|
| FK `screens.group_id` sem índice | INFO | Consultas por grupo fazem seq scan |
| Políticas permissivas duplicadas | WARN | `ads` e `settings`: papel `authenticated` + `SELECT` coberto por 2 políticas (OR) |

---

## 2. Ações aplicadas (migração `security_review_hardening`)

1. **`revoke execute`** da função `public.rls_auto_enable()` para `public, anon, authenticated`
   - Mantida a função: ela alimenta o event trigger `ensure_rls` (roda como superuser, não precisa de EXECUTE público).
2. **`SET search_path = ''`** nas 4 funções RPC (`get_playlist`, `verify_screen`, `ping_screen`, `increment_ad_play`)
   - Todas as referências já são schema-qualified (`public.xxx`); `pg_catalog` continua sendo pesquisado implicitamente (ex.: `now()`).
3. **`create index screens_group_id_idx on public.screens (group_id)`** — cobre a FK `screens_group_id_fkey`.
4. **Políticas de leitura escopadas a `anon`**:
   - `alter policy "read active ads" on ads to anon;`
   - `alter policy "read settings" on settings to anon;`
   - O player mobile usa anon key → comportamento idêntico; o admin (`authenticated`) deixa de acumular políticas sobrepostas.
5. **`supabase/migrations.sql` atualizado** com a seção "SECURITY REVIEW" para reproduzir o estado no futuro.

---

## 3. Verificações pós-migração

| Verificação | Resultado |
|---|---|
| `select public.rls_auto_enable()` como `anon` | ❌ **permission denied** (bloqueado ✓) |
| `get_playlist`, `verify_screen`, `ping_screen`, `increment_ad_play` como `anon` | ✅ executam sem erro |
| Advisor `function_search_path_mutable` | ✅ zerado |
| Advisor `multiple_permissive_policies` | ✅ zerado |
| Advisor `unindexed_foreign_keys` | ✅ zerado |
| Políticas `read active ads` / `read settings` | ✅ agora `{anon}` |
| Índice `screens_group_id_idx` | ✅ criado |

---

## 4. Restantes e intencionais

| Item | Status | Decisão |
|---|---|---|
| 4 RPCs `SECURITY DEFINER` executáveis por `anon` | **Mantido (intencional)** | O player usa anon key sem login e precisa de `get_playlist`/`verify_screen`/`ping_screen`/`increment_ad_play`. Se virassem `INVOKER`, o RLS de `ad_groups`/`screens` quebraria o loop de grupos. Não revogar. |
| Proteção de senha vazada | **Pendente (manual)** | Configuração de Auth do Supabase, só pelo dashboard: **Authentication → Settings (ou Auth providers) → "Leaked password protection" → ON**. Não há como alterar via SQL/API deste projeto. |
| Índice `screens_group_id_idx` reportado "unused" (INFO) | **Esperado** | Índice recém-criado; perde o aviso assim que houver consultas por `screens.group_id`. |
| `idx_screens_code` redundante com `screens_code_key` | **Observação** | A constraint `unique` em `screens.code` já gera índice próprio; `idx_screens_code` (do migrations.sql original) é redundante. Candidato a `drop index idx_screens_code;` — não executado (fora do escopo combinado). |

---

## 5. Como reproduzir

Reexecutar o arquivo `supabase/migrations.sql` (contém o schema completo + revisão) ou, só a revisão, a seção "SECURITY REVIEW" no SQL Editor.