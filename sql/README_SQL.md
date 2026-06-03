# Scripts SQL

Orden recomendado en una maquina nueva con Oracle XE:

1. Entrar como administrador en `XEPDB1`:

```bash
sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
```

2. Crear o reparar el usuario del proyecto:

```sql
@sql/01_create_user.sql
```

3. Salir y entrar como el usuario del proyecto:

```sql
EXIT
```

```bash
sqlplus gestion_equipos/gestion123@localhost:1521/XEPDB1
```

4. Crear tablas, claves, secuencias, triggers y datos de prueba:

```sql
@sql/02_schema.sql
```

El script `schema.sql` elimina y vuelve a crear las tablas del sistema. Sirve para preparar una demo limpia.
