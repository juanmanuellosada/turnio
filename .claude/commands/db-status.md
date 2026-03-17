Verificá el estado real de la base de datos usando el MCP de Neon (project neondb en el Neon API).

Ejecutá estas consultas SQL en orden:

1. **Tablas existentes**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

2. **Cantidad de filas por tabla** (solo tablas del schema público):
```sql
SELECT schemaname, relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```

3. **Columnas de cada tabla** (para verificar schema):
```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

4. **Últimas migraciones de Drizzle** (si existe la tabla):
```sql
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;
```

Reportá un resumen con:
- Lista de tablas y cantidad de filas
- Si el schema coincide con lo definido en `src/db/schema.ts`
- Problemas detectados (tablas faltantes, columnas incorrectas, etc.)
