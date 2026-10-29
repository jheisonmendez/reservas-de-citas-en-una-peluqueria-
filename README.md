# Barbería Reservas — Reserva de citas en una barbería

Solución de software para el **problema 2** de la actividad de diseño (SENA – ADSO).
El proyecto está dividido en **proyectos independientes** que se comunican por una
**API REST** (igual que un proyecto Laravel con su frontend separado).

## Estructura del proyecto

```
Reserva de citas en una barbería/
├── backend/                 ← BACKEND (API REST, Node.js + Express, puerto 4000)
│   ├── server.js            ← punto de entrada
│   ├── .env                 ← puerto, MongoDB, secretos, orígenes CORS
│   ├── iniciar.cmd          ← doble clic para arrancar
│   ├── package.json
│   ├── src/
│   │   ├── config.js        ← carga del .env y valores por defecto
│   │   ├── controllers/     ← lógica de negocio (auth, servicio, barbero, horario, cita)
│   │   ├── models/          ← esquemas de MongoDB (Usuario, Servicio, Barbero, Horario, Cita)
│   │   ├── routes/          ← definición de endpoints + protección por rol
│   │   ├── middleware/      ← auth (JWT), CORS y manejo de errores
│   │   ├── utils/           ← cálculos de fecha y hora
│   │   └── seed.js          ← datos de ejemplo
│   └── scripts/             ← pruebas de la API y consola de MongoDB
│
├── frontend/                ← FRONTEND WEB (panel del administrador, puerto 5173)
│   ├── servidor.js          ← servidor estático (sin dependencias)
│   ├── config.js            ← URL del backend al que se conecta
│   ├── index.html           ← página de inicio
│   ├── iniciar.cmd
│   └── web/                 ← index.html, estilos.css, app.js
│
├── movil/                   ← APLICACIÓN MÓVIL (cliente, puerto 5174)
│   ├── servidor.js          ← servidor estático (sin dependencias)
│   ├── config.js            ← URL del backend al que se conecta
│   ├── index.html, estilos.css, app.js
│   └── iniciar.cmd
│
├── database/                ← BASE DE DATOS MongoDB (script y comandos)
│   ├── iniciar.js           ← crea colecciones, índices y datos
│   ├── iniciar-mongo.cmd    ← doble clic: crea la BD con mongosh
│   └── COMANDOS_MONGO.md    ← comandos para capturas en CMD
│
└── INICIAR_TODO.cmd         ← arranca backend + frontend + móvil en 3 ventanas
```

## Cómo se conectan entre sí

```
┌─────────────────┐   HTTP + CORS    ┌─────────────────────┐    Mongoose     ┌────────────┐
│ Frontend web    │ ───────────────► │                     │ ──────────────► │            │
│ :5173           │   fetch JSON     │  BACKEND (API REST) │                 │  MongoDB   │
├─────────────────┤                  │  :4000 /api         │                 │  barberia  │
│ App móvil       │ ───────────────► │  Express + JWT      │                 │  :27017    │
│ :5174           │                  │                     │                 │            │
└─────────────────┘                  └─────────────────────┘                 └────────────┘
```

- Cada interfaz declara su backend en **`config.js`**: `const API_BASE = 'http://localhost:4000/api'`.
- El backend autoriza esos orígenes en **`backend/.env`** (`ORIGENES_CORS`) mediante el middleware CORS.

## Puesta en marcha

**Opción A — doble clic en `INICIAR_TODO.cmd`** (abre las 3 ventanas).

**Opción B — una por una (CMD):**

```cmd
cd /d "C:\Users\PC\Downloads\Reserva de citas en una barbería"

:: 1. Backend
cd backend
npm install
npm run seed
npm start                 :: API en http://localhost:4000/api

:: 2. Frontend web (otra ventana)
cd ..\frontend
npm start                 :: http://localhost:5173/web/

:: 3. Aplicación móvil (otra ventana)
cd ..\movil
npm start                 :: http://localhost:5174/
```

### Credenciales

| Interfaz | Correo | Contraseña | Rol |
|---|---|---|---|
| Web | `admin@barberia.com` | `admin123` | administrador |
| Móvil | `cliente@demo.com` | `cliente123` | cliente |
| Móvil | `andres@demo.com` | `cliente123` | cliente |

## Base de datos en CMD

MongoDB **no es parte de XAMPP**: es un servicio de Windows (servicio `MongoDB`) y
la base de datos se llama **`barberia`**.

```cmd
:: crear la base de datos con datos de ejemplo
database\iniciar-mongo.cmd

:: conectarse desde CMD al nombre de la base de datos
mongosh mongodb://127.0.0.1:27017/barberia

:: o entrar primero y luego elegir la base de datos
mongosh
use barberia
show collections
db.citas.find().pretty()
db.citas.getIndexes()
```

Comandos completos y orden de capturas: **`database/COMANDOS_MONGO.md`**.

## Verificación

```cmd
cd backend
npm run pruebas        :: 17 pruebas de la API (roles, validaciones, reglas de negocio)
npm run mongo:consola  :: colecciones, índices y prueba E11000 en MongoDB
```

## Reglas de negocio implementadas

1. Un barbero **no puede tener dos citas activas en el mismo horario** (validación en la API **y** índice único parcial en MongoDB).
2. No se puede reservar un horario que **se cruce** con una cita existente (según la duración del servicio).
3. La cita debe estar dentro de un **bloque de disponibilidad** del barbero para ese día.
4. No se agendan **fechas en el pasado**.
5. **Cancelar libera el horario** (`activa: false`), y la hora vuelve a aparecer en la app móvil.
6. El cliente solo ve y cancela **sus propias citas**; el administrador gestiona todas.
7. Solo el administrador administra servicios, barberos y horarios.

## Tecnologías

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend web | HTML5, CSS3 y JavaScript | Entrega ligera y fácil de desplegar |
| Aplicación móvil | Interfaz móvil (PWA) que consume la misma API | Reutiliza la API y funciona en cualquier celular |
| Backend | Node.js + Express (estructura MVC: routes → controllers → models) | API REST clara, un solo lenguaje en el servidor |
| Seguridad | JWT + bcrypt + middleware de roles y CORS | Sesiones verificables y acceso controlado |
| Base de datos | MongoDB + Mongoose | Esquema flexible para citas, horarios y catálogo |
