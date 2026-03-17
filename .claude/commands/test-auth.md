Usá Puppeteer MCP para testear el flujo de autenticación en localhost:3000.

Ejecutá estos pasos en orden, reportando ✅ o ❌ en cada uno:

## Test 1: Registro de nuevo usuario

1. **Navegar a registro**
   - URL: `http://localhost:3000/register`
   - Verificar: formulario de registro visible

2. **Completar formulario**
   - Nombre: "Test Puppeteer"
   - Email: "test-puppeteer@test.com"
   - Contraseña: "TestPass123!"
   - Confirmar contraseña: "TestPass123!"

3. **Enviar formulario**
   - Clic en "Registrarse"
   - Verificar: redirige a `/dashboard` o `/login` con mensaje de éxito

## Test 2: Login con usuario existente

4. **Navegar a login**
   - URL: `http://localhost:3000/login`
   - Verificar: formulario de login visible

5. **Login como super_admin**
   - Email: "admin@turnio.app"
   - Password: "Admin123!"
   - Verificar: redirige a `/dashboard`
   - Verificar: sidebar muestra opciones de super_admin

6. **Logout**
   - Clic en botón de logout
   - Verificar: redirige a `/login` o `/`

## Test 3: Login como provider

7. **Login como provider**
   - Email: "maria@demo.com"
   - Password: "Provider123!"
   - Verificar: redirige a `/dashboard`
   - Verificar: sidebar muestra opciones de provider (agenda)

## Test 4: Protección de rutas

8. **Acceso sin autenticación**
   - Navegar a `http://localhost:3000/admin`
   - Verificar: redirige a `/login`

9. **Acceso con rol incorrecto**
   - Login como "cliente@demo.com" / "Client123!"
   - Navegar a `http://localhost:3000/super-admin`
   - Verificar: redirige a `/dashboard` (no tiene permiso)

Reportar resumen:
- Tests exitosos: X/9
- Errores encontrados (con detalle y screenshots)
