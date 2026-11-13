# 📊 Sistema de Reportes y Asistencia para Estacas

Aplicación web moderna desarrollada en Angular y Supabase para llevar el control estadístico de asistencia semanal, análisis trimestral y seguimiento de conversos en las unidades (barrios/ramas) de una estaca.

## 🚀 Guía de Instalación Rápida (Despliegue Independiente)

Sigue estos 3 pasos para tener tu propia instancia del sistema funcionando de forma 100% gratuita.

### Paso 1: Configurar la Base de Datos (Supabase)
1. Crea una cuenta gratuita en [Supabase](https://supabase.com) y haz clic en **"New Project"**.
2. Ve al menú lateral izquierdo y selecciona el **SQL Editor**.
3. Haz clic en **"New Query"**, copia todo el contenido del archivo `schema.sql` que está en este repositorio y pégalo allí.
4. Presiona el botón verde **"RUN"**. Esto creará todas las tablas necesarias.
5. *(Opcional)*: En Supabase, ve a la tabla `estaca_unidades` y edita los nombres de los barrios ("Barrio 1", "Barrio 2", etc.) por los nombres reales de las unidades de tu estaca.

### Paso 2: Crear el Usuario de Acceso (Login)
1. En tu panel de Supabase, ve a **Authentication** -> **Users**.
2. Haz clic en **Add User** -> **Create User**.
3. Ingresa un correo y una contraseña segura, y marca la casilla **"Auto Confirm User"**. (Estas serán las credenciales para entrar al sistema).

### Paso 3: Desplegar la Aplicación (Vercel)
1. Haz un Fork (o "Use this template") de este repositorio a tu propia cuenta de GitHub.
2. Inicia sesión en [Vercel](https://vercel.com) con tu cuenta de GitHub.
3. Haz clic en **"Add New Project"** e importa el repositorio que acabas de copiar.
4. En la configuración del proyecto, busca la sección **Environment Variables** y añade las siguientes dos variables:
   * **`SUPABASE_URL`**: *(Ve a Supabase -> Project Settings -> API y copia la "Project URL")*
   * **`SUPABASE_KEY`**: *(En la misma pantalla, copia la clave "anon public")*
5. Haz clic en **Deploy**. 

¡Listo! En un par de minutos, Vercel te entregará un enlace público (ej. `mi-estaca.vercel.app`). Ingresa con el correo y contraseña que creaste en el Paso 2 y comienza a utilizar el sistema.

## 🛠️ Stack Tecnológico
* **Frontend:** Angular 12 (TypeScript, Chart.js, HTML2Canvas)
* **Backend:** Supabase (PostgreSQL, Supabase Auth)
* **Hosting:** Vercel