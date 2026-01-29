# Instalación de Antigravity Quota Monitor

## Métodos de instalación

### 1. Instalación rápida (Windows)
Ejecuta `install.bat` como administrador:
```cmd
cd opencode-antigravity-quota-monitor
install.bat
```

### 2. Instalación manual
```bash
# Clonar o copiar el proyecto
cd opencode-antigravity-quota-monitor

# Instalar dependencias
npm install

# Instalar globalmente (opcional)
npm link
```

### 3. Build ejecutable
```bash
npm run build
# El ejecutable estará en dist/antigravity-quota.exe
```

## Verificación de instalación

### Verificar instalación global
```bash
antigravity-quota --version
# o
ag-quota --version
```

### Probar la aplicación
```bash
# Ver todas las cuentas en tabla
antigravity-quota --table

# Ver cuenta específica
antigravity-quota --account 1

# Modo watch (auto-refresh)
antigravity-quota --watch

# Interfaz TUI
antigravity-quota --tui
```

## Requisitos del sistema

- **Node.js 18+** (https://nodejs.org/)
- **npm** (viene con Node.js)
- **Cuentas Antigravity** configuradas en OpenCode

## Solución de problemas

### Error: "antigravity-quota no se reconoce"
```bash
# Usar desde el directorio del proyecto
node src/cli.js

# O reinstalar globalmente
cd opencode-antigravity-quota-monitor
npm link
```

### Error: "No accounts found"
Verifica que tengas cuentas Antigravity configuradas:
```bash
# El archivo debe existir en:
%APPDATA%\opencode\antigravity-accounts.json

# Para agregar cuentas:
opencode auth login
```

### Error de dependencias
```bash
# Reinstalar dependencias
npm ci
# o
rm -rf node_modules package-lock.json
npm install
```

## Actualización

```bash
cd opencode-antigravity-quota-monitor
git pull origin main  # Si usas git
npm install
npm link  # Si instalaste globalmente
```

## Desinstalación

### Desinstalar globalmente
```bash
npm unlink -g opencode-antigravity-quota-monitor
```

### Eliminar proyecto
```bash
# Eliminar directorio del proyecto
rm -rf opencode-antigravity-quota-monitor
```

## Configuración avanzada

Crea `config.json` en el directorio del proyecto:
```json
{
  "refreshInterval": 60,
  "lowQuotaThreshold": 20,
  "notifications": {
    "enabled": true
  }
}
```

## Soporte

- **Documentación**: `README.md`
- **Ejemplos**: Ver `package.json` scripts
- **Ayuda**: `antigravity-quota --help`