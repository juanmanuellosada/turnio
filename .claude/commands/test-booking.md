Usá Puppeteer MCP para testear el flujo completo de reserva en localhost:3000.

Ejecutá estos pasos en orden, reportando ✅ o ❌ en cada uno:

1. **Navegar a la página del negocio**
   - URL: `http://localhost:3000/demo-peluqueria`
   - Verificar: se muestra el nombre "Peluquería Demo", lista de servicios visible

2. **Hacer clic en "Reservar" en un servicio**
   - Verificar: navega a `/demo-peluqueria/reservar`
   - Verificar: stepper visible con paso "Servicio" activo

3. **Seleccionar un servicio**
   - Elegir "Corte de pelo" ($5000)
   - Verificar: pasa al paso "Prestador"

4. **Seleccionar prestador**
   - Elegir "María López"
   - Verificar: pasa al paso "Fecha y hora"

5. **Seleccionar fecha y hora**
   - Elegir una fecha futura disponible (primer slot verde)
   - Elegir un horario disponible
   - Verificar: pasa al paso "Confirmar"

6. **Completar datos del cliente**
   - Nombre: "Test User"
   - Email: "test@test.com"
   - Teléfono: "1122334455"

7. **Confirmar reserva**
   - Hacer clic en "Confirmar y pagar"
   - Verificar: redirige al checkout de Mercado Pago (URL contiene mercadopago)
   - O si no hay MP configurado: verificar que se crea el appointment en estado pending

8. **Tomar screenshot final**
   - Capturar screenshot de la página resultante

Reportar resumen:
- Pasos exitosos: X/8
- Errores encontrados (con detalle y screenshots)
- Tiempo total del flujo
