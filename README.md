# 🥟 MARIVAMA - Sistema de Gestión de Ventas y Fiados

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**MARIVAMA** es una aplicación web progresiva diseñada para optimizar el control de ventas, gestión de clientes deudores (fiados) y seguimiento de inventario. Enfocada en la facilidad de uso y una estética moderna con soporte para modo oscuro.

---

## ✨ Características Principales

* **📊 Dashboard Inteligente:** Visualización rápida de ingresos totales, saldos pendientes y estadísticas semanales.
* **👥 Gestión de Clientes:** Registro detallado de clientes con sistema de puntos acumulables por pagos puntuales.
* **📜 Control de Fiados:** Registro de deudas con estados (pendiente, pagado, archivado).
* **🛒 Lista de Compras & Tareas:** Módulos integrados para organizar el inventario faltante y los pendientes diarios.
* **📄 Exportación PDF:** Generación automática de comprobantes de cobro para enviar a los clientes.
* **🌙 Modo Oscuro/Claro:** Interfaz adaptativa para cualquier entorno de trabajo.
* **🔒 Seguridad:** Protección de acciones críticas (como reiniciar caja) mediante un sistema de PIN (AdminGuard).

## 🚀 Tecnologías Utilizadas

* **Frontend:** Next.js 14 (App Router) con React.
* **Estilos:** Tailwind CSS para un diseño responsivo y animaciones personalizadas.
* **Base de Datos & Auth:** Supabase (PostgreSQL) para almacenamiento en tiempo real.
* **Estado & Contexto:** React Context API para manejo de temas y autenticación.
* **Notificaciones:** Sonner para alertas interactivas.

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/marivama.git](https://github.com/tu-usuario/marivama.git)
    cd marivama
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_key
    ```

4.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## 📸 Vista Previa

> [!TIP]
> La aplicación cuenta con una **Marquesina Neon** en el encabezado que muestra frases motivacionales dinámicas para inspirar el día de trabajo.

## 📈 Estructura del Proyecto

* `/components`: Componentes reutilizables (Modales, Guards, Layouts).
* `/context`: Manejo del estado global (Tema, Datos).
* `/lib`: Configuración de Supabase y utilidades de exportación (PDF).
* `/app`: Rutas principales del Dashboard, Clientes y Reportes.

---

Desarrollado con ❤️ para **MARIVAMA**.
