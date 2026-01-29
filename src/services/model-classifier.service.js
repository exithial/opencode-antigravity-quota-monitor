export class ModelClassifierService {
  static classify(modelName) {
    if (!modelName || typeof modelName !== "string") {
      return null;
    }

    const lower = modelName.toLowerCase();
    
    if (lower.includes("claude")) {
      return "claude";
    }
    
    if (!lower.includes("gemini-3")) {
      return null;
    }
    
    if (lower.includes("flash")) {
      return "gemini-flash";
    }
    
    return "gemini-pro";
  }

  static getDisplayName(group) {
    const displayNames = {
      "claude": "Claude",
      "gemini-pro": "Gemini 3 Pro",
      "gemini-flash": "Gemini 3 Flash"
    };
    
    return displayNames[group] || group;
  }

  static getAllGroups() {
    return ["claude", "gemini-pro", "gemini-flash"];
  }

  static getGroupKey(group) {
    const keyMap = {
      "claude": "claude",
      "gemini-pro": "geminiPro",
      "gemini-flash": "geminiFlash"
    };
    
    return keyMap[group] || group;
  }
}