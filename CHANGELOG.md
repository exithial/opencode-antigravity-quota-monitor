# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-29

### 🚀 **Versión Inicial Completa**

#### **Arquitectura y Diseño**
- **Clean Architecture implementada** - Separación Domain/Application/Infrastructure
- **Principios SOLID aplicados** - Single Responsibility, Open/Closed, Dependency Inversion
- **Sistema de modelos de dominio** - `AccountModel`, `QuotaGroup`, `AccountResult`, `CheckAllResult`
- **Regla de dependencia respetada** - Dominio ← Aplicación ← Infraestructura

#### **Funcionalidades Principales**
- **Sistema híbrido de datos** - Combina datos locales (JSON) + API para máxima velocidad y precisión
- **Monitoreo en tiempo real** de cuotas de Claude, Gemini 3 Pro y Gemini 3 Flash
- **Interfaz dual CLI/TUI** - Tablas CLI y TUI interactiva
- **Modo watch** - Auto-refresh configurable (default: 60s)
- **Exportación de datos** - JSON y CSV con timestamps
- **Visualización avanzada** - Tablas coloridas con indicadores de urgencia

#### **Servicios Especializados**
- **`ApiService`** - Comunicación segura con APIs de Google Cloud Code
- **`LocalQuotaService`** - Procesamiento de `rateLimitResetTimes` desde JSON local
- **`ConfigService`** - Gestión centralizada de configuración con validación automática
- **`CacheService`** - Sistema de caché inteligente con TTL configurable
- **`QuotaProcessorService`** - Procesamiento y clasificación de datos de cuotas
- **`ModelClassifierService`** - Detección automática de modelos IA

#### **Características de Seguridad**
- **Configuración automática** - Auto-generación de `.env` en primera ejecución
- **Credenciales seguras** - No hardcodeadas en código fuente, solo en `.env` local
- **Tokens en memoria** - `refreshToken` nunca persistido, solo usado para obtener access tokens
- **Protección de datos** - `.gitignore` robusto excluyendo archivos sensibles
- **HTTPS seguro** - Todas las conexiones a APIs usan HTTPS

#### **Flags y Opciones CLI**
- **`--table`** - Modo tabla CLI con visualización colorida
- **`--force`** - Bypass completo de caché para datos en tiempo real
- **`--account <n>`** - Verificar cuenta específica
- **`--watch`** - Modo auto-refresh continuo
- **`--verbose` / `-v`** - Modo detallado con logging extendido
- **`--export <format>`** - Exportar a JSON o CSV
- **`--tui`** - Forzar interfaz TUI interactiva

#### **Configuración Automática**
- **Auto-detección de rutas** - Paths detectados por sistema operativo
- **Variables de entorno** - Todas las configuraciones en `.env` auto-generado
- **Validación automática** - Verificación de valores y rangos al inicio
- **Compatibilidad total** - Con `opencode-antigravity-auth` y sus credenciales por defecto

#### **Optimizaciones de Performance**
- **Caché inteligente** - TTL configurable (default: 5 minutos)
- **Lazy loading** - Dependencias cargadas solo cuando se necesitan
- **Sistema híbrido** - Datos locales (0ms) + API (preciso) combinados
- **Inyección de dependencias** - `fetch` y `fs` inyectados para testing y flexibilidad

#### **Formato de Visualización**
- **Tiempos humanos** - `4d 20h`, `2h 15m`, `10m 34s`, `NOW`
- **Indicadores coloridos** - ✓ OK, ⚠ LOW, ✗ LIMITED, ○ DISABLED
- **Resumen estadístico** - Agregado por cuenta y modelo
- **Proyectos truncados** - IDs largos mostrados como `fine-involution...`

#### **Correcciones y Mejoras**
- **Eliminación de información personal** - Datos sensibles removidos del proyecto
- **Refactorización completa** - Código modular y mantenible
- **Manejo de errores robusto** - Fallback a datos locales si API falla
- **Compatibilidad Node.js** - Probado con v24.3.0, requerido >= 18.0.0
- **Documentación completa** - README, AGENTS.md, BACKLOG.md actualizados

---

## Convenciones de versionado

- **MAJOR** (1.x.x): Cambios incompatibles con versiones anteriores
- **MINOR** (x.1.x): Nuevas funcionalidades compatibles
- **PATCH** (x.x.1): Correcciones de bugs compatibles

## Notas de lanzamiento

### Primera versión estable (1.0.0)
Esta es la primera versión pública del OpenCode Antigravity Quota Monitor. Incluye todas las funcionalidades planeadas para un sistema completo de monitoreo de cuotas de API.

**Características clave:**
- Arquitectura limpia y mantenible
- Sistema híbrido para máxima velocidad y precisión
- Configuración automática para fácil onboarding
- Seguridad garantizada sin datos sensibles en código
- Interfaz dual (CLI/TUI) para diferentes preferencias

**Requisitos:**
- Node.js 18+
- Plugin `opencode-antigravity-auth` instalado
- Archivo `antigravity-accounts.json` generado automáticamente

**Instalación:**
```bash
git clone <repo>
cd opencode-antigravity-quota-monitor
npm install
node src/cli.js  # Auto-genera configuración
```