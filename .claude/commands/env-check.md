Verificá que todas las variables de entorno requeridas estén presentes en `.env.local`.

## Variables requeridas (del CLAUDE.md)

Lee el archivo `.env.local` y verificá que existan estas variables:

### Críticas (sin estas no arranca)
- `DATABASE_URL` — conexión a Neon PostgreSQL
- `AUTH_SECRET` — secreto para NextAuth JWT (mínimo 32 chars, NO el placeholder)
- `NEXTAUTH_URL` — debe ser `http://localhost:3000` en dev

### Pagos (sin estas no funciona MP)
- `MP_WEBHOOK_SECRET` — para verificar firma de webhooks

### Google Calendar (sin estas no funciona Calendar)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Emails (sin estas no envía emails)
- `RESEND_API_KEY`
- `EMAIL_FROM`

### App
- `NEXT_PUBLIC_APP_URL` — debe ser `http://localhost:3000` en dev

### Solo para MCPs de Claude Code (no van a Vercel)
- `NEON_API_KEY`
- `GITHUB_TOKEN`

## Validaciones

1. `AUTH_SECRET` no debe ser el placeholder `tu_clave_secreta_larga_de_32_chars`
2. `DATABASE_URL` debe contener `neon.tech`
3. `RESEND_API_KEY` debe empezar con `re_`
4. `GOOGLE_CLIENT_ID` debe terminar en `.apps.googleusercontent.com`

## Reporte

Lista cada variable con ✅ (presente y válida) o ❌ (faltante o inválida).
Si hay variables críticas faltantes, indicá exactamente dónde obtenerlas (URLs del dashboard correspondiente).
No continuar con la fase actual si `DATABASE_URL` o `AUTH_SECRET` faltan.
