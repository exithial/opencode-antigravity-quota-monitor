import { ConfigService } from "./config.service.js";

export class ApiService {
  constructor(options = {}) {
    const config = ConfigService.getAll();
    
    this.fetch = options.fetch || globalThis.fetch;
    this.baseUrl = options.baseUrl || config.apiBaseUrl;
    this.userAgent = options.userAgent || config.userAgent;
    this.timeout = options.timeout || config.httpTimeout;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async postJson(url, token, body, extraHeaders = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": this.userAgent,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    const response = await this.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.clientId || "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com",
        client_secret: this.clientSecret || "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",
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Token refresh failed (${response.status}): ${text.slice(0, 200)}`);
    }

    const payload = await response.json();
    return payload.access_token;
  }

  async loadProjectId(accessToken) {
    const body = { metadata: { ideType: "ANTIGRAVITY" } };
    const response = await this.postJson(
      `${this.baseUrl}/v1internal:loadCodeAssist`,
      accessToken,
      body
    );

    if (!response.ok) {
      return "";
    }

    const payload = await response.json();
    if (typeof payload.cloudaicompanionProject === "string") {
      return payload.cloudaicompanionProject;
    }
    if (payload.cloudaicompanionProject && typeof payload.cloudaicompanionProject.id === "string") {
      return payload.cloudaicompanionProject.id;
    }
    return "";
  }

  async fetchAvailableModels(accessToken, projectId) {
    const body = projectId ? { project: projectId } : {};
    const response = await this.postJson(
      `${this.baseUrl}/v1internal:fetchAvailableModels`,
      accessToken,
      body
    );

    return response;
  }
}