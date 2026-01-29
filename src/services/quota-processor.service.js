import { QuotaGroup } from "../models/account.model.js";
import { ModelClassifierService } from "./model-classifier.service.js";

export class QuotaProcessorService {
  constructor() {
    this.groups = new Map();
  }

  processModels(models) {
    this.groups.clear();
    
    if (!models || typeof models !== "object") {
      return this.getProcessedGroups();
    }

    for (const [modelName, info] of Object.entries(models)) {
      const groupName = ModelClassifierService.classify(modelName);
      if (!groupName || !info || !info.quotaInfo) {
        continue;
      }

      const remaining = info.quotaInfo.remainingFraction ?? 0;
      const resetTime = info.quotaInfo.resetTime;
      
      this.updateGroup(groupName, remaining, resetTime);
    }

    return this.getProcessedGroups();
  }

  updateGroup(groupName, remainingFraction, resetTime) {
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, new QuotaGroup(groupName));
    }

    const group = this.groups.get(groupName);
    group.update(remainingFraction, resetTime);
  }

  getProcessedGroups() {
    const result = {};
    
    for (const [groupName, group] of this.groups) {
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

  static formatDuration(targetTime) {
    if (!targetTime) {
      return "N/A";
    }

    const targetDate = new Date(targetTime);
    const now = new Date();
    const delta = targetDate - now;

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
}