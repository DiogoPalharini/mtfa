# 📋 Fluxo Completo do Login Offline - Análise Detalhada

## 🔄 FLUXO GERAL DO LOGIN

### 1️⃣ **ENTRADA DO USUÁRIO** 
**Arquivo:** `app/index.tsx`
- Usuário preenche email e senha
- Clica em "Login"
- Chama `onSubmit()` → `login(data.username, data.password)`

---

## 🌐 FLUXO DE LOGIN ONLINE (Primeiro Tentativa)

### 2️⃣ **AuthContext.login()** ⚠️ **ATUALIZADO**
**Arquivo:** `contexts/AuthContext.tsx` (linha 201)

**O que acontece:**
1. **NOVO:** Verifica conectividade primeiro com `checkInternetConnection()` (linha 208)
   - Timeout de 2 segundos para verificação rápida
   - Se não tiver internet → vai direto para login offline (linha 212)
   - Se tiver internet → tenta login online primeiro
2. Chama `hybridAuthService.login(username, password)` (linha 249) - APENAS SE TIVER INTERNET
3. Aguarda resultado

### 3️⃣ **HybridAuthService.login()**
**Arquivo:** `services/HybridAuthService.ts` (linha 184)

**O que acontece:**
1. Executa duas autenticações em paralelo:
   - `authenticateWithModernAPI()` - API moderna
   - `authenticateWithLegacySystem()` - Sistema legado
2. Se ambas sucederem:
   - Salva credenciais em memória
   - Retorna `{ success: true, user, sessionCookie }`

### 4️⃣ **Se Login Online Bem-Sucedido**
**Arquivo:** `contexts/AuthContext.tsx` (linha 201-221)

**O que acontece:**
1. Chama `localAuthService.saveCredentials(username, password, sessionCookie)` (linha 205)
   - Isso salva as credenciais para uso offline futuro
2. Salva dados do usuário no AsyncStorage:
   - `userData` → JSON do usuário
   - Remove flag `offline_mode`
3. Define estado do usuário como autenticado
4. Retorna sucesso

---

## 📱 FLUXO DE LOGIN OFFLINE (Fallback)

### 5️⃣ **Quando Login Online Falha**
**Arquivo:** `contexts/AuthContext.tsx` (linha 222-264 e 265-305)

**Cenários:**
- **Cenário A:** Login híbrido retorna `success: false` mas não lança exceção (linha 230)
- **Cenário B:** Login híbrido lança exceção (linha 269)

### 6️⃣ **Chamada do Login Offline**
**Arquivo:** `contexts/AuthContext.tsx` (linha 230 e 271)

**Código:**
```typescript
const offlineResult = await localAuthService.validateOfflineLogin(username, password);
```

### 7️⃣ **LocalAuthService.validateOfflineLogin()**
**Arquivo:** `services/localAuthService.ts` (linha 144)

**Passo a passo:**

#### 7.1 - Verificação do Banco de Dados
```typescript
await localDatabaseService().waitForInitialization();
```
- Aguarda inicialização do SQLite
- Se falhar, retorna erro: "Sistema offline temporariamente indisponível"

#### 7.2 - Buscar Credenciais Salvas por Email
```typescript
let storedCredentials = await this.getStoredCredentialsByEmail(email);
```

**Método:** `getStoredCredentialsByEmail()` (linha 85)
- Busca no SQLite: `localDatabaseService().getUserCredentials(email)`
- Retorna `LocalUserCredentials` ou `null`

#### 7.3 - Fallback para AsyncStorage
**Arquivo:** `services/localAuthService.ts` (linha 166-182)

Se não encontrou no SQLite:
```typescript
const json = await AsyncStorage.getItem('offline_credentials');
const parsed = JSON.parse(json);
if (parsed?.email === email) {
  storedCredentials = { ... }
}
```

#### 7.4 - Verificação se Credenciais Existem
```typescript
if (!storedCredentials) {
  return { success: false, message: 'Nenhuma credencial salva encontrada...' };
}
```

#### 7.5 - Validação de Expiração (30 dias)
```typescript
const lastLogin = new Date(storedCredentials.lastLogin);
const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
if (daysDiff > 30) {
  return { success: false, message: 'Credenciais expiradas...' };
}
```

