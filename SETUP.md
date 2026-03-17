# SETUP.md — Turnio: Configuración de servicios externos

> Seguí este doc en orden. Al terminar cada sección, tenés una variable lista para el `.env.local`.

---

## Checklist general

- [ ] 1. Neon — Proyecto + DATABASE_URL + API Key para MCP
- [ ] 2. Google Cloud Console — OAuth 2.0 para Calendar
- [ ] 3. Mercado Pago — App de desarrollador + credenciales de test
- [ ] 4. Resend — API Key
- [ ] 5. Vercel — Proyecto + variables de entorno
- [ ] 6. GitHub — Repo + Personal Access Token
- [ ] 7. ngrok — Túnel local para webhooks de MP
- [ ] 8. Claude Code — MCPs verificados
- [ ] 9. `.env.local` completado y verificado

---

## 1. Neon (base de datos)

### 1a. Crear cuenta y proyecto
1. Ir a [neon.tech](https://neon.tech) → Sign up (gratis con GitHub o Google)
2. **New Project**
   - Name: `turnio`
   - Postgres version: 16
   - Region: **AWS US East (N. Virginia)** — la más cercana con buen latency desde Vercel
3. Una vez creado, ir a **Connection Details**
4. Seleccionar **Connection string** → copiar la URL completa → `DATABASE_URL`
   - Formato: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 1b. API Key para el MCP de Claude Code
1. En Neon → clic en tu avatar (arriba a la derecha) → **Account Settings**
2. **API Keys → New API Key**
   - Name: `turnio-claude-code`
3. Copiar → `NEON_API_KEY`

> ✅ Neon free tier: 1 proyecto, 0.5 GB storage, compute ilimitado (auto-suspende cuando no se usa). Más que suficiente para el MVP y para siempre en proyectos pequeños.

---

## 2. Google Cloud Console — Calendar API

### 2a. Crear proyecto
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. **Select project → New Project** → Name: `turnio`

### 2b. Habilitar Google Calendar API
1. **APIs & Services → Library** → buscar **Google Calendar API** → Enable

### 2c. Configurar pantalla de consentimiento OAuth
1. **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - App name: `Turnio`
   - Support email: tu email
   - Developer contact: tu email
2. **Scopes** → Add scope → buscar y agregar:
   - `https://www.googleapis.com/auth/calendar.events`
3. **Test users** → agregar tu email y los emails de prueba que vayas a usar

### 2d. Crear credenciales OAuth 2.0
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Turnio Web`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (desarrollo)
     - `https://turnio.vercel.app/api/calendar/callback` (agregar luego del deploy)
2. Copiar:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

> ⚠️ La app queda en modo "Testing". Solo los test users configurados pueden usarla. Para producción real necesitarías verificación de Google, pero para el MVP esto alcanza.

---

## 3. Mercado Pago

### 3a. Crear aplicación de desarrollador
1. Ir a [mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. **Crear aplicación**
   - Nombre: `Turnio`
   - Solución de pago: **Checkout Pro**
   - Modelo: **No uso plataforma de terceros**
3. Ir a **Credenciales → Credenciales de prueba**:
   - `Access Token` (TEST-...) → `MP_TEST_ACCESS_TOKEN`
   - `Public Key` (TEST-...) → `MP_TEST_PUBLIC_KEY`

### 3b. Configurar webhook IPN
1. En la app → **Webhooks**
2. URL: `https://[tu-ngrok-url]/api/webhooks/mercadopago`
3. Evento: ✅ `payment`
4. Generar secreto: `openssl rand -hex 32` → `MP_WEBHOOK_SECRET`

### 3c. Tarjetas de prueba (no requieren dinero real)
| Tipo | Número | CVV | Vencimiento |
|------|--------|-----|-------------|
| Visa aprobada | `4509 9535 6623 3704` | `123` | `11/25` |
| Mastercard aprobada | `5031 7557 3453 0604` | `123` | `11/25` |
| Visa rechazada | `4000 0000 0000 0002` | `123` | `11/25` |

Email del comprador: cualquier email de usuario de prueba de MP.
Generá usuarios de prueba desde el panel de MP → Cuentas de prueba.

---

## 4. Resend (emails)

1. Ir a [resend.com](https://resend.com) → Sign up (gratis)
2. **API Keys → Create API Key**
   - Name: `turnio-dev`
   - Permission: **Sending access**
   - Domain: **All domains**
3. Copiar → `RESEND_API_KEY`

> En desarrollo usá `EMAIL_FROM=onboarding@resend.dev` (no requiere verificar dominio).
> Para producción: **Domains → Add Domain** → verificar `turnio.app` en el DNS.

---

## 5. Vercel

### 5a. Crear proyecto
1. Ir a [vercel.com](https://vercel.com) → Add New Project
2. **Import Git Repository** → seleccionar repo `turnio`
3. Framework preset: **Next.js** (auto-detectado)
4. **No deployar todavía** — configurar env vars primero

### 5b. Variables de entorno en Vercel
1. **Settings → Environment Variables**
2. Agregar todas las variables del `.env.local` (con valores de producción)
3. Para producción cambiar:
   - `NEXTAUTH_URL` → `https://turnio.vercel.app`
   - `GOOGLE_REDIRECT_URI` → `https://turnio.vercel.app/api/calendar/callback`
   - `NEXT_PUBLIC_APP_URL` → `https://turnio.vercel.app`
   - `EMAIL_FROM` → `noreply@turnio.app` (si tenés dominio verificado en Resend)
   - `MP_TEST_ACCESS_TOKEN` → tu token de producción cuando estés listo
4. **No agregar** `NEON_API_KEY` ni `GITHUB_TOKEN` en Vercel — son solo para Claude Code local

### 5c. Conectar Neon a Vercel (integración nativa)
1. En tu proyecto de Vercel → **Storage → Connect Database**
2. Seleccionar **Neon** → conectar el proyecto `turnio`
3. Esto agrega `DATABASE_URL` automáticamente en todas las environments de Vercel

### 5d. Deploy
```bash
npm i -g vercel
vercel login
vercel   # primer deploy interactivo
# Siguientes deploys: automáticos con git push a main
```

---

## 6. GitHub

### 6a. Crear repositorio
1. [github.com/new](https://github.com/new)
   - Name: `turnio`
   - Visibility: **Private**
   - No inicializar (el proyecto ya existe local)

### 6b. Personal Access Token para el MCP
1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token (classic)**
   - Note: `turnio-claude-code`
   - Expiration: 90 días
   - Scopes: ✅ `repo`, ✅ `read:org`, ✅ `workflow`
3. Copiar → `GITHUB_TOKEN`

### 6c. Vincular repo
```bash
git init
git remote add origin https://github.com/[tu-usuario]/turnio.git
git add .
git commit -m "chore: initial setup"
git push -u origin main
```

---

## 7. ngrok (webhooks locales para MP)

```bash
# Windows con Chocolatey
choco install ngrok

# O descargar desde https://ngrok.com/download
```

1. Cuenta gratuita en [ngrok.com](https://ngrok.com)
2. Autenticar: `ngrok config add-authtoken [tu-token]`

**Uso durante desarrollo:**
```bash
# Terminal separada, siempre que estés testeando pagos
ngrok http 3000
# Copiar URL https://xxxx.ngrok-free.app
# Actualizar en MP dashboard → Webhooks → URL de notificación
```

> ⚠️ La URL de ngrok cambia al reiniciar en el plan free. Actualizar en MP cada vez.

---

## 8. Claude Code — verificar MCPs

El `.mcp.json` en la raíz del proyecto activa los MCPs automáticamente.

### Variables que necesitan los MCPs (en `.env.local`)
```bash
NEON_API_KEY=neon_api_...     # Para el MCP de Neon
GITHUB_TOKEN=ghp_...          # Para el MCP de GitHub
```

### Verificar en Claude Code
```
/mcp
```
Deberías ver: `neon ✅`, `github ✅`, `context7 ✅`, `puppeteer ✅`

Si alguno falla, revisar que el valor de la variable esté en `.env.local` y reiniciar Claude Code.

---

## 9. `.env.local` final — verificación

```bash
✅ DATABASE_URL                  # postgresql://...neon.tech/neondb?sslmode=require
✅ NEON_API_KEY                  # neon_api_...
✅ AUTH_SECRET                   # string de 32+ chars
✅ NEXTAUTH_URL                  # http://localhost:3000
✅ MP_WEBHOOK_SECRET             # hex string
✅ MP_TEST_ACCESS_TOKEN          # TEST-...
✅ MP_TEST_PUBLIC_KEY            # TEST-...
✅ GOOGLE_CLIENT_ID              # ...apps.googleusercontent.com
✅ GOOGLE_CLIENT_SECRET          # GOCSPX-...
✅ GOOGLE_REDIRECT_URI           # http://localhost:3000/api/calendar/callback
✅ RESEND_API_KEY                # re_...
✅ EMAIL_FROM                    # onboarding@resend.dev
✅ NEXT_PUBLIC_APP_URL           # http://localhost:3000
✅ GITHUB_TOKEN                  # ghp_...
```

---

## 10. Verificación final antes de arrancar Claude Code

```bash
# Instalar dependencias (Claude Code lo hace, pero podés verificar)
npm install

# Verificar que Neon responde (después de que Claude Code cree el proyecto)
npx drizzle-kit push

# Correr en desarrollo
npm run dev

# Verificar health endpoint
curl http://localhost:3000/api/health
# Esperado: {"ok":true}

# En otra terminal: levantar ngrok si vas a testear pagos
ngrok http 3000
```

### Prompt para Claude Code
Abrí Claude Code en la carpeta del proyecto y pegá:

> "Leé el `CLAUDE.md` y el `SETUP.md` completos. El `.env.local` está completo con `DATABASE_URL` de Neon. Verificá los MCPs con `/mcp`. Ejecutá la **Fase 1** completa."