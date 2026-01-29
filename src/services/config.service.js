import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class ConfigService {
  static #config = null;
  static #envPath = join(process.cwd(), ".env");

  // Credenciales por defecto para inicialización (Template)
  // Se escribirán en el .env del usuario, pero no se usarán como fallback en el código
  static #DEFAULT_TEMPLATE = {
    ANTIGRAVITY_CLIENT_ID: "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com",
    ANTIGRAVITY_CLIENT_SECRET: "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",
    ANTIGRAVITY_API_BASE_URL: "https://cloudcode-pa.googleapis.com",
    ANTIGRAVITY_USER_AGENT: "antigravity/windows/amd64",
    ANTIGRAVITY_HTTP_TIMEOUT: "10000",
    LOG_LEVEL: "info",
    VERBOSE_LOGGING: "false",
    MAX_RETRIES: "3",
    RETRY_BASE_DELAY: "1000",
    RETRY_BACKOFF_FACTOR: "2",
    CACHE_TTL: "300000",
    ENABLE_MEMORY_CACHE: "true",
    LOW_QUOTA_THRESHOLD: "20",
    CRITICAL_QUOTA_THRESHOLD: "5",
    ENABLE_DESKTOP_NOTIFICATIONS: "true",
    VALIDATE_SSL_CERTIFICATES: "true",
    SSL_TIMEOUT: "5000",
    WATCH_INTERVAL: "60000",
    WATCH_MAX_ITERATIONS: "0",
    EXPORT_DIRECTORY: "./exports",
    DEFAULT_EXPORT_FORMAT: "json",
    FALLBACK_PROJECT_ID: "bamboo-precept-lgxtn",
    NODE_ENV: "production"
  };

  static initialize() {
    // 1. Cargar variables del archivo .env si existe
    this.loadEnvFile();

    // 2. Si no existe, generarlo automáticamente
    if (!existsSync(this.#envPath)) {
      this.generateEnvFile();
      // Recargar después de generar
      this.loadEnvFile();
    }

    if (this.#config) {
      return this.#config;
    }

    this.#config = {
      // Credenciales OAuth (Ahora OBLIGATORIAS desde env)
      clientId: this.getRequiredEnv("ANTIGRAVITY_CLIENT_ID"),
      clientSecret: this.getRequiredEnv("ANTIGRAVITY_CLIENT_SECRET"),
      
      // Configuración de API
      apiBaseUrl: this.getEnv("ANTIGRAVITY_API_BASE_URL"),
      accountsPath: this.getEnv("ANTIGRAVITY_ACCOUNTS_PATH"),
      userAgent: this.getEnv("ANTIGRAVITY_USER_AGENT"),
      httpTimeout: this.getEnvAsNumber("ANTIGRAVITY_HTTP_TIMEOUT"),
      
      // Configuración de logging
      logLevel: this.getEnv("LOG_LEVEL"),
      verboseLogging: this.getEnvAsBoolean("VERBOSE_LOGGING"),
      
      // Configuración de reintentos
      maxRetries: this.getEnvAsNumber("MAX_RETRIES"),
      retryBaseDelay: this.getEnvAsNumber("RETRY_BASE_DELAY"),
      retryBackoffFactor: this.getEnvAsNumber("RETRY_BACKOFF_FACTOR"),
      
      // Configuración de caché
      cacheTtl: this.getEnvAsNumber("CACHE_TTL"),
      enableMemoryCache: this.getEnvAsBoolean("ENABLE_MEMORY_CACHE"),
      
      // Configuración de notificaciones
      lowQuotaThreshold: this.getEnvAsNumber("LOW_QUOTA_THRESHOLD"),
      criticalQuotaThreshold: this.getEnvAsNumber("CRITICAL_QUOTA_THRESHOLD"),
      enableDesktopNotifications: this.getEnvAsBoolean("ENABLE_DESKTOP_NOTIFICATIONS"),
      
      // Configuración de seguridad
      validateSslCertificates: this.getEnvAsBoolean("VALIDATE_SSL_CERTIFICATES"),
      sslTimeout: this.getEnvAsNumber("SSL_TIMEOUT"),
      
      // Configuración de modo watch
      watchInterval: this.getEnvAsNumber("WATCH_INTERVAL"),
      watchMaxIterations: this.getEnvAsNumber("WATCH_MAX_ITERATIONS"),
      
      // Configuración de exportación
      exportDirectory: this.getEnv("EXPORT_DIRECTORY"),
      defaultExportFormat: this.getEnv("DEFAULT_EXPORT_FORMAT"),
      
      // Configuración avanzada
      fallbackProjectId: this.getEnv("FALLBACK_PROJECT_ID"),
      nodeEnv: this.getEnv("NODE_ENV"),
      
      // Flags internos
      isDevelopment: this.getEnv("NODE_ENV") === "development",
      isProduction: this.getEnv("NODE_ENV") === "production"
    };

    this.validate();
    this.logConfiguration();

    return this.#config;
  }

  static loadEnvFile() {
    if (!existsSync(this.#envPath)) return;

    try {
      const content = readFileSync(this.#envPath, "utf8");
      const lines = content.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          // Solo establecer si no existe ya en process.env (prioridad a sistema)
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️  Error leyendo archivo .env:", error.message);
    }
  }

  static generateEnvFile() {
    console.log("⚙️  Generando configuración inicial (.env)...");
    
    // Detectar ruta de cuentas automáticamente
    const accountsPath = this.detectAccountsPath();
    
    let content = `# OpenCode Antigravity Quota Monitor - Configuración Local
# Generado automáticamente el ${new Date().toISOString()}

# ============================================
# CREDENCIALES (Auto-configuradas)
# ============================================
ANTIGRAVITY_CLIENT_ID=${this.#DEFAULT_TEMPLATE.ANTIGRAVITY_CLIENT_ID}
ANTIGRAVITY_CLIENT_SECRET=${this.#DEFAULT_TEMPLATE.ANTIGRAVITY_CLIENT_SECRET}

# ============================================
# RUTAS LOCALES
# ============================================
# Ruta detectada automáticamente para tu sistema
ANTIGRAVITY_ACCOUNTS_PATH=${accountsPath}

# ============================================
# CONFIGURACIÓN GENERAL
# ============================================
ANTIGRAVITY_API_BASE_URL=${this.#DEFAULT_TEMPLATE.ANTIGRAVITY_API_BASE_URL}
ANTIGRAVITY_USER_AGENT=${this.#DEFAULT_TEMPLATE.ANTIGRAVITY_USER_AGENT}
ANTIGRAVITY_HTTP_TIMEOUT=${this.#DEFAULT_TEMPLATE.ANTIGRAVITY_HTTP_TIMEOUT}

# ============================================
# PREFERENCIAS
# ============================================
LOG_LEVEL=${this.#DEFAULT_TEMPLATE.LOG_LEVEL}
VERBOSE_LOGGING=${this.#DEFAULT_TEMPLATE.VERBOSE_LOGGING}
WATCH_INTERVAL=${this.#DEFAULT_TEMPLATE.WATCH_INTERVAL}
LOW_QUOTA_THRESHOLD=${this.#DEFAULT_TEMPLATE.LOW_QUOTA_THRESHOLD}
CRITICAL_QUOTA_THRESHOLD=${this.#DEFAULT_TEMPLATE.CRITICAL_QUOTA_THRESHOLD}

# ============================================
# REINTENTOS Y CACHÉ
# ============================================
MAX_RETRIES=${this.#DEFAULT_TEMPLATE.MAX_RETRIES}
RETRY_BASE_DELAY=${this.#DEFAULT_TEMPLATE.RETRY_BASE_DELAY}
RETRY_BACKOFF_FACTOR=${this.#DEFAULT_TEMPLATE.RETRY_BACKOFF_FACTOR}
CACHE_TTL=${this.#DEFAULT_TEMPLATE.CACHE_TTL}
ENABLE_MEMORY_CACHE=${this.#DEFAULT_TEMPLATE.ENABLE_MEMORY_CACHE}

# ============================================
# NOTIFICACIONES Y SEGURIDAD
# ============================================
ENABLE_DESKTOP_NOTIFICATIONS=${this.#DEFAULT_TEMPLATE.ENABLE_DESKTOP_NOTIFICATIONS}
VALIDATE_SSL_CERTIFICATES=${this.#DEFAULT_TEMPLATE.VALIDATE_SSL_CERTIFICATES}
SSL_TIMEOUT=${this.#DEFAULT_TEMPLATE.SSL_TIMEOUT}

# ============================================
# EXPORTACIÓN
# ============================================
EXPORT_DIRECTORY=${this.#DEFAULT_TEMPLATE.EXPORT_DIRECTORY}
DEFAULT_EXPORT_FORMAT=${this.#DEFAULT_TEMPLATE.DEFAULT_EXPORT_FORMAT}

# ============================================
# AVANZADO
# ============================================
NODE_ENV=${this.#DEFAULT_TEMPLATE.NODE_ENV}
FALLBACK_PROJECT_ID=${this.#DEFAULT_TEMPLATE.FALLBACK_PROJECT_ID}
WATCH_MAX_ITERATIONS=${this.#DEFAULT_TEMPLATE.WATCH_MAX_ITERATIONS}
`;

    try {
      writeFileSync(this.#envPath, content);
      console.log("✅ Archivo .env generado exitosamente con configuración local.");
    } catch (error) {
      console.error("❌ Error generando .env:", error.message);
    }
  }

  static detectAccountsPath() {
    if (process.platform === "win32") {
      const appData = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
      return join(appData, "opencode", "antigravity-accounts.json").replace(/\\/g, "\\\\");
    }
    
    const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
    return join(xdgConfig, "opencode", "antigravity-accounts.json");
  }

  static get(key) {
    if (!this.#config) {
      this.initialize();
    }
    
    if (!(key in this.#config)) {
      throw new Error(`Configuración no encontrada: ${key}`);
    }
    
    return this.#config[key];
  }

  static getAll() {
    if (!this.#config) {
      this.initialize();
    }
    
    return { ...this.#config };
  }

  static getRequiredEnv(variableName) {
    const value = process.env[variableName];
    
    if (!value || value.trim() === "") {
      throw new Error(
        `Variable de entorno requerida no configurada: ${variableName}\n` +
        `Por favor, configura ${variableName} en tu archivo .env\n` +
        `Consulta .env.example para más información`
      );
    }
    
    return value.trim();
  }

  static getEnv(variableName, defaultValue = null) {
    const value = process.env[variableName];
    
    if (value === undefined || value === null || value.trim() === "") {
      return defaultValue;
    }
    
    return value.trim();
  }

  static getEnvAsNumber(variableName, defaultValue = 0) {
    const value = this.getEnv(variableName);
    
    if (value === null) {
      return defaultValue;
    }
    
    const number = Number(value);
    
    if (isNaN(number)) {
      console.warn(`⚠️  Valor no numérico para ${variableName}: "${value}". Usando valor por defecto: ${defaultValue}`);
      return defaultValue;
    }
    
    return number;
  }

  static getEnvAsBoolean(variableName, defaultValue = false) {
    const value = this.getEnv(variableName);
    
    if (value === null) {
      return defaultValue;
    }
    
    const lowerValue = value.toLowerCase().trim();
    
    if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes" || lowerValue === "on") {
      return true;
    }
    
    if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no" || lowerValue === "off") {
      return false;
    }
    
    console.warn(`⚠️  Valor booleano inválido para ${variableName}: "${value}". Usando valor por defecto: ${defaultValue}`);
    return defaultValue;
  }

  static validate() {
    const config = this.#config;
    
    // Validar credenciales (solo verificar que existan, getRequiredEnv ya lo hace)
    
    // Validar números positivos
    const positiveNumbers = [
      { key: "httpTimeout", value: config.httpTimeout, min: 1000, max: 60000 },
      { key: "maxRetries", value: config.maxRetries, min: 0, max: 10 },
      { key: "retryBaseDelay", value: config.retryBaseDelay, min: 100, max: 10000 },
      { key: "cacheTtl", value: config.cacheTtl, min: 0, max: 3600000 },
      { key: "watchInterval", value: config.watchInterval, min: 1000, max: 3600000 }
    ];
    
    for (const { key, value, min, max } of positiveNumbers) {
      if (value < min || value > max) {
        console.warn(`⚠️  Valor fuera de rango para ${key}: ${value}. Debe estar entre ${min} y ${max}`);
      }
    }
    
    // Validar porcentajes
    const percentages = [
      { key: "lowQuotaThreshold", value: config.lowQuotaThreshold, min: 1, max: 100 },
      { key: "criticalQuotaThreshold", value: config.criticalQuotaThreshold, min: 0, max: 100 }
    ];
    
    for (const { key, value, min, max } of percentages) {
      if (value < min || value > max) {
        console.warn(`⚠️  Porcentaje inválido para ${key}: ${value}%. Debe estar entre ${min}% y ${max}%`);
      }
    }
    
    if (config.lowQuotaThreshold <= config.criticalQuotaThreshold) {
      console.warn(`⚠️  LOW_QUOTA_THRESHOLD (${config.lowQuotaThreshold}%) debe ser mayor que CRITICAL_QUOTA_THRESHOLD (${config.criticalQuotaThreshold}%)`);
    }
    
    // Validar URLs
    try {
      new URL(config.apiBaseUrl);
    } catch (error) {
      throw new Error(`URL de API inválida: ${config.apiBaseUrl}`);
    }
    
    console.log("✅ Configuración validada correctamente");
  }

  static logConfiguration() {
    const config = this.#config;
    
    if (!config.verboseLogging && !config.isDevelopment) {
      return;
    }
    
    console.log("📋 Configuración cargada:");
    console.log(`   Entorno: ${config.nodeEnv} (${config.isDevelopment ? "Desarrollo" : "Producción"})`);
    console.log(`   Client ID: ${config.clientId.substring(0, 10)}...`);
    console.log(`   API Base URL: ${config.apiBaseUrl}`);
    console.log(`   Timeout HTTP: ${config.httpTimeout}ms`);
    console.log(`   Reintentos: ${config.maxRetries}`);
    console.log(`   Caché TTL: ${config.cacheTtl}ms`);
    console.log(`   Umbral bajo: ${config.lowQuotaThreshold}%`);
    console.log(`   Umbral crítico: ${config.criticalQuotaThreshold}%`);
    
    if (config.isDevelopment) {
      console.log("🔧 Modo desarrollo activado - logging detallado habilitado");
    }
  }

  static reload() {
    this.#config = null;
    return this.initialize();
  }
}

export default ConfigService;