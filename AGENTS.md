# AGENTS.md - Guía de Comandos y Configuración para Agentes

Este documento contiene todos los comandos, configuraciones y patrones de uso para agentes de IA que trabajen con el proyecto OpenCode Antigravity Quota Monitor.

## 📋 Información del Proyecto

**Nombre:** OpenCode Antigravity Quota Monitor  
**Versión:** 1.0.0  
**Lenguaje:** JavaScript ES Modules  
**Node.js:** >= 18.0.0  
**Arquitectura:** Clean Architecture (Domain ← Application ← Infrastructure)  
**Gestor de Paquetes:** npm / yarn

## 🚀 Comandos Principales

### Ejecución Básica
```bash
# TUI interactiva (default)
node src/cli.js

# Tabla CLI
node src/cli.js --table

# Forzar actualización real (bypass caché)
node src/cli.js --force --table

# Modo verbose para debugging
node src/cli.js -v --table
```

### Scripts npm
```bash
npm start              # Ejecutar CLI (alias de node src/cli.js)
npm run tui            # Ejecutar TUI interactiva
npm run dev            # Modo desarrollo (watch)
npm run build          # Build ejecutable Windows
npm run install-global # Instalar globalmente
npm test              # Ejecutar tests
```

### Comandos Globales (después de install-global)
```bash
antigravity-quota                    # TUI interactiva
antigravity-quota --table            # Tabla CLI
antigravity-quota --force --table    # Actualización real
```

## ⚙️ Configuración del Entorno

### Variables de Entorno (.env)
El sistema auto-genera un archivo `.env` en la primera ejecución con:

```ini
# CREDENCIALES (Auto-configuradas)
ANTIGRAVITY_CLIENT_ID=1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com
ANTIGRAVITY_CLIENT_SECRET=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

# RUTAS LOCALES (Auto-detectadas)
ANTIGRAVITY_ACCOUNTS_PATH=C:\Users\tu-usuario\AppData\Roaming\opencode\antigravity-accounts.json

# CACHÉ Y PERFORMANCE
CACHE_TTL=300000                    # 5 minutos
ENABLE_MEMORY_CACHE=true           # Habilitar caché
MAX_RETRIES=3                      # Reintentos para API
```

### Archivos Excluidos (.gitignore)
- `.env` - Configuración local
- `data/` - Historial y exportaciones
- `exports/` - Archivos exportados
- `logs/` - Logs de aplicación
- `node_modules/` - Dependencias

## 🏗️ Estructura del Proyecto

### Arquitectura Clean Architecture
```
src/
├── models/                    # 🎯 DOMINIO (Entidades puras)
│   └── account.model.js       # AccountModel, QuotaGroup, AccountResult, CheckAllResult
├── services/                  # ⚙️ APLICACIÓN (Casos de uso)
│   ├── api.service.js         # Comunicación con APIs externas
│   ├── config.service.js      # Gestión de configuración (.env)
│   ├── cache.service.js       # Sistema de caché inteligente
│   ├── local-quota.service.js # Procesamiento datos locales
│   ├── model-classifier.service.js # Clasificación modelos
│   └── quota-processor.service.js  # Procesamiento cuotas
├── quota-checker.js           # 🏗️ INFRAESTRUCTURA (Orquestación)
├── visualizer.js              # 🎨 INFRAESTRUCTURA (Presentación)
├── cli.js                     # 📟 Punto de entrada CLI
└── tui-minimal.js             # 🖥️ Interfaz TUI interactiva
```

### Flujo de Datos (Sistema Híbrido)
1. **📁 Lee datos locales** de `antigravity-accounts.json` (instantáneo)
2. **🌐 Consulta API de Google** si es necesario (preciso)
3. **🔄 Combina ambos datasets** inteligentemente
4. **💾 Cachea resultados** (TTL configurable)
5. **🎨 Muestra** en formato tabla/TUI con colores informativos

