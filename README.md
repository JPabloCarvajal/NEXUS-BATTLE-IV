# NEXUS-BATTLE-IV

Servidor autoritativo para el juego The Nexus Battle IV: A New Hope

## Características principales
- API REST para gestión de salas, jugadores y batallas
- WebSockets para eventos en tiempo real de batalla
- Documentación automática con Swagger
- Tipado estricto con TypeScript
- Docker para despliegue reproducible

## Requisitos
- Node.js >= 20
- Docker (opcional, recomendado para producción)

## Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/camanrofo34/NEXUS-BATTLE-IV.git
cd NEXUS-BATTLE-IV
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz con el siguiente contenido:
```
PORT=8080
```
Puedes agregar otras variables según tus necesidades.

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Ejecutar con Docker
```bash
docker build -t nexus-battle-iv .
docker run -p 8080:8080 --env-file .env nexus-battle-iv
```

## Documentación Swagger
La API está documentada automáticamente. Para ver la documentación:
1. Ejecuta el servidor.
2. Accede a [http://localhost:8080/api-docs](http://localhost:8080/api-docs) en tu navegador.

## Endpoints principales
- **GET /rooms**: Obtiene todas las salas
- **POST /rooms**: Crea una nueva sala
- **POST /rooms/{roomId}/join**: Unirse a una sala
- **POST /rooms/{roomId}/leave**: Abandonar una sala

Consulta la documentación Swagger para detalles de parámetros y respuestas.

## WebSockets
- Eventos de batalla en tiempo real: conexión, acciones, resultados, desconexiones.
- Usa Socket.io en el cliente para interactuar con el servidor.

## Estructura del proyecto
- `src/`: Código fuente principal
	- `app/`: Servicios y casos de uso
	- `domain/`: Entidades y lógica de negocio
	- `infra/`: Infraestructura (HTTP, WebSocket, DB)
	- `model/`: Interfaces y tipos compartidos
	- `test/`: Pruebas unitarias
- `database/`: Datos estáticos de juego
- `swagger.js`: Configuración de documentación
- `Dockerfile`: Imagen reproducible

## Pruebas
Ejecuta las pruebas unitarias con:
```bash
npm test
```

## Contribuir
1. Haz un fork y crea una rama feature.
2. Realiza tus cambios y abre un Pull Request.

## Licencia
MIT

---
Para dudas o soporte, contacta a camanrofo34 o JPabloCarvajal en GitHub.
