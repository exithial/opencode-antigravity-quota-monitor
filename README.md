# OpenCode Antigravity Quota Monitor

Una herramienta avanzada para monitorear las cuotas de API de tus cuentas Antigravity en OpenCode, con arquitectura limpia y sistema híbrido de datos.

## ✨ Características

### 🚀 **Características Principales (v1.0.0)**
- ✅ **Sistema híbrido** - Combina datos locales (JSON) + API para máxima velocidad y precisión
- 🔓 **Modo `--force`** - Bypass de caché para datos en tiempo real
- 🏗️ **Clean Architecture** - Separación Domain/Application/Infrastructure
- ⚡ **Caché inteligente** - TTL configurable con estadísticas
- 🔧 **Configuración automática** - Auto-generación de `.env` en primera ejecución
- 🛡️ **Inyección de dependencias** - Testing facilitado y código mantenible

### 📊 **Funcionalidades Principales**
- ✅ **Monitoreo en tiempo real** de cuotas de Claude, Gemini 3 Pro y Gemini 3 Flash
- 📊 **Tablas y gráficos ASCII** en terminal para visualización clara
- 🔄 **Auto-refresh** opcional (modo watch)
- 📋 **Exportación** de datos a JSON/CSV
- 🖥️ **CLI y TUI** (Terminal User Interface)
- 🎨 **Interfaz colorida** con indicadores visuales por urgencia
- ⏱️ **Tiempos de reset** en formato humano (`4d 20h`, `2h 15m`, `NOW`)

## 🚀 Instalación Rápida

### Primera ejecución (Recomendado)
```bash
# Clona el proyecto
git clone https://github.com/tu-usuario/opencode-antigravity-quota-monitor.git
cd opencode-antigravity-quota-monitor

# Instala dependencias
npm install

# Ejecuta por primera vez (auto-genera configuración)
node src/cli.js
```

### Instalación global
```bash
# Instala globalmente
npm run install-global

# Ahora puedes usar desde cualquier lugar
antigravity-quota --table
```

### Build ejecutable (Windows)
```bash
npm run build
# Genera dist/antigravity-quota.exe
```

## 📖 Uso

### Comandos básicos
```bash
# Ver todas las cuentas (modo TUI por defecto)
antigravity-quota

# Ver en tabla (CLI mode)
antigravity-quota --table

# Forzar actualización real (bypass caché)
antigravity-quota --force --table

# Ver cuenta específica
antigravity-quota --account 1

# Modo watch (auto-refresh cada 60s)
antigravity-quota --watch

# Modo detallado (verbose)
antigravity-quota --verbose

# Exportar a JSON
antigravity-quota --export json

# Exportar a CSV
antigravity-quota --export csv
```

### Interfaz TUI
```bash
# Iniciar interfaz interactiva
npm run tui
# o
antigravity-quota --tui
```

### Flags avanzados
```bash
# Combinar múltiples flags
antigravity-quota --force -v --table  # Force + verbose + tabla
antigravity-quota --force --account 2 --table  # Cuenta específica con force
antigravity-quota --watch --interval 30  # Watch cada 30 segundos
```

## 🎯 Ejemplos de salida

### Tabla CLI (--table)
```
┌──────────────────────────────┬─────────┬────────┬─────────┬────────────┬───────┬──────────────┬───────┬────────────────────┐
│ Account                      │ Status  │ Claude │ Reset   │ Gemini Pro │ Reset │ Gemini Flash │ Reset │ Project            │
├──────────────────────────────┼─────────┼────────┼─────────┼────────────┼───────┼──────────────┼───────┼────────────────────┤
│ en.solis.g@gmail.com         │ ENABLED │ ✗ 0%   │ 4d 20h  │ ✗ 0%       │ NOW   │ ✓ 100%       │ NOW   │ fine-involution... │
│ soliscamposfamilia@gmail.com │ ENABLED │ ⚠ 20%  │ 15m 29s │ ✗ 0%       │ NOW   │ ✓ 100%       │ NOW   │ propane-object-... │
│ 3diverso.cl@gmail.com        │ ENABLED │ ✓ 100% │ 7d      │ ✗ 0%       │ NOW   │ ✓ 100%       │ NOW   │ tensile-nimbus-... │
└──────────────────────────────┴─────────┴────────┴─────────┴────────────┴───────┴──────────────┴───────┴────────────────────┘
```

### Resumen estadístico
```
📊 SUMMARY
══════════════════════════════════════════════════
Accounts: 3 total
  ✓ 3 enabled
  ○ 0 disabled
  ✗ 0 with errors

Model Status:
  Claude: 1 OK, 1 LOW, 1 LIMITED
  Gemini 3 Pro: 3 LIMITED
  Gemini 3 Flash: 3 OK
```

