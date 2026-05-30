# CORA 🏗️ • Marketplace Inverso de Materiales de Construcción

**CORA** es una plataforma web mobile-first diseñada para revolucionar la cotización de materiales de construcción en Santo Domingo Este (SDE), República Dominicana. Conecta de manera eficiente a **Ingenieros de Obra** con **Ferreterías Locales**, permitiendo optimizar costos y logística mediante un sistema de subastas inversas y cotizaciones detalladas por ítem.

---

## 🚀 Características Clave

### 👷 Modo Ingeniero (Comprador)
* **Solicitud de Cotización Inteligente**: Publica requerimientos detallando múltiples materiales, cantidades, presupuesto límite y ubicación exacta en SDE mediante un mapa interactivo.
* **Tablero de Optimización de Compra (Split-view)**: Compara ofertas ítem por ítem en una matriz responsiva. Permite seleccionar de forma exclusiva el mejor proveedor para cada material específico.
* **Formalización de Pedido Mixto**: Genera órdenes de compra independientes para cada ferretería seleccionada con un solo clic, calculando automáticamente subtotales, ITBIS (18%) y el total consolidado.
* **Contacto Directo**: Botón de acción rápida para contactar y coordinar la logística con los proveedores seleccionados.

### 🏪 Modo Ferretería (Vendedor)
* **Feed de Oportunidades Cercanas**: Visualiza solicitudes de obras activas ordenadas automáticamente por cercanía (distancia en km) y tiempo restante para ofertar.
* **Filtro de Disponibilidad**: Control para pausar o activar alertas de obras en tiempo real según el stock disponible.
* **Cotización Detallada Multilínea**: Formulario de oferta donde se puede ingresar el precio unitario por material, marcar ítems como "No disponibles" y seleccionar el tiempo de entrega global.
* **Cálculo Automático de Impuestos**: Desglose automático de Subtotal, ITBIS (18% RD) y Gran Total antes de enviar la oferta.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 19 (TypeScript)
* **Enrutamiento**: React Router DOM
* **Estilos**: Tailwind CSS (Diseño Mobile-First Estricto)
* **Componentes**: Radix UI & shadcn/ui
* **Iconos**: Lucide React
* **Notificaciones**: Sonner (Toasts interactivos en tiempo real)
* **Build Tool**: Vite

---

## 📦 Instalación y Uso Local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/CORA.git
   ```
2. Instala las dependencias:

   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

Desarrollado con ❤️ para optimizar la cadena de suministro de la construcción en la República Dominicana.
