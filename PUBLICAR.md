# Publicar en GitHub Pages y activar Supabase

## 1. Publicar la página

1. Descomprime el ZIP en una carpeta nueva.
2. En GitHub, crea un repositorio, por ejemplo `derivada-lab`. Un repositorio público permite usar GitHub Pages con los planes que lo admiten sin requisitos adicionales de repositorios privados.
3. Pulsa **Add file → Upload files** y sube **el contenido de la carpeta**, no el ZIP. `index.html` debe quedar directamente en la raíz del repositorio, al lado de `styles.css`, `config.js` y los demás archivos. Conserva las carpetas `icons` y `tests`.
4. Confirma la subida con Commit changes.
5. Abre **Settings → Pages**.
6. En Source, elige **Deploy from a branch**. Selecciona **main** y **/ (root)** y guarda.
7. Espera a que GitHub muestre la dirección publicada y ábrela. Habitualmente tendrá la forma `https://TU-USUARIO.github.io/derivada-lab/`, según tu usuario y repositorio.

El archivo `.nojekyll` evita el procesamiento Jekyll; inclúyelo si tu método de subida lo permite. Las rutas de recursos son relativas para funcionar en la subcarpeta del repositorio.

En este punto puedes probar toda la experiencia como Invitado. Para activar las cuentas, continúa.

## 2. Crear el proyecto Supabase

1. En https://supabase.com crea o abre tu cuenta.
2. Crea un proyecto y espera a que esté listo.
3. Conserva la contraseña de la base de datos en un lugar privado; no se coloca en esta aplicación.
4. Abre el SQL Editor, pega **todo** el contenido de `SUPABASE.sql` y ejecútalo.
5. Comprueba que no aparezcan errores. El script crea las tablas `dl_results` y `dl_attempts`, políticas RLS y las funciones `dl_start`, `dl_answer`, `dl_hint` y `dl_history`.

El script puede ejecutarse de nuevo sin borrar los datos de esas tablas. No desactives RLS para resolver un problema de acceso.

## 3. Completar config.js

En la configuración/API del proyecto copia la **Project URL** y la clave **publishable** (`sb_publishable_...`) o la clave pública **anon** heredada.

Edita `config.js` en tu repositorio:

```js
window.DERIVADA_CONFIG={
 supabaseUrl:'https://TU-PROYECTO.supabase.co',
 supabasePublicKey:'TU-CLAVE-PUBLICA'
};
```

Estos dos valores son públicos y pueden aparecer en GitHub con las políticas del SQL activas. **Nunca uses `service_role`, una clave `sb_secret_...`, la contraseña de la base de datos ni datos SMTP.** La aplicación rechaza los tipos secretos conocidos.

Guarda los cambios en GitHub y espera a que Pages actualice la página. `config.js` se solicita en línea para evitar que quede almacenada una configuración vacía antigua.

## 4. Configurar registro y enlaces de retorno

En **Authentication** de Supabase:

1. Habilita el proveedor Email con contraseña.
2. Mantén activa la confirmación de email si quieres verificar las direcciones.
3. En URL Configuration, establece **Site URL** con la dirección publicada exacta de tu app, incluyendo la subcarpeta y la barra final, por ejemplo `https://TU-USUARIO.github.io/derivada-lab/`.
4. Añade esa misma dirección a **Redirect URLs**.
5. Si pruebas localmente, añade también `http://localhost:8000/` o la URL exacta de Live Server que uses.

No necesitas crear una página `reset-password.html`: el enlace vuelve a `index.html`, la aplicación recoge la sesión de recuperación y abre el formulario de contraseña nueva. Debes conservar las plantillas de enlace de Supabase compatibles con este flujo estándar.

## 5. Configurar el envío de correos

Para enviar confirmaciones y recuperaciones a estudiantes, configura **Custom SMTP** en Supabase con tu proveedor de correo. Esas credenciales se guardan exclusivamente en Supabase.

El servicio de correo predeterminado de Supabase está orientado a pruebas y restringe los destinatarios a miembros del equipo del proyecto. Por eso, llenar `config.js` por sí solo no garantiza que se entreguen correos a cualquier estudiante.

Conserva la confirmación de correo y prueba que se reciben tanto el enlace de alta como el de recuperación antes de invitar a personas. Si el proyecto tiene CAPTCHA activado, este cliente todavía no incluye un widget CAPTCHA: debes integrarlo antes de usar ese ajuste con la aplicación.

## Actualizar desde una versión anterior

Conserva la URL y clave pública que ya colocaste en `config.js`. Reemplaza los archivos de la interfaz y vuelve a ejecutar completo el nuevo `SUPABASE.sql` para activar las versiones personales exclusivas de las 36 misiones. Consulta también `RETOS_PERSONALES.md`. La actualización conserva las filas de intentos y resultados anteriores.

## 6. Comprobar que funciona

1. Crea una cuenta A desde la página publicada y confirma el correo.
2. Inicia sesión y resuelve un reto. Espera a ver «Progreso guardado en tu cuenta».
3. Abre otro navegador o celular, entra con la cuenta A y verifica el reto resuelto.
4. Crea una cuenta B y comprueba que empieza sin los resultados de A.
5. Inicia un reto, recarga y vuelve a abrirlo: al comenzar debe recuperar el intento y su fecha límite.
6. Prueba la práctica libre: no debe sumar puntos.
7. Sal y usa «Recuperar mi acceso». Abre el correo, sigue el enlace y guarda una contraseña nueva.
8. Verifica el diseño en celular y la instalación desde un navegador compatible.

## Si algo falla

| Problema | Qué revisar |
| --- | --- |
| Solo permite Invitado | Que `config.js` contenga URL y clave pública válidas y se haya actualizado Pages |
| No llega el correo | Custom SMTP, destinatario permitido, spam y límites del proveedor |
| No vuelve a la aplicación | Site URL y Redirect URLs con la subcarpeta correcta |
| Ingresa pero no guarda resultados | Que se haya ejecutado completo `SUPABASE.sql` y la Data API esté habilitada para el esquema público |
| Se ven archivos en lugar de la página | Que `index.html` esté en la raíz seleccionada para Pages |
| Se ve una versión anterior | Recarga, cierra otras pestañas de la app y vuelve a abrirla |

No se han creado un repositorio ni un proyecto Supabase en tu cuenta como parte de esta entrega. Debes completar esos pasos en tus cuentas.

Documentación oficial:
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
