# Documentación Técnica y Comercial: Asistente Virtual y Gestión de Pedidos (Kanban)

## 1. Introducción
Esta documentación describe la versión completa y definitiva de la solución automatizada de atención al cliente y gestión de pedidos, diseñada originariamente para **Gráficas, Imprentas o Librerías**, pero adaptable a modelos de negocios similares (servicios a medida, ventas con cotización, etc.).

La solución consta de tres componentes principales y sincronizados en tiempo real:
1. **Asistente Virtual con IA (Bot de WhatsApp y Web)**: Atiende consultas, cotiza productos en base a listas de precios dinámicas y asiste al cliente en la generación de su pedido.
2. **Panel de Control (Kanban)**: Un sistema web para que los empleados gestionen la producción de los pedidos, los pagos y la asignación de responsables.
3. **CRM Integrado (Monitoreo e Intervención)**: Una plataforma que permite seguir las conversaciones del bot en vivo e intervenir manualmente cuando el cliente lo requiera.

---

## 2. Alcance del Asistente Virtual (Bot)

El bot de Inteligencia Artificial actúa como un vendedor automático capacitado para entender el lenguaje natural y ofrecer una experiencia fluida.

### 2.1. Funcionalidades y Habilidades Core
*   **Cotización Dinámica:** Lee precios y servicios en tiempo real desde una hoja de cálculo (Google Sheets), garantizando que las cotizaciones otorgadas a los clientes estén siempre actualizadas sin necesidad de modificar el código del bot.
*   **Memoria de Conversación:** Recuerda el contexto de la charla actual con un cliente específico, lo que permite cotizaciones iterativas (ej. "Y si en vez de 100 volantes quiero 500, ¿cuánto sería?").
*   **Recolección de Datos del Cliente:** Antes de finalizar un requerimiento, el bot solicita activamente el **nombre del cliente** para personalizar la atención y facilitar el seguimiento del pedido.

### 2.2. Flujo de Cierre de Ventas y Toma de Pedidos
Una vez que el pedido está cotizado y definido, el bot guía al cliente hacia el cierre de venta de forma inteligente:

*   **Pregunta de Conformidad y Vía de Acción:** El bot pregunta explícitamente al cliente si está conforme con el pedido y desea **proceder a pagarlo inmediatamente**, o si prefiere que **un empleado del local revise personalmente los archivos y requerimientos** antes de pagar.
*   **Escenario A: El cliente decide pagar.**
    *   El bot interactúa con la pasarela de pagos (Mercado Pago / N8N) y genera un **link de pago**.
    *   Internamente, el bot genera un registro en el panel Kanban, ubicando el pedido temporalmente en la columna de **"En Revisión"** (esperando el impacto del pago).
    *   Una vez que el cliente abona y el sistema detecta el pago automáticamente, el bot mueve la tarjeta a la columna **"Nuevo Pedido"**, etiquetándola como *Pagado*.
    *   Finalmente, el bot le envía al cliente la **confirmación de pago exitoso** junto con su **número de pedido** único.
*   **Escenario B: El cliente solicita revisión humana.**
    *   El bot confirma la recepción de la solicitud y le asigna un **número de pedido** preliminar.
    *   Genera una nueva tarjeta en el panel Kanban directamente en la columna **"En Revisión"**, a la espera de que un empleado se contacte, revise los archivos y apruebe la cotización final.

---

## 3. Alcance del Panel de Control (Kanban)

Es una interfaz web responsiva, rápida y visual diseñada para que el equipo interno gestione el ciclo de vida de cada venta.

### 3.1. Estructura del Tablero
El sistema consta de columnas que representan los estados del flujo de trabajo de la imprenta:
1.  **En Revisión:** Pedidos recién ingresados que el cliente decidió no pagar aún para que los revise un humano, o bien pedidos con link de pago emitido pero esperando acreditación de los fondos.
2.  **Nuevo Pedido:** Pedidos listos para comenzar a producir (principalmente los que ya están pagados y aprobados por el cliente).
3.  **En Curso / Producción:** Trabajos que actualmente están siendo impresos o diseñados.
4.  **Para Retirar:** Productos terminados listos para que el cliente pase a buscarlos.
5.  **Entregados / Finalizados:** Trabajos ya en manos del cliente.

### 3.2. Funcionalidades de la Tarjeta de Pedido
*   **Información Esencial:** Cada tarjeta muestra el Número de Pedido, Nombre del Cliente, Fecha/Hora de creación y Detalles del trabajo a realizar.
*   **Estado de Pago (Pagado / Pendiente):** Las tarjetas muestran visualmente si el pedido está *Pagado*. Los empleados pueden **marcar manualmente un pedido como pagado** desde el Kanban si el cliente decide transferir, pagar por otro medio o pagar en el local post-revisión.
*   **Asignación de Responsable:** Cada pedido puede ser asignado a un empleado específico. El listado de empleados seleccionables se actualiza y alimenta automáticamente de una pestaña compartida, permitiendo dar de alta/baja personal rápidamente sin soporte de TI.

