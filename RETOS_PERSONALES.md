# Problemas diferentes para cada estudiante

## Cómo funciona

Todos mantienen **36 misiones: 12 iniciales, 12 intermedias y 12 avanzadas**, con sus tiempos y reglas de puntuación. Los 36 modelos generan parámetros propios; las lecciones y tipos de ejercicio siguen siendo comunes.

Cuando una cuenta inicia su primer reto nuevo, Supabase le sortea y reserva una asignación. A partir de ella, cada misión recibe una versión numérica que no se asigna a otra cuenta del mismo proyecto. Las versiones son distintas por sus datos y enunciados; las respuestas numéricas pueden coincidir entre algunos problemas diferentes.

Reintentar, cambiar de computadora o recargar conserva la versión asignada. Así una persona no puede cambiar los datos simplemente cerrando el reto. La práctica y el contrarreloj de esa cuenta usan los mismos datos. El tiempo de cada intento contrarreloj sigue calculándose en la base de datos.

## Capacidad y alcance

Hay **10.000 asignaciones exclusivas por proyecto**, equivalentes a 10.000 versiones distintas de cada una de las 36 misiones. Se verificó que los enunciados generados no se repiten dentro de ese banco. La restricción de unicidad en Supabase reserva una asignación diferente a cada cuenta.

No se vuelven a sortear asignaciones al agotarse el banco. Si se ocupa completo, la aplicación muestra un aviso al administrador. Eliminar una cuenta tampoco libera su asignación para volver a entregarla. Es una capacidad finita, no una promesa de problemas infinitos.

**El estudiante debe iniciar sesión para obtener esta garantía.** Como invitado, recibe una versión local que permanece en ese navegador, pero puede coincidir con la de otro dispositivo. La app lo indica.

## Actualizar lo que ya tienes

1. Ejecuta TODO el nuevo `SUPABASE.sql` en el SQL Editor de tu proyecto Supabase y pulsa Run. Incluye nuevas funciones y una tabla privada de asignaciones.
2. Reemplaza los archivos de la interfaz con los de esta versión. El `config.js` del paquete ya contiene la URL y la clave pública que proporcionaste para tu proyecto.
3. Si ya tienes otro `config.js` actualizado para tu proyecto, conserva esos valores.
4. Publica los archivos actualizados en GitHub Pages y recarga la aplicación.

Las cuentas y resultados anteriores se conservan. Un intento que ya estaba abierto en la versión anterior mantiene su enunciado y su reloj para que pueda terminarse correctamente. Su siguiente intento nuevo usa la asignación exclusiva. La garantía se aplica a los nuevos intentos con el generador personal; no modifica retroactivamente ejercicios ya realizados.

## Comprobarlo con dos estudiantes

1. Inicia sesión con una cuenta A y empieza una misión.
2. En otro navegador, inicia sesión con una cuenta B y empieza la misma misión.
3. Comprueba que los números de la fórmula o del enunciado son distintos.
4. Recarga la cuenta A y vuelve a abrir la misión: recuperará los mismos datos y, si estaba activo, el mismo límite de tiempo.
5. Completa o agota el intento, vuelve a iniciarlo y comprueba que la versión personal continúa siendo la misma.
6. Ambas cuentas mantienen las 36 misiones, aunque los números sean diferentes.

Las pruebas automáticas comprobaron las 360.000 combinaciones del banco, la concordancia entre JavaScript y PostgreSQL, el aislamiento de cuentas, la persistencia de asignaciones y que al agotarse el banco no se repartan duplicados. Estas pruebas se hicieron en una base PostgreSQL local; debes ejecutar el SQL actualizado en tu proyecto real para activar el cambio.
