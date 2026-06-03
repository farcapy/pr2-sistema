-- Sistema Web de Control de Prestamos de Equipos
-- Ejecutar conectado al usuario Oracle del proyecto, por ejemplo GESTION_EQUIPOS.

-- Limpieza opcional para volver a ejecutar el script.
BEGIN EXECUTE IMMEDIATE 'DROP TABLE prestamos CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE equipos CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE personas CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE categorias_equipo CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE usuarios CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_usuarios'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_categorias_equipo'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_equipos'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_personas'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_prestamos'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

CREATE TABLE usuarios (
  id_usuario NUMBER PRIMARY KEY,
  usuario VARCHAR2(50) NOT NULL UNIQUE,
  password VARCHAR2(100) NOT NULL,
  nombre VARCHAR2(100) NOT NULL,
  rol VARCHAR2(30) DEFAULT 'ADMIN' NOT NULL
);

CREATE TABLE categorias_equipo (
  id_categoria NUMBER PRIMARY KEY,
  nombre_categoria VARCHAR2(80) NOT NULL UNIQUE,
  descripcion VARCHAR2(200)
);

CREATE TABLE equipos (
  id_equipo NUMBER PRIMARY KEY,
  nombre_equipo VARCHAR2(100) NOT NULL,
  marca VARCHAR2(80) NOT NULL,
  modelo VARCHAR2(80),
  nro_serie VARCHAR2(80) NOT NULL UNIQUE,
  estado VARCHAR2(20) DEFAULT 'DISPONIBLE' NOT NULL,
  id_categoria NUMBER NOT NULL,
  CONSTRAINT chk_equipos_estado CHECK (estado IN ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO')),
  CONSTRAINT fk_equipos_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias_equipo(id_categoria)
);

CREATE TABLE personas (
  id_persona NUMBER PRIMARY KEY,
  nombre VARCHAR2(80) NOT NULL,
  apellido VARCHAR2(80) NOT NULL,
  documento VARCHAR2(30) NOT NULL UNIQUE,
  tipo_persona VARCHAR2(30) NOT NULL,
  telefono VARCHAR2(30),
  CONSTRAINT chk_personas_tipo CHECK (tipo_persona IN ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'))
);

CREATE TABLE prestamos (
  id_prestamo NUMBER PRIMARY KEY,
  id_equipo NUMBER NOT NULL,
  id_persona NUMBER NOT NULL,
  fecha_prestamo DATE DEFAULT SYSDATE NOT NULL,
  fecha_devolucion_estimada DATE NOT NULL,
  fecha_devolucion_real DATE,
  estado_prestamo VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  observacion VARCHAR2(300),
  CONSTRAINT chk_prestamos_estado CHECK (estado_prestamo IN ('ACTIVO', 'DEVUELTO')),
  CONSTRAINT fk_prestamos_equipo FOREIGN KEY (id_equipo)
    REFERENCES equipos(id_equipo),
  CONSTRAINT fk_prestamos_persona FOREIGN KEY (id_persona)
    REFERENCES personas(id_persona)
);

CREATE SEQUENCE seq_usuarios START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_categorias_equipo START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_equipos START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_personas START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_prestamos START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_usuarios_bi
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  IF :NEW.id_usuario IS NULL THEN
    SELECT seq_usuarios.NEXTVAL INTO :NEW.id_usuario FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_categorias_bi
BEFORE INSERT ON categorias_equipo
FOR EACH ROW
BEGIN
  IF :NEW.id_categoria IS NULL THEN
    SELECT seq_categorias_equipo.NEXTVAL INTO :NEW.id_categoria FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_equipos_bi
BEFORE INSERT ON equipos
FOR EACH ROW
BEGIN
  IF :NEW.id_equipo IS NULL THEN
    SELECT seq_equipos.NEXTVAL INTO :NEW.id_equipo FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_personas_bi
BEFORE INSERT ON personas
FOR EACH ROW
BEGIN
  IF :NEW.id_persona IS NULL THEN
    SELECT seq_personas.NEXTVAL INTO :NEW.id_persona FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_prestamos_bi
BEFORE INSERT ON prestamos
FOR EACH ROW
BEGIN
  IF :NEW.id_prestamo IS NULL THEN
    SELECT seq_prestamos.NEXTVAL INTO :NEW.id_prestamo FROM dual;
  END IF;
END;
/

INSERT INTO usuarios (usuario, password, nombre, rol)
VALUES ('admin', 'admin123', 'Administrador del Sistema', 'ADMIN');

INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Notebook', 'Computadoras portatiles para clases y laboratorios');
INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Proyector', 'Equipos de proyeccion multimedia');
INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Tablet', 'Dispositivos moviles para practicas');

INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Notebook Aula 1', 'Lenovo', 'ThinkPad E14', 'NB-001', 'DISPONIBLE', 1);
INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Proyector Laboratorio', 'Epson', 'X49', 'PR-010', 'DISPONIBLE', 2);
INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Tablet Informatica', 'Samsung', 'Tab A8', 'TB-100', 'MANTENIMIENTO', 3);

INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
VALUES ('Ana', 'Gonzalez', '5001001', 'ESTUDIANTE', '0981111222');
INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
VALUES ('Luis', 'Martinez', '3002002', 'DOCENTE', '0982333444');

COMMIT;
