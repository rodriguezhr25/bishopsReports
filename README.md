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

## Paso 3: Desplegar la Aplicación (Vercel)

1. **Haz un Fork** (o *"Use this template"*) del repositorio **`bishopsReports`** a tu cuenta de GitHub.
2. Inicia sesión en **Vercel** con tu cuenta de GitHub.
3. Haz clic en **"Add New Project"** e importa el repositorio **`bishopsReports`** que acabas de copiar.
4. **Configura el directorio raíz y el build de Angular:**
   - En **Root Directory**, selecciona la carpeta **`reporte-asistencia`** (ya que la aplicación Angular se encuentra dentro de ese subdirectorio)[cite: 1].
   - Verifica que el framework detectado sea **Angular** y que el directorio de salida (*Output Directory*) corresponda a la compilación de `reporte-asistencia` (por ejemplo, `dist/reporte-asistencia`).
5. **Configura las credenciales de Supabase:**
   - Revisa `reporte-asistencia/src/environments/environment.prod.ts` (y `environment.ts` para desarrollo local) para confirmar la estructura de configuración[cite: 1]:
     ```ts
     export const environment = {
       production: true,
       supabaseUrl: 'TU_PROJECT_URL',
       supabaseKey: 'TU_ANON_PUBLIC_KEY'
     };
     ```
   - Si tu pipeline o build inyecta variables desde Vercel, agrégala en **Environment Variables** (`SUPABASE_URL` y `SUPABASE_KEY` o las que lea tu script de compilación); de lo contrario, asegúrate de actualizar `supabaseUrl` y `supabaseKey` en `reporte-asistencia/src/environments/environment.prod.ts` antes del despliegue[cite: 1].
   - Obtén ambos valores en **Supabase -> Project Settings -> API**:
     - **Project URL** (`supabaseUrl`)[cite: 1]
     - **anon public** (`supabaseKey`)[cite: 1]
6. Haz clic en **Deploy** y espera a que finalice la compilación.

¡Listo! Vercel te entregará una URL pública (por ejemplo, `mi-estaca.vercel.app`). Inicia sesión con el correo y la contraseña creados en el Paso 2 para comenzar a usar el sistema.

## 🛠️ Stack Tecnológico
* **Frontend:** Angular 12 (TypeScript, Chart.js, HTML2Canvas)
* **Backend:** Supabase (PostgreSQL, Supabase Auth)
* **Hosting:** Vercel