## 🔧 Desarrollo y Testing

### Convenciones de Código
- **Arquitectura**: Clean Architecture estricta
- **Principios**: SOLID y Clean Code
- **Tipado**: Evitar `any`, definir interfaces/tipos
- **Testing**: Tests unitarios para servicios, integración para flujos

### Patrones de Desarrollo
```javascript
// Inyección de dependencias (para testing)
const apiService = new ApiService({ 
  fetch: mockFetch,  // Inyectado para testing
  timeout: 5000 
});

// Configuración centralizada
import { ConfigService } from "./services/config.service.js";
ConfigService.initialize();
const config = ConfigService.getAll();

// Caché inteligente
import { CacheService } from "./services/cache.service.js";
CacheService.set("key", data, 300000); // 5 minutos TTL
```

### Testing
```bash
# Ejecutar todos los tests
npm test

# Tests con watch mode
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests verbose
npm run test:verbose
```

## 🐛 Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Error: "Variable de entorno requerida no configurada"
**Solución:** Ejecutar `node src/cli.js` para auto-generar `.env`

#### 2. Error: "ANTIGRAVITY_ACCOUNTS_PATH no encontrado"
**Solución:** Verificar que `opencode-antigravity-auth` esté instalado y haya generado el archivo

#### 3. Datos desactualizados
**Solución:** Usar `--force` flag para bypass de caché
```bash
node src/cli.js --force --table
```

#### 4. API rate limiting
**Solución:** Aumentar `CACHE_TTL` en `.env` o usar datos locales
```ini
CACHE_TTL=600000  # 10 minutos
```

### Comandos de Debugging
```bash
# Ver logs detallados
node src/cli.js -v --table 2>&1 | tee debug.log

# Ver configuración cargada
node -e "import('./src/services/config.service.js').then(m => { m.ConfigService.initialize(); console.log(m.ConfigService.getAll()); })"

# Ver archivo de cuentas
cat "$(node -e "console.log(require('os').homedir() + '/.config/opencode/antigravity-accounts.json')")" | head -20
```

## 📊 Comandos de Referencia Rápida

### Básicos
```bash
antigravity-quota                    # TUI interactiva
antigravity-quota --table            # Tabla CLI
antigravity-quota --force --table    # Actualización real
```

### Cuentas Específicas
```bash
antigravity-quota --account 1        # Solo cuenta 1
antigravity-quota --force --account 2 --table
```

### Modo Watch
```bash
antigravity-quota --watch            # Auto-refresh cada 60s
antigravity-quota --watch --interval 30  # Cada 30s
```

### Exportación
```bash
antigravity-quota --export json      # Exportar a JSON
antigravity-quota --export csv       # Exportar a CSV
```

### Debugging
```bash
antigravity-quota -v --table         # Modo verbose
antigravity-quota --force -v --table # Force + verbose
```

## 🔄 Actualización del Proyecto

### Para Agentes de IA
Cuando trabajes en este proyecto:

1. **Siempre seguir** Clean Architecture y principios SOLID
2. **Inyectar dependencias** para facilitar testing
3. **Usar ConfigService** para configuración (no hardcodear)
4. **Mantener compatibilidad** con `opencode-antigravity-auth`
5. **Actualizar documentación** (README, CHANGELOG, AGENTS.md)

### Verificación de Calidad
```bash
# Ejecutar tests
npm test

# Verificar estructura de archivos
find src/ -name "*.js" -type f | wc -l

# Verificar imports
grep -r "import.*from" src/ --include="*.js" | head -10
```

## 📚 Documentación Relacionada

- [README.md](README.md) - Documentación principal del proyecto
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios
- [BACKLOG.md](BACKLOG.md) - Roadmap y tareas pendientes
- [.env.example](.env.example) - Plantilla de configuración

---

**Última actualización:** 2025-01-29  
**Versión del documento:** 1.0.0  
**Mantenedor:** Agentes de IA trabajando en el proyecto