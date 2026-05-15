# 🥟 MARIVAMA - Sistema de Gestión de Ventas y Fiados (Producción-Ready)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**MARIVAMA** es una plataforma robusta y profesional diseñada para el control total de ventas, fiados y auditoría financiera. Esta versión ha sido estabilizada y optimizada para ofrecer trazabilidad absoluta en cada transacción.

---

## ✨ Características Principales y Novedades

* **📊 Dashboard de Auditoría:** Visualización en tiempo real de ingresos, deudas y recaudos con trazabilidad de quién recibió cada pago.
* **📜 Trazabilidad Total (Logs):** Nuevo módulo de auditoría que registra cada acción (abonos, liquidaciones, aperturas, cierres) indicando el atendente responsable, cliente, monto y hora exacta.
* **📱 Autoservicio Inteligente:** Acceso mediante QR para clientes (`/autoservicio`). Los pedidos requieren identificación obligatoria y notifican instantáneamente al dashboard principal.
* **👥 Gestión de Clientes Avanzada:** Perfiles detallados con historial de pagos, sistema de puntos (PTS) y semáforo de riesgo crediticio.
* **🅿️ Control de Parqueadero & Pipetas:** Módulos especializados para servicios adicionales con seguimiento de abonos y liquidaciones.
* **🌙 Estética Premium:** Interfaz con diseño Glassmorphism, modo oscuro permanente y animaciones fluidas para una experiencia de usuario de alto nivel.
* **🔒 Seguridad de Turnos:** Sistema de PIN personalizado para cada atendente (Master PIN: `1407`) y AdminGuard para acciones críticas.

## 🚀 Tecnologías Utilizadas

* **Frontend:** Next.js 14 (App Router).
* **Base de Datos:** Supabase (PostgreSQL) con suscripciones en tiempo real.
* **Estilos:** Tailwind CSS con temas personalizados.
* **Auditoría:** Sistema centralizado de Logs para auditoría financiera.
* **QR:** Generación dinámica de códigos para acceso rápido.

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/marivama.git
    cd marivama
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de Entorno:**
    Configura `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_key
    ```

4.  **Ejecutar:**
    ```bash
    npm run dev
    ```

## 📸 Trazabilidad y Reportes

La aplicación ahora permite saber exactamente:
* **¿Quién pagó?** (Nombre del cliente y su apodo).
* **¿Cuánto pagó?** (Monto exacto registrado).
* **¿Quién recibió el dinero?** (Atendente de turno identificado por su PIN).
* **¿Cuándo ocurrió?** (Marca de tiempo precisa).

### 🛠️ Acceso de Administrador
Para gestionar el personal (Atendentes) y realizar cierres de caja, utiliza el **Master PIN: 1407**.

---

Desarrollado por ChrizDev con ❤️ para **MARIA VANEGAS**.
© 2026 MariVama Platform.
