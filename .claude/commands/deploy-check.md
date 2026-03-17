Verificaciones pre-deploy a Vercel.

## 1. Build local

Ejecutá `npm run build` en el directorio del proyecto y verificá:
- No hay errores de TypeScript
- No hay errores de compilación de Next.js
- El build completa exitosamente

Si hay errores, listá cada uno con archivo y línea.

## 2. Variables de entorno de producción

Verificá que las variables de producción difieran de las de desarrollo:
- `NEXTAUTH_URL` → debe ser la URL de producción (no localhost)
- `NEXT_PUBLIC_APP_URL` → debe ser la URL de producción
- `GOOGLE_REDIRECT_URI` → debe apuntar a la URL de producción
- `EMAIL_FROM` → idealmente un dominio propio (no resend.dev)

## 3. Endpoints críticos

Si el server de desarrollo está corriendo, verificá con fetch/curl:
- `GET /api/health` → debe retornar `{"ok": true}`
- `GET /api/auth/providers` → debe retornar los providers de NextAuth

## 4. Archivos de configuración

Verificá que existan:
- `vercel.json` — con cron de recordatorios configurado
- `next.config.js` o `next.config.ts` — configuración correcta
- `.gitignore` — incluye `.env.local`, `node_modules`, `.next`

## 5. Dependencias

Verificá que no haya:
- Dependencias con vulnerabilidades críticas (`npm audit --production`)
- Paquetes que no se usen

Reportar resumen con ✅/❌ por cada punto.
