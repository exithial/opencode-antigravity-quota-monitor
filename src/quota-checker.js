import { homedir } from "node:os";
import { join } from "node:path";
import { ConfigService } from "./services/config.service.js";
import { CacheService } from "./services/cache.service.js";
import { ApiService } from "./services/api.service.js";
import { LocalQuotaService } from "./services/local-quota.service.js";
import { QuotaProcessorService } from "./services/quota-processor.service.js";
import { AccountModel, AccountResult, CheckAllResult } from "./models/account.model.js";

export class QuotaChecker {
  constructor(options = {}) {
    // Inicializar configuración
    ConfigService.initialize();
    const config = ConfigService.getAll();
    
    this.options = {
      accountsPath: options.accountsPath || config.accountsPath,
      verbose: options.verbose || false,
      force: options.force || false
    };
    
    // Inicializar caché (deshabilitar si force está activado)
    CacheService.initialize();
    if (this.options.force) {
      CacheService.disable();
      if (this.options.verbose) {
        console.log("🔓 Modo force activado - caché deshabilitado");
      }
    }
    
    // Inyectar dependencias
    this.fs = options.fs || null; // Se cargará lazy
    
    this.apiService = new ApiService({
      fetch: options.fetch || globalThis.fetch,
      timeout: options.timeout || config.httpTimeout,
      baseUrl: options.baseUrl || config.apiBaseUrl,
      userAgent: options.userAgent || config.userAgent
    });
    
    this.quotaProcessor = new QuotaProcessorService();
    this.fallbackProjectId = config.fallbackProjectId;
  }

  async #getFs() {
    if (!this.fs) {
      this.fs = (await import("node:fs")).default;
    }
    return this.fs;
  }

  async checkAccount(accountData, index) {
    const accountModel = new AccountModel({ ...accountData, index });
    const result = new AccountResult(accountModel);

    try {
      if (!result.enabled) {
        result.setError("Account disabled");
        return result.toJSON();
      }

      // 1. PRIMERO: Obtener datos locales del JSON (instantáneo)
      const localQuotaData = LocalQuotaService.getLocalQuotaSummary(accountData);
      
      if (localQuotaData.hasLocalData && this.options.verbose) {
        console.log(`📁 Datos locales encontrados para cuenta ${index + 1}`);
      }

      // 2. Intentar obtener datos de la API (más preciso pero más lento)
      let apiQuotaData = null;
      let apiError = null;

      try {
        const accessToken = await this.apiService.refreshAccessToken(accountModel.refreshToken);
        let projectId = await this.apiService.loadProjectId(accessToken);
        
        if (!projectId) {
          projectId = accountModel.managedProjectId || accountModel.projectId || this.fallbackProjectId;
        }
        
        result.setProjectId(projectId);

        // Verificar caché si no estamos en modo force
        const cacheKey = CacheService.generateModelsCacheKey(accessToken, projectId);
        let apiData = null;

        if (!this.options.force) {
          apiData = CacheService.get(cacheKey);
          if (apiData && this.options.verbose) {
            console.log(`📦 Usando datos API cacheados para cuenta ${index + 1}`);
          }
        }

        if (!apiData) {
          const response = await this.apiService.fetchAvailableModels(accessToken, projectId);
          result.statusCode = response.status;

          if (!response.ok) {
            const text = await response.text().catch(() => "");
            apiError = `API error (${response.status}): ${text.trim().slice(0, 200)}`;
          } else {
            apiData = await response.json();
            
            // Guardar en caché si no estamos en modo force
            if (!this.options.force) {
              CacheService.set(cacheKey, apiData);
              if (this.options.verbose) {
                console.log(`💾 Datos API guardados en caché para cuenta ${index + 1}`);
              }
            }
          }
        }

        if (apiData) {
          apiQuotaData = this.quotaProcessor.processModels(apiData.models);
        }

      } catch (error) {
        apiError = error.message;
        if (this.options.verbose) {
          console.log(`⚠️  Error en API para cuenta ${index + 1}: ${error.message}`);
        }
      }

      // 3. Combinar datos locales y de API
      if (apiQuotaData) {
        // Tenemos datos de API - combinarlos con locales
        const mergedData = LocalQuotaService.mergeLocalAndApiData(
          localQuotaData.groups,
          apiQuotaData
        );
        
        Object.entries(mergedData).forEach(([key, groupData]) => {
          result.groups[key] = groupData;
        });

        if (this.options.verbose) {
          console.log(`✅ Datos combinados (local + API) para cuenta ${index + 1}`);
        }

      } else if (localQuotaData.hasLocalData) {
        // Solo tenemos datos locales
        Object.entries(localQuotaData.groups).forEach(([key, groupData]) => {
          result.groups[key] = groupData;
        });

        if (apiError) {
          result.setError(`API falló, usando datos locales: ${apiError}`);
        } else if (this.options.verbose) {
          console.log(`📋 Usando solo datos locales para cuenta ${index + 1}`);
        }

      } else {
        // No tenemos ningún dato
        if (apiError) {
          result.setError(apiError);
        } else {
          result.setError("No se pudieron obtener datos de cuotas");
        }
      }

    } catch (error) {
      result.setError(error);
    }

    return result.toJSON();
  }

  async checkAllAccounts(accountIndex = null) {
    const result = new CheckAllResult();

    try {
      const fs = await this.#getFs();
      const payload = JSON.parse(fs.readFileSync(this.options.accountsPath, "utf8"));
      const accounts = payload.accounts || [];
      result.totalAccounts = accounts.length;

      if (accounts.length === 0) {
        throw new Error("No accounts found in antigravity-accounts.json");
      }

      const selected = accountIndex === null
        ? accounts.map((account, index) => ({ account, index }))
        : accounts
          .map((account, index) => ({ account, index }))
          .filter((item) => item.index === accountIndex);

      for (const { account, index } of selected) {
        if (this.options.verbose) {
          console.log(`Checking account ${index + 1}/${accounts.length}...`);
        }
        
        const accountResult = await this.checkAccount(account, index);
        result.results.push(accountResult);
        result.checkedAccounts++;
      }

    } catch (error) {
      result.setError(error);
    }

    return result.toJSON();
  }

  getSummary(results) {
    const summary = {
      totalAccounts: results.length,
      enabledAccounts: results.filter(r => r.enabled).length,
      disabledAccounts: results.filter(r => !r.enabled).length,
      errorAccounts: results.filter(r => r.error).length,
      models: {
        claude: { ok: 0, low: 0, limited: 0, unknown: 0 },
        geminiPro: { ok: 0, low: 0, limited: 0, unknown: 0 },
        geminiFlash: { ok: 0, low: 0, limited: 0, unknown: 0 }
      }
    };

    for (const result of results) {
      if (!result.enabled || result.error) continue;

      for (const [model, data] of Object.entries(result.groups)) {
        if (data.status === "OK") summary.models[model].ok++;
        else if (data.status === "LOW") summary.models[model].low++;
        else if (data.status === "LIMITED") summary.models[model].limited++;
        else summary.models[model].unknown++;
      }
    }

    return summary;
  }
}

export default QuotaChecker;