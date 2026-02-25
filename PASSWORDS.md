# 🔑 CONTRASEÑAS DE USUARIOS - CloudPOS

⚠️ **ADVERTENCIA DE SEGURIDAD:** 
Las contraseñas están guardadas en texto plano en la base de datos para facilitar la recuperación durante el desarrollo/MVP. **Esto es temporal** hasta que se implemente un sistema de reset password.

---

## 👥 USUARIOS REGISTRADOS

### Usuario de Demostración
- **Email:** demo@cloudpos.com
- **Password:** demo12345
- **Tienda:** Tienda Demo POS
- **Moneda:** $

### Usuario de Prueba 1
- **Email:** testowner@posstore.com
- **Password:** testpass123
- **Tienda:** Mi Tienda POS
- **Moneda:** $

### Usuario de Prueba 2
- **Email:** seconduser@posstore.com
- **Password:** secondpass123
- **Tienda:** Segunda Tienda
- **Moneda:** $

### Usuario Kary Shop 1
- **Email:** KaryShop@gmail.com
- **Password:** kary123
- **Tienda:** Kary SHOP
- **Moneda:** $

### Usuario Kary Shop 2
- **Email:** Kary.Shop@gmail.com
- **Password:** karyshop123
- **Tienda:** Kary SHOP
- **Moneda:** $

### Usuario Shoes
- **Email:** shoes@gmail.com
- **Password:** shoes123
- **Tienda:** Shoes
- **Moneda:** $

### Usuario Nuevo (Prueba)
- **Email:** nuevo@test.com
- **Password:** nueva123
- **Tienda:** Tienda Nueva
- **Moneda:** $

---

## 🔍 CÓMO VER LAS CONTRASEÑAS EN LA BASE DE DATOS

### Opción 1: Desde la terminal (servidor)
```bash
mongosh cloudpos_db --eval 'db.users.find({}, {email: 1, password: 1, store_name: 1, _id: 0}).forEach(printjson)'
```

### Opción 2: Ver todas las contraseñas formateadas
```bash
mongosh cloudpos_db --eval 'db.users.find({}, {email: 1, password: 1, store_name: 1, _id: 0}).sort({email: 1}).forEach(user => {print(`Email: ${user.email} | Password: ${user.password} | Tienda: ${user.store_name}`)})'
```

### Opción 3: Buscar un usuario específico
```bash
mongosh cloudpos_db --eval 'db.users.findOne({email: "demo@cloudpos.com"}, {email: 1, password: 1, store_name: 1, _id: 0})'
```

---

## 🛠️ CAMBIOS REALIZADOS EN EL CÓDIGO

### Antes (con encriptación):
```javascript
// Hash password
const password_hash = await bcrypt.hash(password, 10)
const user = {
  id: uuidv4(),
  email,
  password_hash,
  store_name,
  currency_symbol: currency_symbol || '$',
  created_at: new Date()
}
```

### Ahora (texto plano):
```javascript
// NOTA: Guardando contraseña en texto plano para desarrollo/MVP
// TODO: Implementar sistema de reset password y volver a encriptar
const user = {
  id: uuidv4(),
  email,
  password: password, // Guardando sin encriptar para poder recuperarla
  store_name,
  currency_symbol: currency_symbol || '$',
  created_at: new Date()
}
```

### Login - Antes:
```javascript
const isValidPassword = await bcrypt.compare(password, user.password_hash)
```

### Login - Ahora:
```javascript
// Comparación directa de contraseña (sin encriptación)
const isValidPassword = user.password === password
```

---

## ⚠️ RECOMENDACIONES PARA PRODUCCIÓN

1. **Implementar Reset Password:**
   - Endpoint para solicitar reset (envía email con token temporal)
   - Página para cambiar contraseña con token
   - Token expirable (24 horas)

2. **Volver a Encriptar:**
   - Una vez implementado reset password, volver a usar bcrypt
   - Script de migración para encriptar contraseñas existentes

3. **Agregar 2FA (Opcional):**
   - Autenticación de dos factores para mayor seguridad

4. **Política de Contraseñas:**
   - Mínimo 8 caracteres
   - Al menos una mayúscula, minúscula y número
   - Cambio periódico de contraseña

---

## 📝 NOTAS IMPORTANTES

- ✅ Las contraseñas ahora son **visibles en la base de datos**
- ✅ Los usuarios existentes fueron **actualizados con contraseñas de prueba**
- ✅ Los nuevos usuarios se registran con **contraseña en texto plano**
- ⚠️ **NO USAR ESTO EN PRODUCCIÓN** sin implementar reset password primero
- 📌 Este cambio facilita el soporte durante el desarrollo/MVP
- 🔒 Recuerda implementar seguridad apropiada antes del lanzamiento

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Implementar Reset Password** (3-4 horas de desarrollo)
2. **Agregar validación de contraseña fuerte** (30 minutos)
3. **Crear página de "Olvidé mi contraseña"** (1 hora)
4. **Script de migración para re-encriptar** (1 hora)
5. **Documentación de políticas de seguridad** (30 minutos)

---

**Fecha de actualización:** 25 de Febrero de 2026
**Versión:** 1.0 - Contraseñas en Texto Plano (Desarrollo/MVP)
