# Comandos de MongoDB para capturas de pantalla

Estos comandos se ejecutan en **CMD o PowerShell** y muestran la base de datos del
proyecto (`barberia`). El shell de MongoDB (`mongosh`) ya está instalado en el equipo;
si abres una **ventana de CMD nueva** después de instalarlo, el comando `mongosh` se
reconoce directamente.

> Si por algún motivo `mongosh` no se reconoce, usa la ruta completa:
> `C:\Users\PC\AppData\Local\Programs\mongosh\mongosh.exe`
> o la alternativa en Node: `npm run mongo:consola`

---

## A. Preparación (una sola vez)

```cmd
cd /d "C:\Users\PC\Downloads\Reserva de citas en una barbería"
npm install
npm run seed
```

`npm run seed` crea la base de datos con datos de ejemplo (usuarios, servicios,
barberos, horarios y citas) y los índices.

---

## B. Captura 1 — Conexión y colecciones

```cmd
mongosh
```

Dentro de la consola de mongosh:

```js
use barberia
show dbs
show collections
db.getCollectionNames()
db.servicios.countDocuments()
db.barberos.countDocuments()
db.usuarios.countDocuments()
db.horarios.countDocuments()
db.citas.countDocuments()
```

---

## C. Captura 2 — Consulta de los datos almacenados

```js
db.servicios.find().pretty()
db.barberos.find().pretty()
db.horarios.find({ diaSemana: 6 }).pretty()
db.citas.find().pretty()
db.usuarios.find({}, { nombre: 1, email: 1, rol: 1 }).pretty()
```

---

## D. Captura 3 — Índices y regla de negocio en la base de datos

```js
db.citas.getIndexes()
db.horarios.getIndexes()
db.usuarios.getIndexes()
```

La base de datos tiene un **índice único parcial** sobre `barbero + fecha + hora`
solo para las citas con `activa: true`. Ese índice es la garantía de que **dos
reservas para el mismo barbero en el mismo horario son imposibles**, incluso si dos
personas intentan reservar al mismo tiempo desde la web y desde la aplicación móvil.

---

## E. Captura 4 — Prueba de la regla "no duplicar horarios"

Con `npm run seed` ejecutado (crea una cita de ejemplo), intenta insertar una cita
idéntica:

```js
const c = db.citas.findOne({ activa: true })
db.citas.insertOne({
  cliente: c.cliente,
  barbero: c.barbero,
  servicio: c.servicio,
  fecha: c.fecha,
  hora: c.hora,
  activa: true,
  estado: "pendiente",
  duracionMin: 30
})
```

Resultado esperado (captura este error):

```
MongoServerError: E11000 duplicate key error collection: barberia.citas index: unicidad_cita_activa dup key: { barbero: ObjectId(...), fecha: "2026-10-29", hora: "10:00" }
```

> El nombre del índice puede aparecer como `unicidad_cita_activa` o como
> `barbero_1_fecha_1_hora_1` según el orden en que se haya creado; en ambos casos
> corresponde al índice único parcial sobre `barbero + fecha + hora`.

---

## F. Captura 5 — Cancelar libera el horario

```js
db.citas.updateOne(
  { _id: c._id },
  { $set: { estado: "cancelada", activa: false } }
)

// Ya se puede volver a reservar la misma hora:
db.citas.find({ barbero: c.barbero, fecha: c.fecha, activa: true })
```

---

## G. Captura 6 — Estado final de la base de datos

```js
db.citas.find({ activa: true }).pretty()
db.stats()
exit
```

---

## Alternativa sin mongosh (si prefieres Node)

```cmd
npm run mongo:consola
```

Muestra las colecciones, los índices, los documentos de ejemplo y ejecuta la misma
prueba de la regla de negocio, con el error `E11000` que impide la reserva duplicada.

---

## Orden sugerido de capturas

| # | Comando | Qué demuestra |
|---|---------|---------------|
| 1 | `npm run seed` | Creación de la base de datos y sus colecciones |
| 2 | `mongosh` + `use barberia` + `show collections` | Existencia de la base de datos |
| 3 | `db.citas.find().pretty()` | Almacenamiento de la información |
| 4 | `db.citas.getIndexes()` | Índice único que impide reservas duplicadas |
| 5 | `insertOne` duplicado | Error `E11000` = regla de negocio verificada |
| 6 | `updateOne` (cancelar) + `find` | La cancelación libera el horario |
