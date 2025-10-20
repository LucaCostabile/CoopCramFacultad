Guía de organización – facuCram (Node.js + React)

Resumen
- Este proyecto replica la app Laravel (cram) con una separación frontend/backend.
- Carpeta api: backend con Express. Define rutas REST para noticias, catálogo y pedidos.
- Carpeta web: frontend con React (Vite). Consume la API y maneja navegación.

Estructura
facuCram/
  api/                Backend (Express)
    .env.example      Variables de entorno ejemplo (copiar a .env)
    package.json      Scripts y dependencias
    src/
      app.js          Configuración de app Express (middlewares y rutas)
      server.js       Punto de entrada del servidor
      routes/         Definición de endpoints
        index.js      Ruta /api/health y montaje de subrutas
        auth.routes.js
        news.routes.js
        catalog.routes.js
        orders.routes.js
      controllers/    Lógica por endpoint (placeholder/TODO)
        auth.controller.js
        news.controller.js
        catalog.controller.js
        orders.controller.js
      services/       Capa de negocio (placeholder, ideal para DB)
        user.service.js
        news.service.js
        product.service.js
        order.service.js
      middlewares/    Middlewares (auth, roles, errores)
        auth.js
        role.js
        errorHandler.js
      config/
        env.js        Carga de variables env
        db.js         Placeholder para conexión a DB (Prisma/SQL/Mongo)
      utils/
        pagination.js Utilidad simple de paginación

  web/                Frontend (React + Vite)
    .env.example      Variables de entorno ejemplo (VITE_API_URL)
    package.json      Scripts y dependencias
    index.html        HTML raíz
    vite.config.js    Config Vite con plugin React
    src/
      main.jsx        Arranque de React
      App.jsx         Enrutador y layout base
      pages/          Páginas principales
        Home.jsx      Noticias/carrusel (placeholder)
        Catalog.jsx   Catálogo con filtros (placeholder)
        Login.jsx     Login (placeholder)
        Account.jsx   Cuenta y pedidos (placeholder)
        Admin.jsx     Panel admin (placeholder)
      components/     Componentes reutilizables
        NavBar.jsx
      services/
        api.js        Cliente axios con baseURL configurable
      styles/
        app.css

Equivalencias con Laravel (cram)
- GET /           -> web/pages/Home.jsx que consume GET /api/news (a definir) o usa estático.
- Catálogo        -> GET /api/catalogo, /api/catalogo/filters, /api/catalogo/rubro-counts
- Pedidos         -> POST /api/pedidos
- Admin users/sales/news -> placeholders para iterar luego.

Base de datos
- En Laravel se usan tablas: users, news, products, orders, order_items.
- En Node sugerido: Prisma + SQLite/MySQL/PostgreSQL. Este esqueleto deja db.js y services/* listos para implementar.

Cómo empezar (resumen)
1) Backend
   - Copiar .env.example a .env y ajustar.
   - Instalar dependencias y correr en modo dev: npm install; npm run dev.
2) Frontend
   - Copiar .env.example a .env.local (o .env) y ajustar VITE_API_URL.
   - Instalar dependencias y correr: npm install; npm run dev.

Próximos pasos recomendados
- Implementar autenticación real (JWT) en api/middlewares/auth.js y auth.controller.js.
- Conectar DB en config/db.js y completar services/*.
- Implementar consultas filtradas en CatalogController (services/product.service.js).
- Mejorar páginas en web con llamados reales a la API.
