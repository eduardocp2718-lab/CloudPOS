#!/bin/bash
# Script para ver contraseñas de usuarios en CloudPOS

echo "=================================="
echo "   CONSULTA DE CONTRASEÑAS"
echo "   CloudPOS - MongoDB"
echo "=================================="
echo ""

# Función para buscar un usuario específico
buscar_usuario() {
    echo "Ingresa el email del usuario:"
    read email
    mongosh --quiet cloudpos_db --eval "
        var user = db.users.findOne({email: '$email'}, {email: 1, password: 1, store_name: 1, _id: 0});
        if (user) {
            print('✅ Usuario encontrado:');
            print('Email: ' + user.email);
            print('Password: ' + user.password);
            print('Tienda: ' + user.store_name);
        } else {
            print('❌ Usuario no encontrado');
        }
    "
}

# Función para ver todos los usuarios
ver_todos() {
    mongosh --quiet cloudpos_db --eval "
        print('=== TODOS LOS USUARIOS ===\n');
        db.users.find({}, {email: 1, password: 1, store_name: 1, _id: 0}).sort({email: 1}).forEach(user => {
            print('Email: ' + user.email);
            print('Password: ' + user.password);
            print('Tienda: ' + user.store_name);
            print('----------------------------');
        });
    "
}

# Función para ver últimos usuarios registrados
ver_ultimos() {
    mongosh --quiet cloudpos_db --eval "
        print('=== ÚLTIMOS 5 USUARIOS REGISTRADOS ===\n');
        db.users.find({}, {email: 1, password: 1, store_name: 1, created_at: 1, _id: 0}).sort({created_at: -1}).limit(5).forEach(user => {
            print('Email: ' + user.email);
            print('Password: ' + user.password);
            print('Tienda: ' + user.store_name);
            print('Fecha: ' + user.created_at);
            print('----------------------------');
        });
    "
}

# Menú
echo "Selecciona una opción:"
echo "1. Buscar usuario por email"
echo "2. Ver todos los usuarios"
echo "3. Ver últimos usuarios registrados"
echo "4. Salir"
echo ""
echo -n "Opción: "
read opcion

case $opcion in
    1)
        buscar_usuario
        ;;
    2)
        ver_todos
        ;;
    3)
        ver_ultimos
        ;;
    4)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac
