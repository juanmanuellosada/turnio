Simulá un webhook de pago aprobado de Mercado Pago para verificar el endpoint.

## Pre-requisitos

1. El server de desarrollo debe estar corriendo en `localhost:3000`
2. Debe existir al menos un appointment en estado `pending` en la DB

## Paso 1: Obtener un appointment pendiente

Usá el MCP de Neon para obtener un appointment:
```sql
SELECT id, tenant_id, status, mp_preference_id FROM appointments WHERE status = 'pending' LIMIT 1;
```

Si no hay ninguno, creá uno primero usando el seed o el flujo de reserva.

## Paso 2: Enviar webhook simulado

Enviá un POST a `http://localhost:3000/api/webhooks/mercadopago` con:

```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "12345678"
  },
  "date_created": "2024-01-01T00:00:00Z",
  "id": 12345678,
  "live_mode": false,
  "type": "payment",
  "user_id": "test"
}
```

Headers:
```
Content-Type: application/json
```

Nota: en desarrollo, el webhook puede no verificar la firma de MP.

## Paso 3: Verificar resultado

1. Verificá el status code de la respuesta (esperado: 200)
2. Consultá la DB para ver si el appointment cambió de estado:
```sql
SELECT id, status, mp_payment_id, mp_payment_status FROM appointments WHERE id = '[appointment_id]';
```

## Reporte

- Respuesta del webhook: status code + body
- Estado del appointment antes y después
- Si el flujo completo funciona: ✅ o ❌ con detalle del error
