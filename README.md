# Ecommerce Full Stack

Proyecto base full stack para tienda de ropa con:

- `frontend`: React + Vite + TypeScript
- `backend`: Node.js + Express + TypeScript
- `database`: modelo relacional PostgreSQL

## Módulos incluidos

- Panel administrador con login, dashboard, inventario, reportes y ventas
- Panel usuario con catálogo, filtros, detalle, likes, carrito, checkout, historial y reseñas
- API REST modular con validación, seguridad y separación por capas
- Esquema SQL robusto para PostgreSQL

## Estructura

```text
.
|-- frontend
|-- backend
`-- database
```

## Ejecución sugerida

1. Instalar dependencias en `frontend` y `backend`
2. Configurar PostgreSQL con el script de `database/schema.sql`
3. Completar variables de entorno según `backend/.env.example`
4. Levantar backend y frontend por separado

## Nota

Se deja una base sólida y extensible. Algunas integraciones externas como pasarela de pago real, almacenamiento real de imágenes y autenticación persistente se preparan a nivel de arquitectura y contratos, para completarse con las credenciales del entorno real.
