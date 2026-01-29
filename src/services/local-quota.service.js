import { QuotaGroup } from "../models/account.model.js";
import { ModelClassifierService } from "./model-classifier.service.js";

export class LocalQuotaService {
  static parseRateLimitResetTimes(rateLimitResetTimes) {
    if (!rateLimitResetTimes || typeof rateLimitResetTimes !== "object") {
      return {};
    }

    const groups = new Map();
    const now = Date.now();

    for (const [modelKey, resetTimestamp] of Object.entries(rateLimitResetTimes)) {
      const groupName = this.classifyFromKey(modelKey);
      if (!groupName) continue;

      if (!groups.has(groupName)) {
        groups.set(groupName, new QuotaGroup(groupName));
      }

      const group = groups.get(groupName);
      
      // Calcular estado basado en tiempo de reset
      const resetTime = new Date(resetTimestamp).toISOString();
      const timeUntilReset = resetTimestamp - now;
      
      // Si ya pasó el tiempo de reset, la cuota está disponible (100%)
      // Si falta tiempo, asumimos 0% (limited)
      const remainingFraction = timeUntilReset <= 0 ? 1.0 : 0.0;
      
      group.update(remainingFraction, resetTime);
    }

    return this.convertToResult(groups);
  }

  static classifyFromKey(modelKey) {
    if (!modelKey || typeof modelKey !== "string") {
      return null;
    }

    const lower = modelKey.toLowerCase();
    
    if (lower.includes("claude")) {
      return "claude";
    }
    
    if (lower.includes("gemini-3-pro") || lower.includes("antigravity-gemini-3-pro")) {
      return "gemini-pro";
    }
    
    if (lower.includes("gemini-3-flash") || lower.includes("gemini-3-flash-preview")) {
      return "gemini-flash";
    }
    
    return null;
  }

  static convertToResult(groupsMap) {
    const result = {};
    
    for (const [groupName, group] of groupsMap) {
      const key = ModelClassifierService.getGroupKey(groupName);
      result[key] = group.toJSON();
    }

    // Asegurar que todos los grupos existan
    ModelClassifierService.getAllGroups().forEach(groupName => {
      const key = ModelClassifierService.getGroupKey(groupName);
      if (!result[key]) {
        result[key] = new QuotaGroup(groupName).toJSON();
      }
    });

    return result;
  }

  static calculateStatusFromResetTime(resetTimestamp) {
    if (!resetTimestamp) {
      return "UNKNOWN";
    }

    const now = Date.now();
    const timeUntilReset = resetTimestamp - now;

    if (timeUntilReset <= 0) {
      return "OK"; // Ya se reseteó
    }

    // Si falta menos de 1 hora, considerar "LOW"
    if (timeUntilReset <= 3600000) { // 1 hora
      return "LOW";
    }

    return "LIMITED";
  }

  static formatResetTime(resetTimestamp) {
    if (!resetTimestamp) {
      return "N/A";
    }

    const resetDate = new Date(resetTimestamp);
    const now = new Date();
    const delta = resetDate - now;

    if (delta <= 0) {
      return "NOW";
    }

    const totalSeconds = Math.round(delta / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    }
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    
    if (minutes > 0) {
      return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
    }
    
    return `${seconds}s`;
  }

  static mergeLocalAndApiData(localData, apiData) {
    const merged = { ...apiData };

    // Para cada grupo, usar el dato más reciente
    for (const [groupKey, localGroup] of Object.entries(localData)) {
      const apiGroup = apiData[groupKey];

      if (!apiGroup || apiGroup.status === "UNKNOWN") {
        // Si la API no tiene datos o son desconocidos, usar los locales
        merged[groupKey] = localGroup;
      } else if (localGroup.resetTime && apiGroup.resetTime) {
        // Si ambos tienen resetTime, usar el más temprano (más urgente)
        const localReset = new Date(localGroup.resetTime).getTime();
        const apiReset = new Date(apiGroup.resetTime).getTime();
        
        if (localReset < apiReset) {
          merged[groupKey].resetTime = localGroup.resetTime;
        }
      }
    }

    return merged;
  }

  static getLocalQuotaSummary(accountData) {
    if (!accountData || !accountData.rateLimitResetTimes) {
      return {
        hasLocalData: false,
        groups: {},
        timestamp: new Date().toISOString()
      };
    }

    const groups = this.parseRateLimitResetTimes(accountData.rateLimitResetTimes);
    
    return {
      hasLocalData: true,
      groups,
      timestamp: new Date().toISOString(),
      source: "local_json"
    };
  }
}

export default LocalQuotaService;