#### 7.6 - Verificação de Senha ⚠️ **PONTO CRÍTICO**
```typescript
const isPasswordValid = await this.verifyPassword(password, storedCredentials.password);
```

**Método:** `verifyPassword()` (linha 32)
- Recebe: `password` (texto plano) e `hashedPassword` (hash salvo)
- Criptografa a senha digitada: `SHA256(password + ENCRYPTION_KEY)`
- Compara hash gerado com hash salvo

#### 7.7 - Retorno de Sucesso
```typescript
return {
  success: true,
  message: 'Login offline realizado com sucesso.',
  credentials: storedCredentials
};
```

### 8️⃣ **Se Login Offline Bem-Sucedido**
**Arquivo:** `contexts/AuthContext.tsx` (linha 232-260 ou 273-301)

**O que acontece:**
1. Cria objeto `CloudUser` com dados das credenciais:
   ```typescript
   const userData: CloudUser = {
     id: 0,
     name: offlineResult.credentials.email.split('@')[0],
     email: offlineResult.credentials.email,
     level: 'Licencee'
   };
   ```

2. Salva no AsyncStorage:
   ```typescript
   await Promise.all([
     AsyncStorage.setItem('userData', JSON.stringify(userData)),
     AsyncStorage.setItem('hybrid_user', JSON.stringify(userData)),
     AsyncStorage.setItem('offline_mode', 'true')
   ]);
   ```

3. Define estado como autenticado:
   ```typescript
   setUser(userData);
   setIsAuthenticated(true);
   ```

4. Retorna sucesso

---

## 💾 COMO AS CREDENCIAIS SÃO SALVAS

### 9️⃣ **Quando Login Online é Bem-Sucedido**
**Arquivo:** `contexts/AuthContext.tsx` (linha 205)

```typescript
await localAuthService.saveCredentials(username, password, hybridResult.sessionCookie);
```

### 🔟 **LocalAuthService.saveCredentials()**
**Arquivo:** `services/localAuthService.ts` (linha 47)

**Passo a passo:**

#### 10.1 - Criptografar Senha
```typescript
const hashedPassword = await this.encryptPassword(password);
```
- Método `encryptPassword()` (linha 17)
- Gera hash SHA256: `SHA256(password + 'mtfa_auth_key_2024')`
- Retorna em Base64

#### 10.2 - Salvar no SQLite
```typescript
await localDatabaseService().saveUserCredentials(email, hashedPassword, sessionId);
```

**Método:** `localDatabaseService.saveUserCredentials()` (linha 506)
- Verifica se credencial já existe (por email)
- Se existe: **UPDATE** com novo hash e timestamp
- Se não existe: **INSERT** novo registro
- Salva na tabela `user_credentials`:
  - `id`, `email`, `password_hash`, `session_id`, `last_login`, `is_validated`, `created_at`

#### 10.3 - Salvar no AsyncStorage (Backup)
```typescript
await AsyncStorage.setItem(
  'offline_credentials',
  JSON.stringify({
    email,
    password_hash: hashedPassword,
    session_id: sessionId,
    last_login: new Date().toISOString(),
    is_validated: true
  })
);
```

---

## 🔍 DADOS NECESSÁRIOS PARA LOGIN OFFLINE

### 📊 **Tabela: user_credentials (SQLite)**
```
- id: TEXT (UUID gerado)
- email: TEXT (email do usuário)
- password_hash: TEXT (SHA256 hash em Base64)
- session_id: TEXT (opcional, cookie de sessão)
- last_login: TEXT (ISO string da data)
- is_validated: INTEGER (1 = válido, 0 = inválido)
- created_at: TEXT (ISO string da data de criação)
```

### 📦 **AsyncStorage: offline_credentials (JSON)**
```json
{
  "email": "usuario@example.com",
  "password_hash": "base64_hash_aqui",
  "session_id": "PHPSESSID=...",
  "last_login": "2024-01-15T10:30:00.000Z",
  "is_validated": true
}
```

---

## ⚠️ PONTOS DE FALHA IDENTIFICADOS