### Modo verbose (-v)
```
✅ Configuración validada correctamente
🔓 Modo force activado - caché deshabilitado
📁 Datos locales encontrados para cuenta 1
✅ Datos combinados (local + API) para cuenta 1
📦 Usando datos cacheados para cuenta 2
💾 Datos guardados en caché para cuenta 3
```

## 🏗️ Arquitectura del Proyecto

### Estructura de archivos (Clean Architecture)
```
opencode-antigravity-quota-monitor/
├── src/
│   ├── models/                    # 🎯 DOMINIO (Entidades puras)
│   │   └── account.model.js       # AccountModel, QuotaGroup, etc.
│   ├── services/                  # ⚙️ APLICACIÓN (Casos de uso)
│   │   ├── api.service.js         # Comunicación con APIs externas
│   │   ├── config.service.js      # Gestión de configuración (.env)
│   │   ├── cache.service.js       # Sistema de caché inteligente
│   │   ├── local-quota.service.js # Procesamiento datos locales
│   │   ├── model-classifier.service.js # Clasificación modelos
│   │   └── quota-processor.service.js  # Procesamiento cuotas
│   ├── quota-checker.js           # 🏗️ INFRAESTRUCTURA (Orquestación)
│   ├── visualizer.js              # 🎨 INFRAESTRUCTURA (Presentación)
│   ├── cli.js                     # 📟 Punto de entrada CLI
│   └── tui-minimal.js             # 🖥️ Interfaz TUI interactiva
├── .env.example                   # 📋 Plantilla configuración
├── .env                           # ⚙️ Configuración local (auto-generado)
├── .gitignore                     # 🛡️ Exclusión archivos sensibles
├── package.json                   # 📦 Dependencias y scripts
├── CHANGELOG.md                   # 📜 Historial de cambios
├── BACKLOG.md                     # 📋 Roadmap y tareas
└── README.md                      # 📖 Esta documentación
```

### Flujo de datos (Sistema Híbrido)
```
1. 📁 Lee datos locales de antigravity-accounts.json (instantáneo)
   └── rateLimitResetTimes (timestamps de reset)
   
2. 🌐 Si es necesario, consulta API de Google (preciso)
   └── remainingFraction (porcentajes exactos)
   
3. 🔄 Combina ambos datasets inteligentemente
   └── Usa porcentajes de API + timestamps más tempranos
   
4. 💾 Cachea resultados (TTL configurable)
   
5. 🎨 Muestra en formato tabla/TUI con colores informativos
```

## ⚙️ Configuración

### Configuración automática
En la **primera ejecución**, el sistema auto-genera un archivo `.env` con:
- Credenciales OAuth por defecto (compatibles con opencode-antigravity-auth)
- Rutas detectadas automáticamente para tu sistema operativo
- Valores óptimos pre-configurados

### Variables de entorno principales (.env)
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

# UMBRALES DE NOTIFICACIÓN
LOW_QUOTA_THRESHOLD=20             # Advertencia a 20%
CRITICAL_QUOTA_THRESHOLD=5         # Crítico a 5%

