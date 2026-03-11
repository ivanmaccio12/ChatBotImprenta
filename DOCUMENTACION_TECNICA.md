# Documentación Técnica y Guía de Arquitectura (CopyShow Bot & CRM)

Este documento detalla exhaustivamente la arquitectura, las tecnologías, la infraestructura de alojamiento y el flujo de datos del sistema **CopyShow (Chatbot IA + Kanban CRM)**. El objetivo principal es servir como **guía base o "blueprint"** para comprender el proyecto actual o utilizarlo como plantilla para replicar y construir un bot de similares características desde cero.

---

## 1. Stack Tecnológico

El sistema se divide en tres capas principales: Backend (Motor del Bot), Frontend (CRM/Kanban) e Infraestructura de Terceros.

### 1.1. Backend (Motor del Chatbot y API)
- **Lenguaje / Entornos:** Node.js (v18+) utilizando ES Modules (`"type": "module"`).
- **Framework Web:** Express.js (manejo de endpoints HTTP y recepción de webhooks de WhatsApp).
- **Inteligencia Artificial:** SDK oficial de Anthropic (`@anthropic-ai/sdk`) delegando la lógica conversacional a los modelos de **Claude**.
- **Acceso a Datos:** Paquete `pg` (node-postgres) para realizar consultas transaccionales nativas a PostgreSQL.
- **Catálogo Dinámico:** Paquete `xlsx` combinado con fetch/axios. El bot no tiene los precios fijados en el código; los extrae de un **Google Sheets** dinámico en tiempo real y lo parsea a memoria.
- **Herramientas Clave:** `cors`, `dotenv` (para ocultar credenciales), `node-ssh` (para rutinas de despliegue remoto).

### 1.2. Frontend (Panel Kanban y CRM)
- **Librería Core:** React.js (v18.2).
- **Bundler y Compilador:** Vite (proporciona un entorno de desarrollo en vivo instantáneo y construye paquetes estáticos súper optimizados para producción).
- **Estilos:** Renderizado nativo y ligero de CSS. Se desarrolló evitando frameworks CSS pesados innecesarios para garantizar la velocidad extrema de la Single Page Application (SPA).
- **Calidad de Código:** Eslint integrado (`eslint-plugin-react`) para prevenir errores antes del despliegue.

### 1.3. Middleware de Automatización (n8n) y Comunicaciones
- **n8n (Workflow Automation):** Actúa como el puente o evento disparador de procesos que no requieren hardcodeo. Ejemplos de su uso: 
  - Captar un pago de Mercado Pago y avisarlo al sistema.
  - Recibir la señal de toma de control (Takeover) del CRM y enviar el mensaje escrito por el humano hacia el cliente.
- **WhatsApp Cloud API (Oficial):** El sistema utiliza la API oficial de Meta para interactuar con WhatsApp, recibiendo webhooks directos en el Backend Node.js de los mensajes del cliente y enviando respuestas de texto, plantillas del sistema, y multimedia de manera oficial con la mayor estabilidad y escalado posible.

---

## 2. Infraestructura y Alojamiento (Hosting)

El ecosistema entero reside en un servidor privado virtual (VPS) optimizado y estructurado para despliegue de microservicios.

### 2.1. Servidor Principal
- **Proveedor:** Hostinger.
- **Sistema Operativo:** Servidor Linux (Ubuntu/Debian).
- **Dirección IP Pública:** `31.97.31.53`
- **Accesos:** Tráfico general HTTP/HTTPS (Puertos 80, 443) y administración privada por SSH (Puerto 22).