### 🐛 **PROBLEMA 1: Inicialização do Banco de Dados**
**Arquivo:** `services/localDatabaseService.ts`

- Banco pode não estar inicializado quando `validateOfflineLogin()` é chamado
- `waitForInitialization()` tem timeout de 50 tentativas × 200ms = 10 segundos
- Se falhar, login offline não funciona mesmo tendo credenciais

### 🐛 **PROBLEMA 2: Comparação de Senha**
**Arquivo:** `services/localAuthService.ts` (linha 210)

- Senha digitada é criptografada e comparada com hash salvo ✅ (CORRETO)
- **MAS:** Se a criptografia falhar ou houver diferença no algoritmo, não funciona

### 🐛 **PROBLEMA 3: Verificação de Email**
**Arquivo:** `services/localAuthService.ts` (linha 163)

- Busca credenciais por email exato
- **Problema:** Se o email salvo for diferente (case sensitivity, espaços), não encontra

### 🐛 **PROBLEMA 4: AsyncStorage como Fallback**
**Arquivo:** `services/localAuthService.ts` (linha 168)

- Busca no AsyncStorage apenas se SQLite não encontrar
- **Problema:** AsyncStorage pode estar desatualizado se SQLite foi limpo

### 🐛 **PROBLEMA 5: last_login não é atualizado no Login Offline**
**Arquivo:** `services/localAuthService.ts` (linha 195)

- Verifica `last_login` mas não atualiza ao fazer login offline
- Pode expirar mesmo com logins recentes offline

### 🐛 **PROBLEMA 6: Flag offline_mode não é verificada no checkSession**
**Arquivo:** `contexts/AuthContext.tsx` (linha 338)

- `checkSession()` verifica `offline_mode` mas pode não estar sincronizado
- Se `offline_mode` não existir mas há credenciais, pode falhar

---

## 📍 ONDE ESTÁ SENDO FEITO O LOGIN OFFLINE

### Arquivos Envolvidos:

1. **`app/index.tsx`** - Interface do usuário, chama login
2. **`contexts/AuthContext.tsx`** - Gerencia autenticação, orquestra login online/offline
3. **`services/HybridAuthService.ts`** - Login online (API moderna + legado)
4. **`services/localAuthService.ts`** - Login offline, validação de credenciais locais
5. **`services/localDatabaseService.ts`** - Persistência SQLite das credenciais
6. **`services/cloudLogin.ts`** - Serviço antigo de login (pode não estar em uso)

### Fluxo de Chamadas:
```
index.tsx
  └─> AuthContext.login()
      ├─> HybridAuthService.login() [ONLINE]
      │   ├─> authenticateWithModernAPI()
      │   └─> authenticateWithLegacySystem()
      │
      └─> LocalAuthService.validateOfflineLogin() [OFFLINE]
          ├─> localDatabaseService.getUserCredentials()
          ├─> AsyncStorage.getItem('offline_credentials') [fallback]
          ├─> verifyPassword()
          └─> Retorna credenciais ou erro
```

---

## 🔧 VERIFICAÇÕES SUGERIDAS

1. ✅ Banco de dados está inicializado?
2. ✅ Credenciais existem no SQLite?
3. ✅ Email corresponde exatamente (case-sensitive)?
4. ✅ Hash da senha corresponde ao hash salvo?
5. ✅ `last_login` não expirou (>30 dias)?
6. ✅ AsyncStorage tem backup válido?
7. ✅ Flag `offline_mode` está sendo setada corretamente?

---

## 📝 RESUMO EXECUTIVO

**Login Offline deve funcionar quando:**
1. Usuário já fez login online pelo menos uma vez
2. Credenciais foram salvas no SQLite e AsyncStorage
3. Senha digitada corresponde à senha original (após hash)
4. Último login online foi há menos de 30 dias
5. Banco de dados SQLite está inicializado

**Onde está falhando:**
- Verificar logs do console para ver qual etapa está falhando
- Checar se banco está inicializado
- Verificar se credenciais existem no SQLite
- Confirmar que senha digitada está correta
- Verificar formato do email (case-sensitive)

