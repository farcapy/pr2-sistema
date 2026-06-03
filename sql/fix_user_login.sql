-- Reparacion para ORA-01017 en la conexion Node.js -> Oracle.
-- Este script reutiliza la creacion idempotente del usuario.
-- Ejecutar como SYSTEM o SYS conectado a XEPDB1:
-- sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
-- @sql/fix_user_login.sql

@sql/create_user.sql