# MODO WATCH
WATCH_INTERVAL=60000               # 60 segundos
```

### Personalización avanzada
Edita tu archivo `.env` para ajustar:
- **Timeout HTTP**: `ANTIGRAVITY_HTTP_TIMEOUT=15000`
- **Log level**: `LOG_LEVEL=debug`
- **Deshabilitar caché**: `ENABLE_MEMORY_CACHE=false`
- **Credenciales personalizadas**: Reemplaza `ANTIGRAVITY_CLIENT_ID` y `ANTIGRAVITY_CLIENT_SECRET`

> **Nota**: Consulta `.env.example` para todas las variables disponibles.

## 🤖 Modelos Soportados

### Modelos detectados automáticamente
- **Claude** (todos los modelos)
- **Gemini 3 Pro** (`gemini-3-pro`, `antigravity-gemini-3-pro`)
- **Gemini 3 Flash** (`gemini-3-flash`, `gemini-3-flash-preview`)

### Fuentes de datos
1. **📁 Datos locales** (JSON): Timestamps de reset desde `antigravity-accounts.json`
2. **🌐 Datos API**: Porcentajes exactos desde Google Cloud Code API
3. **🔄 Sistema híbrido**: Combina lo mejor de ambos para máxima precisión

## ⚠️ Requisitos del Sistema

### Requisitos mínimos
- **Node.js 18+** (probado con v24.3.0)
- **npm 8+** o **yarn 1.22+**
- **OpenCode Antigravity Auth** plugin instalado
- Archivo `antigravity-accounts.json` generado automáticamente

### Ubicación del archivo de cuentas
- **Windows**: `%APPDATA%\opencode\antigravity-accounts.json`
- **Linux/macOS**: `~/.config/opencode/antigravity-accounts.json`

## 🔒 Seguridad y Privacidad

### Lo que NO hacemos
- ❌ **No almacenamos** credenciales en el código fuente
- ❌ **No enviamos** datos a servidores externos
- ❌ **No compartimos** información personal
- ❌ **No commiteamos** archivos `.env` o `data/` al repositorio

### Lo que SÍ hacemos
- ✅ **Lee localmente** el archivo `antigravity-accounts.json`
- ✅ **Usa tokens de refresh** en memoria (no persistente)
- ✅ **Conexiones HTTPS** seguras a APIs de Google
- ✅ **Auto-genera `.env`** con configuración local
- ✅ **`.gitignore` robusto** protegiendo archivos sensibles

### Información sensible
- **Segura en tu PC**: `refreshToken`, `email` en `antigravity-accounts.json`
- **Auto-generada**: Credenciales OAuth en `.env` (no en código)
- **Excluida de git**: Todos los archivos locales via `.gitignore`

## 🚀 Comandos Rápidos de Referencia

```bash
# BÁSICOS
antigravity-quota                    # TUI interactiva (default)
antigravity-quota --table            # Tabla CLI
antigravity-quota --force --table    # Actualización real + tabla

# CUENTAS ESPECÍFICAS
antigravity-quota --account 1        # Solo cuenta 1
antigravity-quota --force --account 2 --table  # Cuenta 2 con force

# MODO WATCH
antigravity-quota --watch            # Auto-refresh cada 60s
antigravity-quota --watch --interval 30  # Cada 30s

# DEBUG Y VERBOSE
antigravity-quota -v --table         # Modo verbose
antigravity-quota --force -v --table # Force + verbose

# EXPORTACIÓN
antigravity-quota --export json      # Exportar a JSON
antigravity-quota --export csv       # Exportar a CSV
```

## 🛠️ Desarrollo

### Scripts npm
```bash
npm start              # Ejecutar CLI
npm run tui            # Ejecutar TUI
npm run dev            # Modo desarrollo (watch)
npm run build          # Build ejecutable Windows
npm run install-global # Instalar globalmente
npm test              # Ejecutar tests
```

### Estructura de desarrollo
```bash
# Clonar y configurar
git clone <repo>
cd opencode-antigravity-quota-monitor
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test
```

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

### Guía de contribución
1. **Fork** el repositorio
2. **Crea una rama**: `git checkout -b feature/nueva-funcionalidad`
3. **Sigue convenciones**:
   - Commits: Conventional Commits (`feat:`, `fix:`, `chore:`)
   - Código: Clean Architecture y SOLID principles
   - Tests: Mantener cobertura > 80%
4. **Commit**: `git commit -m 'feat: agregar nueva funcionalidad'`
5. **Push**: `git push origin feature/nueva-funcionalidad`
6. **Abre un Pull Request**

### Convenciones de código
- **Arquitectura**: Clean Architecture (Domain ← Application ← Infrastructure)
- **Principios**: SOLID y Clean Code
- **Testing**: Tests unitarios para servicios, integración para flujos
- **Documentación**: Mantener README y CHANGELOG actualizados

## 🐛 Reportar Problemas y Sugerencias

Usa [GitHub Issues](https://github.com/tu-usuario/opencode-antigravity-quota-monitor/issues) para:
- 🐛 **Reportar bugs** (incluye logs y pasos para reproducir)
- 💡 **Sugerir mejoras** (nuevas features, optimizaciones)
- ❓ **Preguntas técnicas** (configuración, troubleshooting)

### Información útil para reportes
```bash
# Ejecutar con verbose para debugging
antigravity-quota -v --table 2>&1 | tee debug.log

# Ver versión y entorno
node --version
npm --version
cat .env | head -5
```

## 📚 Recursos Adicionales

- [CHANGELOG.md](CHANGELOG.md) - Historial detallado de cambios
- [BACKLOG.md](BACKLOG.md) - Roadmap y tareas pendientes
- [.env.example](.env.example) - Plantilla completa de configuración
- [.gitignore](.gitignore) - Archivos excluidos del control de versiones

---

**✨ Hecho con ❤️ para la comunidad OpenCode**