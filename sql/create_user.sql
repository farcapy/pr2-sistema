-- 01_create_user.sql / create_user.sql
-- Crea o repara el usuario Oracle del proyecto.
--
-- Ejecutar como SYSTEM o SYS conectado a XEPDB1:
-- sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
-- @sql/create_user.sql

SET SERVEROUTPUT ON;

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM all_users
  WHERE username = 'GESTION_EQUIPOS';

  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE USER gestion_equipos IDENTIFIED BY gestion123';
    DBMS_OUTPUT.PUT_LINE('Usuario GESTION_EQUIPOS creado.');
  ELSE
    EXECUTE IMMEDIATE 'ALTER USER gestion_equipos IDENTIFIED BY gestion123 ACCOUNT UNLOCK';
    DBMS_OUTPUT.PUT_LINE('Usuario GESTION_EQUIPOS existente: password reiniciado y cuenta desbloqueada.');
  END IF;
END;
/

GRANT CREATE SESSION TO gestion_equipos;
GRANT CREATE TABLE TO gestion_equipos;
GRANT CREATE SEQUENCE TO gestion_equipos;
GRANT CREATE TRIGGER TO gestion_equipos;
GRANT CREATE VIEW TO gestion_equipos;
GRANT UNLIMITED TABLESPACE TO gestion_equipos;

PROMPT Usuario Oracle listo: gestion_equipos / gestion123
