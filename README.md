# CloudPOS - Sistema de Punto de Venta en la Nube

Sistema completo de Punto de Venta (POS) tipo SaaS Multi-Tenant construido con Next.js 14, MongoDB y autenticación JWT.

## 🚀 Características Principales

### ✅ Módulos Implementados

1. **Autenticación Segura**
   - Registro de nuevos dueños de tienda
   - Login con JWT en cookies httpOnly
   - Sistema Multi-Tenant (cada usuario solo ve sus datos)

2. **Dashboard Inteligente**
   - Ventas del día en tiempo real
   - Ganancia calculada automáticamente
   - Alertas de productos con bajo stock
   - Métricas del mes

3. **Gestión de Inventario**
   - CRUD completo de productos
   - Búsqueda por nombre, código de barras o categoría
   - Alertas automáticas de bajo stock (< 10 unidades)
   - Categorización de productos

4. **Terminal de Venta (POS) - FUNCIONALIDAD CORE**
   - Búsqueda en tiempo real de productos
   - Grid visual de productos
   - Carrito de compras interactivo (Zustand)
   - Escaneo/búsqueda por código de barras
   - Cálculo automático de cambio
   - Múltiples métodos de pago (Efectivo/Tarjeta)
   - Actualización automática de inventario al vender
   - Validación de stock disponible

5. **Reportes de Ventas**
   - Historial completo de ventas
   - Filtros por rango de fechas
   - Resumen de ingresos y ganancias
   - Detalle de productos vendidos por transacción

## 🏗️ Arquitectura

### Tech Stack
- **Frontend:** Next.js 14.2.3 (App Router), React 18
- **Estilos:** Tailwind CSS + Shadcn/UI
- **Backend:** Next.js API Routes
- **Base de Datos:** MongoDB
- **Autenticación:** JWT con cookies httpOnly
- **Estado:** Zustand (carrito POS)
- **Validación:** Zod

### Estructura de Base de Datos

#### Colección: users
```javascript
{
  id: UUID,
  email: String,
  password_hash: String (bcrypt),
  store_name: String,
  currency_symbol: String,
  created_at: Date
}
```

#### Colección: products
```javascript
{
  id: UUID,
  user_id: UUID (ref: User),
  barcode: String,
  name: String,
  cost_price: Number,
  sale_price: Number,
  stock_quantity: Number,
  category: String,
  low_stock_alert: Boolean,
  created_at: Date
}
```

#### Colección: sales
```javascript
{
  id: UUID,
  user_id: UUID (ref: User),
  total_amount: Number,
  profit: Number,
  payment_method: String (cash/card),
  amount_received: Number,
  change_given: Number,
  items: [{
    product_id: UUID,
    product_name: String,
    quantity: Number,
    price_at_sale: Number,
    cost_at_sale: Number
  }],
  date: Date
}
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de nuevo usuario
- `POST /api/auth/login` - Login con credenciales
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Productos (Requieren autenticación)
- `GET /api/products` - Listar productos (con búsqueda opcional: ?search=query o ?barcode=code)
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Ventas (Requieren autenticación)
- `POST /api/sales` - Crear venta (actualiza stock automáticamente)
- `GET /api/sales` - Listar ventas (con filtros opcionales: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD)

### Dashboard (Requiere autenticación)
- `GET /api/dashboard/stats` - Estadísticas completas (ventas, ganancias, inventario)

## 🎨 Páginas Frontend

- `/login` - Autenticación (Login y Registro en tabs)
- `/dashboard` - Dashboard principal con métricas
- `/inventory` - Gestión de inventario (CRUD)
- `/pos` - Terminal de Venta (CORE FEATURE)
- `/reports` - Reportes y análisis de ventas

## 🔐 Seguridad

- Passwords hasheados con bcryptjs
- JWT tokens en cookies httpOnly (no accesibles desde JavaScript)
- Sistema Multi-Tenant: filtrado estricto por user_id en todas las operaciones
- Validación de autenticación en todos los endpoints protegidos
- CORS configurado

## 🧪 Testing

**Backend Testing:** ✅ 13/13 tests pasados
- Autenticación (Register, Login, Me)
- CRUD Productos con Multi-Tenant
- Sistema de Ventas con actualización de stock
- Dashboard con estadísticas
- Validaciones de stock

## 🚀 Cómo Usar

1. **Registro:** Crea tu cuenta con el nombre de tu tienda
2. **Inventario:** Agrega tus productos con códigos de barras, precios y stock
3. **Terminal POS:** Usa la terminal para realizar ventas:
   - Busca productos por nombre o escanea código de barras
   - Agrega al carrito con cantidades
   - Procesa el pago (efectivo/tarjeta)
   - El sistema calcula el cambio automáticamente
   - Stock se actualiza en tiempo real
4. **Dashboard:** Monitorea tus ventas y ganancias
5. **Reportes:** Analiza el historial con filtros de fecha

## 🌟 Características Destacadas

- **Búsqueda Inteligente:** Por nombre o código de barras en tiempo real
- **Gestión de Stock:** Alertas automáticas y actualización al vender
- **Cálculo de Cambio:** Automático para pagos en efectivo
- **Multi-Tenant:** Datos completamente aislados por usuario
- **Responsive:** Funciona en PC (caja) y móvil (consultas)
- **Dark Mode:** Interfaz moderna con modo oscuro

## 📝 Variables de Entorno

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cloudpos_db
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
CORS_ORIGINS=*
JWT_SECRET=tu-secret-key-seguro
```

## 🎯 Flujo de Venta (POS)

1. Usuario busca o escanea producto
2. Producto se agrega al carrito
3. Usuario ajusta cantidades si es necesario
4. Click en "Cobrar"
5. Selecciona método de pago
6. Si es efectivo, ingresa monto recibido
7. Sistema calcula cambio
8. Confirma venta:
   - Se guarda en base de datos
   - Stock se actualiza automáticamente
   - Se calcula ganancia
   - Se muestra cambio al cliente

## 📊 Métricas Calculadas

- **Ventas del Día:** Suma de todas las ventas de hoy
- **Ganancia:** (Precio Venta - Precio Costo) × Cantidad
- **Cambio:** Monto Recibido - Total a Cobrar
- **Alertas:** Productos con stock < 10 unidades

## 🔄 Estado de Testing

✅ **Backend Completamente Probado (13/13 tests)**
- Autenticación con JWT y cookies
- CRUD productos con búsqueda
- Sistema de ventas con actualización de stock
- Dashboard con estadísticas
- Multi-tenant isolation

⏳ **Frontend:** Listo para testing manual o automatizado

## 🏪 Casos de Uso

Perfecto para:
- Tiendas de conveniencia
- Mini markets
- Farmacias
- Papelerías
- Cafeterías
- Cualquier negocio minorista

## 💡 Próximas Mejoras Sugeridas

- Impresión de tickets
- Soporte para lectores de código de barras USB
- Reportes avanzados con gráficas
- Gestión de proveedores
- Control de usuarios/cajeros por tienda
- Backup automático
- Exportación a Excel/PDF
