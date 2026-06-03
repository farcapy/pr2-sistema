# Guia Rapida De Migracion

Esta guia sirve para llevar el proyecto desde una computadora personal a la maquina de la universidad usando GitHub.

## 1. En local

Subir el proyecto a GitHub:

```bash
git init
git add .
git commit -m "Proyecto sistema control equipos"
git branch -M main
git remote add origin https://github.com/farcapy/pr2-sistema.git
git push -u origin main
```

El archivo `.gitignore` evita subir:

```text
node_modules/
.env
*.log
```

## 2. En la notebook de la universidad

Clonar el proyecto:

```bash
git clone https://github.com/farcapy/pr2-sistema.git
cd pr2-sistema
```

Instalar dependencias:

```bash
npm install
```

Crear configuracion local:

```powershell
Copy-Item .env.example .env
```

## 3. Preparar Oracle XE

Entrar como administrador:

```bash
sqlplus system/TU_PASSWORD@localhost:1521/XEPDB1
```

Crear o reparar el usuario:

```sql
@sql/01_create_user.sql
```

Entrar como usuario del proyecto:

```bash
sqlplus gestion_equipos/gestion123@localhost:1521/XEPDB1
```

Crear la base de datos del sistema:

```sql
@sql/02_schema.sql
```

## 4. Ejecutar

```bash
npm run dev
```

Si PowerShell bloquea `npm`, usar:

```powershell
npm.cmd run dev
```

Abrir:

```text
http://localhost:3000
```

Login web:

```text
admin
admin123
```
