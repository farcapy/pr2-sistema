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

-- Tabla de usuarios autorizados para iniciar sesion en el sistema.
CREATE TABLE usuarios (
  -- Clave primaria del usuario.
  id_usuario NUMBER PRIMARY KEY,
  -- Nombre de usuario usado en el login.
  usuario VARCHAR2(50) NOT NULL UNIQUE,
  -- Password usado en el login de demostracion.
  password VARCHAR2(100) NOT NULL,
  -- Nombre completo o descriptivo del usuario.
  nombre VARCHAR2(100) NOT NULL,
  -- Rol del usuario dentro del sistema.
  rol VARCHAR2(30) DEFAULT 'ADMIN' NOT NULL
);

-- Tabla catalogo para clasificar equipos.
CREATE TABLE categorias_equipo (
  -- Clave primaria de la categoria.
  id_categoria NUMBER PRIMARY KEY,
  -- Nombre unico de la categoria, por ejemplo Notebook.
  nombre_categoria VARCHAR2(80) NOT NULL UNIQUE,
  -- Descripcion opcional de la categoria.
  descripcion VARCHAR2(200)
);

-- Tabla principal del CRUD obligatorio.
CREATE TABLE equipos (
  -- Clave primaria del equipo.
  id_equipo NUMBER PRIMARY KEY,
  -- Nombre identificable del equipo.
  nombre_equipo VARCHAR2(100) NOT NULL,
  -- Marca del equipo.
  marca VARCHAR2(80) NOT NULL,
  -- Modelo del equipo; puede ser nulo.
  modelo VARCHAR2(80),
  -- Numero de serie unico para evitar duplicados.
  nro_serie VARCHAR2(80) NOT NULL UNIQUE,
  -- Estado actual del equipo.
  estado VARCHAR2(20) DEFAULT 'DISPONIBLE' NOT NULL,
  -- Categoria a la que pertenece el equipo.
  id_categoria NUMBER NOT NULL,
  -- Restriccion para permitir solo estados validos.
  CONSTRAINT chk_equipos_estado CHECK (estado IN ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO')),
  -- Clave foranea hacia categorias_equipo.
  CONSTRAINT fk_equipos_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias_equipo(id_categoria)
);

-- Tabla de personas que pueden solicitar prestamos.
CREATE TABLE personas (
  -- Clave primaria de persona.
  id_persona NUMBER PRIMARY KEY,
  -- Nombre de la persona.
  nombre VARCHAR2(80) NOT NULL,
  -- Apellido de la persona.
  apellido VARCHAR2(80) NOT NULL,
  -- Documento unico para evitar registros duplicados.
  documento VARCHAR2(30) NOT NULL UNIQUE,
  -- Tipo de persona dentro de la institucion.
  tipo_persona VARCHAR2(30) NOT NULL,
  -- Telefono de contacto opcional.
  telefono VARCHAR2(30),
  -- Restriccion para aceptar solo tipos definidos.
  CONSTRAINT chk_personas_tipo CHECK (tipo_persona IN ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'))
);

-- Tabla que registra prestamos y devoluciones.
CREATE TABLE prestamos (
  -- Clave primaria del prestamo.
  id_prestamo NUMBER PRIMARY KEY,
  -- Equipo prestado.
  id_equipo NUMBER NOT NULL,
  -- Persona que recibe el equipo.
  id_persona NUMBER NOT NULL,
  -- Fecha real del prestamo; por defecto fecha actual de Oracle.
  fecha_prestamo DATE DEFAULT SYSDATE NOT NULL,
  -- Fecha estimada de devolucion.
  fecha_devolucion_estimada DATE NOT NULL,
  -- Fecha real de devolucion; queda nula hasta devolver.
  fecha_devolucion_real DATE,
  -- Estado del prestamo: ACTIVO o DEVUELTO.
  estado_prestamo VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  -- Observacion opcional.
  observacion VARCHAR2(300),
  -- Restriccion para estados validos del prestamo.
  CONSTRAINT chk_prestamos_estado CHECK (estado_prestamo IN ('ACTIVO', 'DEVUELTO')),
  -- Clave foranea hacia equipos.
  CONSTRAINT fk_prestamos_equipo FOREIGN KEY (id_equipo)
    REFERENCES equipos(id_equipo),
  -- Clave foranea hacia personas.
  CONSTRAINT fk_prestamos_persona FOREIGN KEY (id_persona)
    REFERENCES personas(id_persona)
);

-- Secuencias para generar ids numericos automaticamente.
CREATE SEQUENCE seq_usuarios START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_categorias_equipo START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_equipos START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_personas START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_prestamos START WITH 1 INCREMENT BY 1 NOCACHE;

-- Trigger que asigna id_usuario si no se envia manualmente.
CREATE OR REPLACE TRIGGER trg_usuarios_bi
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  -- Si el id viene nulo, toma el siguiente valor de la secuencia.
  IF :NEW.id_usuario IS NULL THEN
    SELECT seq_usuarios.NEXTVAL INTO :NEW.id_usuario FROM dual;
  END IF;
END;
/

-- Trigger que asigna id_categoria automaticamente.
CREATE OR REPLACE TRIGGER trg_categorias_bi
BEFORE INSERT ON categorias_equipo
FOR EACH ROW
BEGIN
  -- Si el id viene nulo, toma el siguiente valor de la secuencia.
  IF :NEW.id_categoria IS NULL THEN
    SELECT seq_categorias_equipo.NEXTVAL INTO :NEW.id_categoria FROM dual;
  END IF;
END;
/

-- Trigger que asigna id_equipo automaticamente.
CREATE OR REPLACE TRIGGER trg_equipos_bi
BEFORE INSERT ON equipos
FOR EACH ROW
BEGIN
  -- Si el id viene nulo, toma el siguiente valor de la secuencia.
  IF :NEW.id_equipo IS NULL THEN
    SELECT seq_equipos.NEXTVAL INTO :NEW.id_equipo FROM dual;
  END IF;
END;
/

-- Trigger que asigna id_persona automaticamente.
CREATE OR REPLACE TRIGGER trg_personas_bi
BEFORE INSERT ON personas
FOR EACH ROW
BEGIN
  -- Si el id viene nulo, toma el siguiente valor de la secuencia.
  IF :NEW.id_persona IS NULL THEN
    SELECT seq_personas.NEXTVAL INTO :NEW.id_persona FROM dual;
  END IF;
END;
/

-- Trigger que asigna id_prestamo automaticamente.
CREATE OR REPLACE TRIGGER trg_prestamos_bi
BEFORE INSERT ON prestamos
FOR EACH ROW
BEGIN
  -- Si el id viene nulo, toma el siguiente valor de la secuencia.
  IF :NEW.id_prestamo IS NULL THEN
    SELECT seq_prestamos.NEXTVAL INTO :NEW.id_prestamo FROM dual;
  END IF;
END;
/

-- Usuario de prueba para ingresar al sistema web.
INSERT INTO usuarios (usuario, password, nombre, rol)
VALUES ('admin', 'admin123', 'Administrador del Sistema', 'ADMIN');

-- Categorias iniciales para cargar selects y clasificar equipos.
INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Notebook', 'Computadoras portatiles para clases y laboratorios');
INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Proyector', 'Equipos de proyeccion multimedia');
INSERT INTO categorias_equipo (nombre_categoria, descripcion)
VALUES ('Tablet', 'Dispositivos moviles para practicas');

-- Equipos iniciales para probar el CRUD y los prestamos.
INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Notebook Aula 1', 'Lenovo', 'ThinkPad E14', 'NB-001', 'DISPONIBLE', 1);
INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Proyector Laboratorio', 'Epson', 'X49', 'PR-010', 'DISPONIBLE', 2);
INSERT INTO equipos (nombre_equipo, marca, modelo, nro_serie, estado, id_categoria)
VALUES ('Tablet Informatica', 'Samsung', 'Tab A8', 'TB-100', 'MANTENIMIENTO', 3);

-- Personas iniciales para registrar prestamos.
INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
VALUES ('Ana', 'Gonzalez', '5001001', 'ESTUDIANTE', '0981111222');
INSERT INTO personas (nombre, apellido, documento, tipo_persona, telefono)
VALUES ('Luis', 'Martinez', '3002002', 'DOCENTE', '0982333444');

-- Confirma todos los inserts de datos de prueba.
COMMIT;
