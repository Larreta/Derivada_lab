# Derivada Lab · GitHub Pages

Versión estática en HTML, CSS y JavaScript, con cuentas y progreso mediante Supabase. Mantiene las tres rutas, 36 misiones (12 por nivel), variantes de ejercicios, cronómetros, medallas, práctica libre, seis lecciones, historial y laboratorio gráfico.

**Esta versión se publica en GitHub Pages. No necesita Node.js, un servidor propio ni npm para funcionar.**

## Publicar y activar las cuentas

Sigue `PUBLICAR.md` en este orden:

1. Sube los archivos a la raíz de un repositorio y activa GitHub Pages.
2. Crea tu proyecto Supabase y ejecuta `SUPABASE.sql` en su SQL Editor.
3. Coloca la URL y la clave pública de ese proyecto en `config.js`.
4. Configura las direcciones de retorno y los correos en Supabase.
5. Prueba registro, confirmación, login, recuperación y resultados desde dos dispositivos.

El `config.js` de este paquete incluye la URL y la clave pública que proporcionaste para tu proyecto Supabase. La nueva lógica de retos personales se activa al ejecutar el SQL actualizado. La publicación en GitHub y la prueba final de registro/correos siguen dependiendo de la configuración de tus cuentas.

## Probar en Visual Studio Code

Abre la carpeta descomprimida y usa una extensión de servidor estático, como Live Server: clic derecho en `index.html` → Open with Live Server.

Si ya tienes Python instalado, también puedes abrir una terminal en la carpeta y ejecutar:

```powershell
py -m http.server 8000
```

Luego visita http://localhost:8000/ y deja la terminal abierta. En macOS/Linux puedes usar `python3 -m http.server 8000`.

Añade esa dirección exacta a las redirecciones permitidas de Supabase si pruebas cuentas localmente. Abrir `index.html` con doble clic no sirve para probar la instalación PWA.

## Qué se guarda

- **Con cuenta:** resultados, mejores tiempos e historial de intentos en Supabase. Los retos contrarreloj se reanudan desde la base de datos si todavía están activos.
- **Como invitado:** resultados y reloj en el navegador, por nombre. No hay sincronización ni protección con contraseña.
- **Lecciones leídas y tema:** preferencias locales del navegador.
- **Descargar progreso:** exporta un informe JSON. No incluye contraseñas ni tokens y no es una función de importación o recuperación de cuentas.

Las cuentas de la versión anterior con servidor Node.js no se migran automáticamente: los estudiantes deben registrarse en el proyecto Supabase. Los códigos de recuperación antiguos no se usan; esta versión recupera el acceso mediante correo.

## Retos

El tiempo se ajusta a cada ejercicio: Inicial entre 1:30 y 2:30 minutos, Intermedio entre 3 y 4 minutos y Avanzado entre 5 y 7 minutos. Cada tarjeta muestra su duración exacta. La práctica libre no tiene límite ni suma XP.

Por completar un reto contrarreloj se obtienen 100 XP y hasta 50 extra por rapidez sin pista. Se conserva la mejor puntuación de cada misión; repetirla no duplica puntos. Las 36 misiones generan versiones personales. Supabase reserva una asignación exclusiva a cada cuenta; reintentar o cambiar de dispositivo conserva sus datos. Consulta `RETOS_PERSONALES.md`: el banco admite 10.000 asignaciones por proyecto y no reparte duplicados al agotarse. El modo Invitado tiene versiones locales sin garantía de exclusividad entre dispositivos.

Para cuentas, las funciones SQL validan la respuesta y calculan tiempos y puntos. Los usuarios solo pueden leer sus propias filas. No pueden escribir directamente los resultados desde la API. Sigue siendo una herramienta educativa con soluciones accesibles en el código, no un sistema de vigilancia para exámenes.

## Actualizar una versión anterior

Si ya configuraste Supabase, conserva tus valores de `config.js`. Sube los demás archivos actualizados y vuelve a ejecutar completo `SUPABASE.sql`: amplía las restricciones para activar las asignaciones exclusivas de las 36 misiones sin borrar los resultados anteriores. El archivo `INSTALAR_ESTUDIANTE.md` explica cómo compartir e instalar la aplicación.

## Instalación y modo sin conexión

La app tiene manifiesto, iconos y service worker. Se instala desde HTTPS, como GitHub Pages, en navegadores compatibles. En iPhone/iPad: Safari → Compartir → Añadir a pantalla de inicio.

Tras la primera carga, el modo Invitado, las lecciones y el laboratorio pueden usarse sin conexión. Las cuentas y los retos cronometrados con cuenta necesitan internet. La práctica libre de una cuenta ya abierta puede continuar localmente sin sumar XP.

## Seguridad y sesión

Supabase Auth administra las contraseñas. El cliente conserva los tokens de sesión en `sessionStorage`, solo para esa pestaña; nunca guarda la contraseña. Al cerrarla, normalmente tendrás que iniciar sesión de nuevo. Al salir se eliminan los tokens locales y se intenta cerrar la sesión en Supabase.

La URL y la clave publishable/anon son públicas. No incluyas claves `service_role`, `sb_secret_...`, contraseñas de la base de datos ni credenciales SMTP en el código. `SUPABASE.sql` activa políticas de acceso y limita las funciones a usuarios autenticados.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html`, `styles.css` | Interfaz y diseño adaptable |
| `retos.js`, `game-core.js` | Ejercicios, variantes y reglas locales |
| `app.js`, `pro.js` | Retos, rutas, gráficas y lecciones |
| `cloud.js` | Supabase Auth y llamadas a las funciones SQL |
| `config.js` | URL y clave pública de tu proyecto |
| `SUPABASE.sql` | Tablas, permisos y funciones de retos |
| `sw.js`, `manifest.webmanifest`, `icons/` | Instalación y caché |
| `PUBLICAR.md` | Guía de publicación y activación |

Si cambias coeficientes, respuestas, variantes o tiempos de retos, actualiza también sus equivalentes en `SUPABASE.sql`. Para las versiones personales se usa `expected_answer_v2`; `expected_answer` conserva los intentos de versiones anteriores. Vuelve a ejecutar el SQL después de los cambios. Navegador y base de datos deben calcular lo mismo. Las pruebas SQL comparan ambas implementaciones; las pruebas matemáticas comprueban las 360.000 combinaciones del banco.

## Validación

Se probaron los controles con un DOM simulado, el cliente Supabase con respuestas simuladas y las funciones SQL sobre PostgreSQL local mediante PGlite. Se comprobaron variantes, pistas, puntos, vencimiento, práctica, reanudación e independencia de cuentas mediante RLS. También se comprobó que los usuarios no pueden modificar los puntos directamente.

Falta la prueba contra TU proyecto Supabase, la entrega real de correos y la publicación en TU repositorio, porque no se han configurado esas cuentas. La revisión visual completa en el navegador de destino y la instalación deben comprobarse al publicar.

Pruebas opcionales para desarrolladores con Node.js 20 o superior:

```sh
npm test
```

Para ejecutar además la integración SQL:

```sh
npm install
npm run test:sql
```

Las dependencias de desarrollo se usan solo en las pruebas. No son necesarias para GitHub Pages ni se debe subir `node_modules`.
