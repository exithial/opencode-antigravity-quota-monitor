export class AccountModel {
  constructor(data) {
    this.index = data.index;
    this.email = data.email || `Account ${data.index}`;
    this.enabled = data.enabled !== false;
    this.refreshToken = data.refreshToken;
    this.managedProjectId = data.managedProjectId;
    this.projectId = data.projectId;
    this.timestamp = new Date().toISOString();
  }

  static fromJSON(json) {
    return new AccountModel(json);
  }
}

export class QuotaGroup {
  constructor(name, data = {}) {
    this.name = name;
    this.remainingPercent = data.remainingPercent ?? null;
    this.resetTime = data.resetTime ?? null;
    this.modelCount = data.modelCount ?? 0;
    this.status = data.status ?? "UNKNOWN";
  }

  update(remainingFraction, resetTime) {
    if (typeof remainingFraction === "number") {
      const newPercent = Math.round(remainingFraction * 100);
      if (this.remainingPercent === null || newPercent < this.remainingPercent) {
        this.remainingPercent = newPercent;
      }
    }

    if (resetTime) {
      const timestamp = Date.parse(resetTime);
      if (Number.isFinite(timestamp)) {
        if (!this.resetTime || timestamp < Date.parse(this.resetTime)) {
          this.resetTime = resetTime;
        }
      }
    }

    this.modelCount++;
    this.status = this.calculateStatus();
  }

  calculateStatus() {
    if (this.remainingPercent === null || this.remainingPercent === undefined) {
      return "UNKNOWN";
    }
    if (this.remainingPercent <= 0) return "LIMITED";
    if (this.remainingPercent <= 20) return "LOW";
    if (this.remainingPercent <= 50) return "MEDIUM";
    return "OK";
  }

  toJSON() {
    return {
      name: this.name,
      remainingPercent: this.remainingPercent,
      resetTime: this.resetTime,
      modelCount: this.modelCount,
      status: this.status
    };
  }
}

export class AccountResult {
  constructor(accountModel) {
    this.index = accountModel.index;
    this.email = accountModel.email;
    this.enabled = accountModel.enabled;
    this.projectId = "";
    this.groups = {};
    this.error = null;
    this.timestamp = new Date().toISOString();
  }

  addGroup(groupName, quotaGroup) {
    this.groups[groupName] = quotaGroup.toJSON();
  }

  setError(error) {
    this.error = error instanceof Error ? error.message : String(error);
  }

  setProjectId(projectId) {
    this.projectId = projectId;
  }

  toJSON() {
    return {
      index: this.index,
      email: this.email,
      enabled: this.enabled,
      projectId: this.projectId,
      groups: this.groups,
      error: this.error,
      timestamp: this.timestamp
    };
  }
}

export class CheckAllResult {
  constructor() {
    this.success = true;
    this.totalAccounts = 0;
    this.checkedAccounts = 0;
    this.results = [];
    this.timestamp = new Date().toISOString();
  }

  addResult(result) {
    this.results.push(result);
    this.checkedAccounts++;
  }

  setError(error) {
    this.success = false;
    this.error = error instanceof Error ? error.message : String(error);
  }

  toJSON() {
    return {
      success: this.success,
      totalAccounts: this.totalAccounts,
      checkedAccounts: this.checkedAccounts,
      results: this.results,
      error: this.error,
      timestamp: this.timestamp
    };
  }
}