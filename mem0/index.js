"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  API_VERSION: () => API_VERSION,
  MemoryClient: () => MemoryClient,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/mem0.ts
var import_axios = __toESM(require("axios"));
var APIError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "APIError";
  }
};
var MemoryClient = class {
  _validateApiKey() {
    if (!this.apiKey) {
      throw new Error("Mem0 API key is required");
    }
    if (typeof this.apiKey !== "string") {
      throw new Error("Mem0 API key must be a string");
    }
    if (this.apiKey.trim() === "") {
      throw new Error("Mem0 API key cannot be empty");
    }
  }
  _validateOrgProject() {
    if (this.organizationName === null && this.projectName !== null || this.organizationName !== null && this.projectName === null) {
      console.warn("Warning: Both organizationName and projectName must be provided together when using either. This will be removedfrom the version 1.0.40. Note that organizationName/projectName are being deprecated in favor of organizationId/projectId.");
    }
    if (this.organizationId === null && this.projectId !== null || this.organizationId !== null && this.projectId === null) {
      console.warn("Warning: Both organizationId and projectId must be provided together when using either. This will be removedfrom the version 1.0.40.");
    }
  }
  constructor(options) {
    this.apiKey = options.apiKey;
    this.host = options.host || "https://api.mem0.ai";
    this.organizationName = options.organizationName || null;
    this.projectName = options.projectName || null;
    this.organizationId = options.organizationId || null;
    this.projectId = options.projectId || null;
    this.headers = {
      "Authorization": `Token ${this.apiKey}`,
      "Content-Type": "application/json"
    };
    this.client = import_axios.default.create({
      baseURL: this.host,
      headers: { Authorization: `Token ${this.apiKey}` },
      timeout: 6e4
    });
    this._validateApiKey();
    this._validateOrgProject();
  }
  async _fetchWithErrorHandling(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.text();
      throw new APIError(`API request failed: ${errorData}`);
    }
    const jsonResponse = await response.json();
    return jsonResponse;
  }
  _preparePayload(messages, options) {
    const payload = {};
    if (typeof messages === "string") {
      payload.messages = [{ role: "user", content: messages }];
    } else if (Array.isArray(messages)) {
      payload.messages = messages;
    }
    return { ...payload, ...options };
  }
  _prepareParams(options) {
    return Object.fromEntries(Object.entries(options).filter(([_, v]) => v != null));
  }
  async add(messages, options = {}) {
    this._validateOrgProject();
    if (this.organizationName != null && this.projectName != null) {
      options.org_name = this.organizationName;
      options.project_name = this.projectName;
    }
    if (this.organizationId != null && this.projectId != null) {
      options.org_id = this.organizationId;
      options.project_id = this.projectId;
      if (options.org_name) delete options.org_name;
      if (options.project_name) delete options.project_name;
    }
    const payload = this._preparePayload(messages, options);
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/memories/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    return response;
  }
  async get(memoryId) {
    return this._fetchWithErrorHandling(`${this.host}/v1/memories/${memoryId}/`, {
      headers: this.headers
    });
  }
  getAll(options) {
    this._validateOrgProject();
    const { api_version, page, page_size, ...otherOptions } = options;
    if (this.organizationName != null && this.projectName != null) {
      otherOptions.org_name = this.organizationName;
      otherOptions.project_name = this.projectName;
    }
    let appendedParams = "";
    let paginated_response = false;
    if (page && page_size) {
      appendedParams += `page=${page}&page_size=${page_size}`;
      paginated_response = true;
    }
    if (this.organizationId != null && this.projectId != null) {
      otherOptions.org_id = this.organizationId;
      otherOptions.project_id = this.projectId;
      if (otherOptions.org_name) delete otherOptions.org_name;
      if (otherOptions.project_name) delete otherOptions.project_name;
    }
    if (api_version === "v2") {
      let url = paginated_response ? `${this.host}/v2/memories/?${appendedParams}` : `${this.host}/v2/memories/`;
      return this._fetchWithErrorHandling(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(otherOptions)
      });
    } else {
      const params = new URLSearchParams(this._prepareParams(otherOptions));
      const url = paginated_response ? `${this.host}/v1/memories/?${params}&${appendedParams}` : `${this.host}/v1/memories/?${params}`;
      return this._fetchWithErrorHandling(url, {
        headers: this.headers
      });
    }
  }
  async search(query, options) {
    this._validateOrgProject();
    const { api_version, ...otherOptions } = options;
    const payload = { query, ...otherOptions };
    if (this.organizationName != null && this.projectName != null) {
      payload.org_name = this.organizationName;
      payload.project_name = this.projectName;
    }
    if (this.organizationId != null && this.projectId != null) {
      payload.org_id = this.organizationId;
      payload.project_id = this.projectId;
      if (payload.org_name) delete payload.org_name;
      if (payload.project_name) delete payload.project_name;
    }
    const endpoint = api_version === "v2" ? "/v2/memories/search/" : "/v1/memories/search/";
    const response = await this._fetchWithErrorHandling(`${this.host}${endpoint}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    return response;
  }
  async delete(memoryId) {
    return this._fetchWithErrorHandling(`${this.host}/v1/memories/${memoryId}/`, {
      method: "DELETE",
      headers: this.headers
    });
  }
  async deleteAll(options = {}) {
    this._validateOrgProject();
    if (this.organizationName != null && this.projectName != null) {
      options.org_name = this.organizationName;
      options.project_name = this.projectName;
    }
    if (this.organizationId != null && this.projectId != null) {
      options.org_id = this.organizationId;
      options.project_id = this.projectId;
      if (options.org_name) delete options.org_name;
      if (options.project_name) delete options.project_name;
    }
    const params = new URLSearchParams(this._prepareParams(options));
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/memories/?${params}`, {
      method: "DELETE",
      headers: this.headers
    });
    return response;
  }
  async history(memoryId) {
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/memories/${memoryId}/history/`, {
      headers: this.headers
    });
    return response;
  }
  async users() {
    this._validateOrgProject();
    const options = {};
    if (this.organizationName != null && this.projectName != null) {
      options.org_name = this.organizationName;
      options.project_name = this.projectName;
    }
    if (this.organizationId != null && this.projectId != null) {
      options.org_id = this.organizationId;
      options.project_id = this.projectId;
      if (options.org_name) delete options.org_name;
      if (options.project_name) delete options.project_name;
    }
    const params = new URLSearchParams(options);
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/entities/?${params}`, {
      headers: this.headers
    });
    return response;
  }
  async deleteUser(entityId, entity = { type: "user" }) {
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/entities/${entity.type}/${entityId}/`, {
      method: "DELETE",
      headers: this.headers
    });
    return response;
  }
  async deleteUsers() {
    this._validateOrgProject();
    const entities = await this.users();
    for (const entity of entities.results) {
      let options = {};
      if (this.organizationName != null && this.projectName != null) {
        options.org_name = this.organizationName;
        options.project_name = this.projectName;
      }
      if (this.organizationId != null && this.projectId != null) {
        options.org_id = this.organizationId;
        options.project_id = this.projectId;
        if (options.org_name) delete options.org_name;
        if (options.project_name) delete options.project_name;
      }
      await this.client.delete(`/v1/entities/${entity.type}/${entity.id}/`, { params: options });
    }
    return { message: "All users, agents, and sessions deleted." };
  }
  async batchUpdate(memories) {
    const memoriesBody = memories.map((memory) => ({
      memory_id: memory.memoryId,
      text: memory.text
    }));
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/batch/`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({ memories: memoriesBody })
    });
    return response;
  }
  async batchDelete(memories) {
    const memoriesBody = memories.map((memory) => ({
      memory_id: memory
    }));
    const response = await this._fetchWithErrorHandling(`${this.host}/v1/batch/`, {
      method: "DELETE",
      headers: this.headers,
      body: JSON.stringify({ memories: memoriesBody })
    });
    return response;
  }
  async getProject(options) {
    this._validateOrgProject();
    const { fields } = options;
    if (!(this.organizationId && this.projectId)) {
      throw new Error("organizationId and projectId must be set to access instructions or categories");
    }
    const params = new URLSearchParams();
    fields == null ? void 0 : fields.forEach((field) => params.append("fields", field));
    const response = await this._fetchWithErrorHandling(
      `${this.host}/api/v1/orgs/organizations/${this.organizationId}/projects/${this.projectId}/?${params.toString()}`,
      {
        headers: this.headers
      }
    );
    return response;
  }
  async updateProject(prompts) {
    this._validateOrgProject();
    if (!(this.organizationId && this.projectId)) {
      throw new Error("organizationId and projectId must be set to update instructions or categories");
    }
    const response = await this._fetchWithErrorHandling(
      `${this.host}/api/v1/orgs/organizations/${this.organizationId}/projects/${this.projectId}/`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify(prompts)
      }
    );
    return response;
  }
  // WebHooks
  async getWebhooks() {
    const response = await this._fetchWithErrorHandling(`${this.host}/api/v1/webhooks/${this.projectId}/webhook/`, {
      headers: this.headers
    });
    return response;
  }
  async createWebhook(webhook) {
    const response = await this._fetchWithErrorHandling(`${this.host}/api/v1/webhooks/${this.projectId}/webhook/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(webhook)
    });
    return response;
  }
  async updateWebhook(webhookId, webhook) {
    const response = await this._fetchWithErrorHandling(`${this.host}/api/v1/webhooks/${this.projectId}/webhook/${webhookId}/`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(webhook)
    });
    return response;
  }
  async deleteWebhook(webhookId) {
    const response = await this._fetchWithErrorHandling(`${this.host}/api/v1/webhooks/${this.projectId}/webhook/${webhookId}/`, {
      method: "DELETE",
      headers: this.headers
    });
    return response;
  }
};

// src/mem0.types.ts
var API_VERSION = /* @__PURE__ */ ((API_VERSION2) => {
  API_VERSION2["V1"] = "v1";
  API_VERSION2["V2"] = "v2";
  return API_VERSION2;
})(API_VERSION || {});

// src/index.ts
var src_default = MemoryClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  API_VERSION,
  MemoryClient
});
//# sourceMappingURL=index.js.map
// fix-cjs-exports
if (module.exports.default) {
  Object.assign(module.exports.default, module.exports);
  module.exports = module.exports.default;
  delete module.exports.default;
}