### 3.3. Restricciones y Reglas de Negocio
*   **Bloqueo de Entrega a Pedidos Impagos:** El sistema Kanban posee una validación de seguridad comercial clave: es imposible mover una tarjeta hacia la columna "Entregados / Finalizados" si la tarjeta no tiene el estado de "Pagado". Si el empleado lo intenta, el botón o la acción de arrastrar se deshabilita o muestra una alerta.

### 3.4. Motor de Búsqueda
*   El panel superior incluye un potente buscador en tiempo real para localizar rápidamente el estado de trabajo de los clientes.
*   Permite filtrar y buscar tanto por **Número de Pedido** como por el **Nombre del Cliente** capturado por el bot.
### 3.5. CRM y Monitoreo de Conversaciones
*   **Seguimiento en Tiempo Real:** El sistema incluye un CRM donde los empleados pueden visualizar en vivo cada una de las interacciones que el bot tiene con los clientes.
*   **Intervención Humana (Takeover):** Permite a un agente humano pausar la IA y tomar el control de la conversación en tiempo real directamente desde la plataforma, siendo la solución ideal para responder dudas complejas o requerimientos muy personalizados.
*   **Diferenciador Clave:** Es una de las características más importantes de la plataforma. Ha demostrado ser una funcionalidad indispensable y altamente demandada por los clientes, ya que brinda la seguridad y control total sobre la Inteligencia Artificial.

---

## 4. Descripción Técnica del Sistema (Stack)

La solución es moderna, ligera (no requiere servidores inmensos) y escalable tecnológicamente:

### Backend y Base de Datos
*   **API / Motor Conversacional:** Node.js + Express.
*   **Inteligencia Artificial:** Integración de Node.js API con LLM (Ollama, OpenAI o similar), controlada por un *System Prompt* robusto para encasillar el comportamiento y evitar alucinaciones comerciales.
*   **Base de Datos Relacional:** PostgreSQL. Encargado de almacenar la memoria de chats, el catálogo de pedidos y el estado del Kanban. Su estructuración asegura retener conversaciones largas ininterrumpidamente.
*   **Automatización e Integraciones (N8N):** Actúa como middleware de bajo código para interconectar de forma fácil la API web, planillas dinámicas (para precios y empleados) y las Pasarelas de Pago (Mercado Pago).

### Frontend (Kanban y CRM)
*   **Framework React.js con Vite:** Para construir una UI extremadamente fluida y rápida (Single Page Application).
*   **Estilos y UX:** Componentes construidos a la medida garantizando una estética premium y facilidad de uso táctil y por mouse.

### Despliegue (Infraestructura)
*   Todo el sistema está encapsulado para ejecutarse en un entorno Linux (VPS en la nube).
*   Emplea contenedores (Docker) para aislar servicios críticos (DB, proxy Traefik) y gestores de procesos (PM2) para garantizar el "uptime" continuo del Bot.

---

## 5. Valor Comercial de la Solución

1.  **Atención 24/7:** El negocio no pierde ventas fuera de horario. Las cotizaciones se responden a los pocos segundos.
2.  **Reducción del Tiempo Administrativo:** Al delegar la cotización estándar, armado de link de pago y recolección de nombres al bot, el empleado humano interviene *únicamente* cuando su expertise aporta valor (por ejemplo, al revisar artes complejas en la columna "En Revisión" o al pasar a imprimir).
3.  **Trazabilidad y Organización:** El paso de libretas de papel o mensajes desordenados a un tablero Kanban digital elimina el estrés de "¿qué le tocaba a quién?" y previene pérdidas o demoras en la entrega.
4.  **Cero Fugas Financieras:** La restricción impuesta en el Kanban de no poder pasar a "Entregado" ningún trabajo pendiente de pago elimina los errores en la ventanilla de atención presencial por olvidos de cobro.
5.  **Simplicidad de Mantenimiento:** El dueño del negocio no necesita aprender a usar software complejo; actualiza sus precios o su nómina de empleados simplemente escribiendo en celdas de una planilla.
6.  **Control Total sobre la IA (CRM):** El negocio nunca pierde el control sobre la experiencia del usuario. La capacidad de monitorear e intervenir en tiempo real brinda la confianza y seguridad indispensables que buscan las empresas al adoptar la IA.