### 2.2. Orquestación mediante Docker (Servicios Core Compartidos)
Los servicios de bases de datos y middleware se gestionan mediante **Docker** para asegurar el aislamiento, seguridad y evitar colisiones:
1. **`root-traefik-1`**: Proxy inverso y terminación SSL (Let's Encrypt). Atrapa el tráfico en los puertos `80` y `443` y lo redirecciona dominios específicos (ej. hacia n8n).
2. **`evolution_postgres`**: Base de datos PostgreSQL alojada en el puerto interno `5432` (solo accesible desde el localhost para protección de datos).
3. **`evolution_redis`**: Sistema de caché en memoria (puerto interno `6379`) para optimizar llamadas redundantes y sesiones de ser necesario, aunque el core DB se apoya en Postgres.
4. **`root-n8n-1`**: Motor n8n interno escuchando peticiones locales en el puerto `5678`.

### 2.3. Despliegue de Aplicaciones a Medida (PM2)
Los bots construidos con Node y React corren directamente en el host (fuera de Docker) alojados en `/var/www/`. Para garantizar que nunca "se caigan" o detenerse por errores, usan **PM2** (Gestor de Procesos en Producción).
- **Backend CopyShow:** Carpeta `/var/www/ChatBotImprenta` (Corre en el puerto **3002**).
- **Otros Proyectos (Ejemplo):** `api-node` en 3001, `MuniOran` en 3003, `LavaderoAzul (Front)` en 3004, `SotoPadillaBot` en 3005.

> 🛠️ **Regla Arquitectónica:** Si creamos un nuevo bot bajo esta plantilla, deberá alojarse de la misma forma en PM2, utilizando el siguiente puerto libre disponible (ej. `3006`, `3007` ascendiendo).

---

## 3. Topología de Datos y Repositorio

### 3.1. Flujo de Datos
1. Las conversaciones pasadas, las órdenes del Kanban y la configuración del bot persisten en la Base de Datos Relacional **PostgreSQL** (`DATABASE_URL=postgresql://user:password@localhost:5432/copyshow_chatbot`).
2. Los precios residen externamente en Google Workspace (para facilitar el acceso a personal no técnico). La URL está fijada en `.env` mediante `GOOGLE_SHEET_URL`.
3. Los mensajes de control manual emitidos desde el Front (CRM) viajan del Node Backend (Express) a un webhook unificador en N8N definido por la variable `N8N_WEBHOOK_URL`.

### 3.2. Repositorio de Código Central
Todo el ecosistema de código fuente se aloja de forma privada y unificada, conteniendo en el mismo proyecto tanto el Bot como el panel administrativo, simplificando el CI/CD.

- **Plataforma:** GitHub
- **URL / Origen:** `https://github.com/ivanmaccio12/ChatBotImprenta.git`
- **Estructura del Proyecto:**
  - `/src`: Lógica central del Backend (Bot, CRM backend y Claude integration).
    - `/controllers`: Recibe los endpoints de webhooks e interacciones desde Front.
    - `/services`: Funciones pesadas (Llamadas a la BD, integraciones de IA con Prompts de sistema).
    - `/config`: Seteo del puerto e inicializaciones de DB.
  - `/frontend`: El proyecto íntegro de React con Vite, contenido dentro de este mismo repositorio.
  - `.env` / `.env.example`: Claves privadas como `ANTHROPIC_API_KEY`.

---

## 4. Blueprint: Cómo construir un Bot desde cero basado en esta arquitectura

Si deseas utilizar este código para crear un nuevo sistema desde cero (ej. un bot para un rubro distinto, conservando el Kanban y CRM), sigue exactamente estos 5 pasos de infraestructura:

1. **Bifurcación del Código:**
   - Clona el repositorio a tu máquina local: `git clone https://github.com/ivanmaccio12/ChatBotImprenta.git NuevoProyectoBot`
   - Remueve el enlace remoto viejo y asocia uno propio (o úsalo solo como plantilla local).
2. **Entorno y Secretos (.env):**
   - Elige el nuevo puerto (ej. `3006`).
   - Genera/asigna la API Key del modelo LLM (Anthropic).
   - Crea un nuevo Excel (Google Sheets), hazlo público (formato export=xlsx) y colócalo en `GOOGLE_SHEET_URL`.
   - Modifica `DATABASE_URL` para que apunte a un nuevo string (ej. creando la DB `nuevo_bot_db` en el mismo servidor Postgres).
3. **Configuración de WhatsApp (Cloud API de Meta):**
   - En el portal de Meta for Developers, configura una App usando WhatsApp Business Platform.
   - Vincula tu número de teléfono oficial corporativo y adquiere tus Tokens de Acceso permanente y de Validación del Webhook.
   - Configura el webhook de Meta para que direccione los eventos de entrada (mensajes de usuarios) hacia la URL de tu nuevo Backend Node HTTPS (ej. `https://tudominio.com/webhook/whatsapp`).
4. **Implementación en el VPS (Hostinger):**
   - Transfiere tu código (mediante Git pull o rsync/SSH) a una nueva carpeta: `/var/www/NuevoProyectoBot`.
   - Ejecuta `npm install` root y `cd frontend && npm install && npm run build`.
   - Añade a PM2 el proceso: `pm2 start src/index.js --name "NuevoProyectoBot_Backend"`.
5. **Canalización con N8N:**
   - Crea un workflow nuevo específico en n8n para este bot (para manejar intervenciones de CRM u otras tareas), asocia el webhook público que genere n8n en el `.env` como `N8N_WEBHOOK_URL` y reinicia PM2.
