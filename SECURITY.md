# Seguridad para la plataforma de evaluacion

## Estado actual

La version actual es una app estatica que abre `index.html` directamente en el navegador. Esto sirve para prototipo y pruebas operativas, pero no debe usarse como plataforma privada real con datos sensibles.

Riesgos principales:

- Las credenciales temporales estan dentro de `app.js`.
- Cualquier persona con acceso al archivo puede inspeccionar o modificar la logica.
- Los datos se guardan en `localStorage`, que puede ser leido o alterado desde el navegador.
- El control de permisos ocurre en el cliente; no existe un servidor que lo haga cumplir.
- No hay cifrado de datos en reposo, politica de contrasenas, bitacora protegida ni sesiones seguras.

## Requisito para una version segura

Para operar con datos sensibles, la app debe pasar a una arquitectura con servidor:

1. Autenticacion en backend
   - Usuarios y contrasenas no deben estar en el frontend.
   - Las contrasenas deben guardarse con hash seguro y salt.
   - El login debe devolver una sesion segura, no credenciales visibles.

2. Permisos en backend
   - El servidor debe verificar si el usuario es evaluador o administrador en cada accion.
   - El frontend puede ocultar botones, pero el backend debe bloquear acciones no permitidas.

3. Sesiones protegidas
   - Cookies `HttpOnly`, `Secure` y `SameSite`.
   - Expiracion de sesion por inactividad.
   - Cierre de sesion real en servidor.

4. Datos centralizados
   - Las evaluaciones deben guardarse en una base de datos o archivo protegido en servidor.
   - No deben depender de `localStorage` como fuente principal.

5. Auditoria
   - Registrar quien califica, quien corrige, fecha, estacion, participante y valores modificados.
   - Los administradores pueden consultar auditoria; evaluadores no.

6. Transporte seguro
   - Publicar solo por HTTPS.
   - Evitar compartir la app por archivos sueltos cuando se manejen datos reales.

7. Protecciones adicionales
   - Intentos fallidos limitados.
   - Contrasenas fuertes.
   - Respaldos periodicos.
   - Exportaciones solo para administradores.
   - Politica clara de acceso para evaluadores por estacion o por equipo, si aplica.

## Camino recomendado

Convertir el prototipo actual en una aplicacion cliente-servidor:

- Frontend: conservar la interfaz actual.
- Backend: API para login, candidatos, evaluaciones, resultados y auditoria.
- Base de datos: SQLite para una instalacion sencilla local/red interna, o PostgreSQL/MySQL para despliegue formal.
- Despliegue: servidor institucional o nube con HTTPS.

## Medidas temporales si solo se usara para prueba interna

Estas medidas ayudan, pero no hacen segura la plataforma:

- Usar una computadora controlada por el equipo organizador.
- No cargar datos personales reales en pruebas.
- Exportar y respaldar al final de cada jornada.
- Borrar datos del navegador al terminar.
- No distribuir los archivos fuente a evaluadores.

La version estatica debe tratarse como prototipo, no como sistema final de produccion.
