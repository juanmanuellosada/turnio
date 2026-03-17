# Usuarios de prueba — Turnio

Estos usuarios se crean con el seed (`npm run db:seed`).

## Tenant demo

| Campo | Valor |
|-------|-------|
| Slug | `demo-peluqueria` |
| Nombre | Peluquería Demo |
| Dirección | Av. Corrientes 1234, CABA |

## Usuarios

| Rol | Nombre | Email | Password |
|-----|--------|-------|----------|
| super_admin | Super Admin | `admin@turnio.app` | `Admin123!` |
| provider | María López | `maria@demo.com` | `Provider123!` |
| provider | Carlos García | `carlos@demo.com` | `Provider123!` |
| client | Cliente Demo | `cliente@demo.com` | `Client123!` |

## Servicios

| Servicio | Prestador | Duración | Precio |
|----------|-----------|----------|--------|
| Corte de pelo | María López | 30 min | $5.000 ARS |
| Tintura completa | María López | 90 min | $15.000 ARS |
| Barba | Carlos García | 20 min | $3.000 ARS |

## Disponibilidad

Ambos prestadores: **Lunes a Viernes, 09:00 a 18:00**.

## Cómo ejecutar el seed

```bash
npm run db:seed
```

Esto borra datos de prueba existentes y recrea todo desde cero.
