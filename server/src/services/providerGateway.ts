import axios from 'axios';
import { executeQuery } from '../database/connection';
import { Logger } from '../utils/logger';
import { OllamaService, AgentConfig, ChatMessage } from './ollama';

type ProviderType = 'openai' | 'google' | 'glm' | 'ollama' | 'llama_cpp' | 'custom';

type ProviderRow = {
  id: number;
  name: string;
  type: string;
  api_endpoint: string;
  config_json?: any;
  is_active: number | boolean;
};

type ActiveProviderSettings = {
  providerId: number | null;
  providerType: ProviderType | null;
  providerEndpoint: string | null;
  providerName: string | null;
  defaultModel: string | null;
  requestTimeoutMs: number;
  preferStreaming: boolean;
};

export class ProviderGateway {
  private logger = new Logger();
  private ollama = new OllamaService();

  private normalizeProviderType(rawType: unknown): ProviderType | null {
    const t = String(rawType || '').trim().toLowerCase();
    if (!t) return null;
    if (t === 'google' || t === 'gemini') return 'google';
    if (t === 'ollama') return 'ollama';
    if (t === 'openai') return 'openai';
    if (t === 'glm') return 'glm';
    if (t === 'custom') return 'custom';
    if (t === 'llama_cpp' || t === 'llama.cpp' || t === 'llama-cpp' || t === 'llamacpp') return 'llama_cpp';
    return 'custom';
  }

  private async getSystemSetting(key: string): Promise<string | null> {
    try {
      const rows = await executeQuery(
        'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
        [key]
      );
      if (!Array.isArray(rows) || rows.length === 0) return null;
      return (rows[0] as any).setting_value ?? null;
    } catch {
      return null;
    }
  }

  private resolveEnvNumber(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) return fallback;
    const v = parseInt(raw, 10);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  private async getActiveProviderSettings(): Promise<ActiveProviderSettings> {
    const timeoutFromEnv = this.resolveEnvNumber('MODEL_REQUEST_TIMEOUT_MS', 180000);
    const preferStreamingEnv = String(process.env.PREFER_STREAMING || '').toLowerCase();

    const defaultModel =
      (await this.getSystemSetting('default_model')) ||
      process.env.OLLAMA_DEFAULT_MODEL ||
      null;

    const preferStreamingSetting = await this.getSystemSetting('prefer_streaming');
    const timeoutSetting = await this.getSystemSetting('model_request_timeout_ms');
    const activeProviderIdSetting = await this.getSystemSetting('active_provider_id');

    const preferStreaming =
      (typeof preferStreamingSetting === 'string' && preferStreamingSetting.trim() !== ''
        ? ['1', 'true', 'yes', 'on'].includes(preferStreamingSetting.trim().toLowerCase())
        : preferStreamingEnv === '1' || preferStreamingEnv === 'true') ||
      false;

    const requestTimeoutMs =
      (typeof timeoutSetting === 'string' && timeoutSetting.trim() !== ''
        ? parseInt(timeoutSetting.trim(), 10)
        : timeoutFromEnv) ||
      timeoutFromEnv;

    const providerId =
      typeof activeProviderIdSetting === 'string' && activeProviderIdSetting.trim() !== ''
        ? parseInt(activeProviderIdSetting.trim(), 10)
        : null;

    if (!providerId || Number.isNaN(providerId)) {
      return {
        providerId: null,
        providerType: null,
        providerEndpoint: null,
        providerName: null,
        defaultModel,
        requestTimeoutMs,
        preferStreaming
      };
    }

    try {
      const rows = await executeQuery(
        'SELECT id, name, type, api_endpoint, config_json, is_active FROM ai_providers WHERE id = ? LIMIT 1',
        [providerId]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          providerId,
          providerType: null,
          providerEndpoint: null,
          providerName: null,
          defaultModel,
          requestTimeoutMs,
          preferStreaming
        };
      }

      const row = rows[0] as ProviderRow;
      const isActive = Boolean((row as any).is_active ?? (row as any).isActive ?? true);
      if (!isActive) {
        return {
          providerId,
          providerType: null,
          providerEndpoint: null,
          providerName: row.name || null,
          defaultModel,
          requestTimeoutMs,
          preferStreaming
        };
      }

      const endpoint = String((row as any).api_endpoint || '').trim();
      let config: any = (row as any).config_json;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch {
          config = {};
        }
      }

      // Allow provider-specific timeout override via config_json.timeout_ms
      const cfgTimeout = typeof config?.timeout_ms === 'number' ? config.timeout_ms : undefined;
      const cfgPreferStreaming = typeof config?.prefer_streaming === 'boolean' ? config.prefer_streaming : undefined;

      return {
        providerId,
        providerType: this.normalizeProviderType(row.type),
        providerEndpoint: endpoint || null,
        providerName: row.name || null,
        defaultModel,
        requestTimeoutMs: typeof cfgTimeout === 'number' ? cfgTimeout : requestTimeoutMs,
        preferStreaming: typeof cfgPreferStreaming === 'boolean' ? cfgPreferStreaming : preferStreaming
      };
    } catch (e) {
      this.logger.warn('Failed to resolve active provider; falling back to env/default provider', e);
      return {
        providerId,
        providerType: null,
        providerEndpoint: null,
        providerName: null,
        defaultModel,
        requestTimeoutMs,
        preferStreaming
      };
    }
  }

  private resolveApiKeyFromConfig(config: any): string | null {
    // Security policy: do NOT persist raw API keys in DB. Accept only env var references.
    const envVar = typeof config?.apiKeyEnvVar === 'string' ? config.apiKeyEnvVar.trim() : '';
    if (envVar && process.env[envVar]) return String(process.env[envVar]);

    // Allow fallback to conventional env names.
    if (process.env.GOOGLE_GEMINI_API_KEY) return String(process.env.GOOGLE_GEMINI_API_KEY);
    if (process.env.GOOGLE_API_KEY) return String(process.env.GOOGLE_API_KEY);
    return null;
  }

  private async geminiGenerate(prompt: string, model: string, timeoutMs: number, config: any): Promise<string> {
    const apiKey = this.resolveApiKeyFromConfig(config);
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Set GOOGLE_GEMINI_API_KEY (or config_json.apiKeyEnvVar).');
    }

    // Endpoint default: https://generativelanguage.googleapis.com
    const base = (typeof config?.base_url === 'string' && config.base_url.trim())
      ? config.base_url.trim().replace(/\/+$/, '')
      : 'https://generativelanguage.googleapis.com';

    const url = `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      },
      {
        timeout: timeoutMs,
        validateStatus: () => true,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.status < 200 || response.status >= 300) {
      const msg = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
      throw new Error(`Gemini request failed (${response.status}): ${msg}`);
    }

    const candidates = (response.data as any)?.candidates;
    const text = candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') || '';
    return String(text || '').trim();
  }

  private async openAiCompatibleChat(
    endpoint: string,
    apiKey: string | null,
    model: string,
    messages: Array<{ role: string; content: string }>,
    timeoutMs: number
  ): Promise<string> {
    const url = `${endpoint.replace(/\/+$/, '')}/v1/chat/completions`;
    const response = await axios.post(
      url,
      {
        model,
        messages,
        stream: false
      },
      {
        timeout: timeoutMs,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        }
      }
    );

    if (response.status < 200 || response.status >= 300) {
      const msg = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
      throw new Error(`OpenAI-compatible request failed (${response.status}): ${msg}`);
    }

    const content = (response.data as any)?.choices?.[0]?.message?.content;
    return String(content || '').trim();
  }

  async generate(prompt: string, modelOverride?: string, agentConfig?: AgentConfig): Promise<string> {
    const settings = await this.getActiveProviderSettings();

    // Model selection: request override > agent config model > system default
    const resolvedModel =
      (typeof modelOverride === 'string' && modelOverride.trim() ? modelOverride.trim() : null) ||
      (typeof agentConfig?.config?.model === 'string' && agentConfig.config.model.trim() ? agentConfig.config.model.trim() : null) ||
      settings.defaultModel ||
      'llama3.1:latest';

    // If no active provider: default to OllamaService configured via env.
    if (!settings.providerType) {
      return this.ollama.generate(prompt, resolvedModel, agentConfig, {
        timeoutMs: settings.requestTimeoutMs,
        preferStreaming: settings.preferStreaming
      });
    }

    // Load provider config
    let providerConfig: any = {};
    try {
      const rows = await executeQuery('SELECT config_json FROM ai_providers WHERE id = ? LIMIT 1', [settings.providerId]);
      const cfg = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).config_json : null;
      providerConfig = typeof cfg === 'string' ? JSON.parse(cfg) : (cfg || {});
    } catch {
      providerConfig = {};
    }

    if (settings.providerType === 'google') {
      const geminiModel =
        (typeof providerConfig?.default_model === 'string' && providerConfig.default_model.trim()
          ? providerConfig.default_model.trim()
          : resolvedModel);
      return this.geminiGenerate(prompt, geminiModel, settings.requestTimeoutMs, providerConfig);
    }

    if (settings.providerType === 'llama_cpp') {
      if (!settings.providerEndpoint) {
        throw new Error('llama.cpp provider endpoint is missing');
      }

      const apiKey = this.resolveApiKeyFromConfig(providerConfig);
      const msg = [{ role: 'user', content: prompt }];
      return this.openAiCompatibleChat(settings.providerEndpoint, apiKey, resolvedModel, msg, settings.requestTimeoutMs);
    }

    // ollama/custom/openai/glm: treat as ollama-like if endpoint provided.
    if (settings.providerEndpoint) {
      return this.ollama.generate(prompt, resolvedModel, agentConfig, {
        baseURL: settings.providerEndpoint,
        timeoutMs: settings.requestTimeoutMs,
        preferStreaming: settings.preferStreaming
      });
    }

    return this.ollama.generate(prompt, resolvedModel, agentConfig, {
      timeoutMs: settings.requestTimeoutMs,
      preferStreaming: settings.preferStreaming
    });
  }

  async chat(messages: ChatMessage[], modelOverride?: string, agentConfig?: AgentConfig): Promise<string> {
    const settings = await this.getActiveProviderSettings();

    const resolvedModel =
      (typeof modelOverride === 'string' && modelOverride.trim() ? modelOverride.trim() : null) ||
      (typeof agentConfig?.config?.model === 'string' && agentConfig.config.model.trim() ? agentConfig.config.model.trim() : null) ||
      settings.defaultModel ||
      'llama3.1:latest';

    if (!settings.providerType) {
      return this.ollama.chat(messages, resolvedModel, agentConfig, {
        timeoutMs: settings.requestTimeoutMs,
        preferStreaming: settings.preferStreaming
      });
    }

    let providerConfig: any = {};
    try {
      const rows = await executeQuery('SELECT config_json FROM ai_providers WHERE id = ? LIMIT 1', [settings.providerId]);
      const cfg = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).config_json : null;
      providerConfig = typeof cfg === 'string' ? JSON.parse(cfg) : (cfg || {});
    } catch {
      providerConfig = {};
    }

    if (settings.providerType === 'google') {
      const modelName =
        (typeof providerConfig?.default_model === 'string' && providerConfig.default_model.trim()
          ? providerConfig.default_model.trim()
          : resolvedModel);

      // Very simple prompt serialization for chat
      const joined = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      return this.geminiGenerate(joined, modelName, settings.requestTimeoutMs, providerConfig);
    }

    if (settings.providerType === 'llama_cpp') {
      if (!settings.providerEndpoint) {
        throw new Error('llama.cpp provider endpoint is missing');
      }
      const apiKey = this.resolveApiKeyFromConfig(providerConfig);
      return this.openAiCompatibleChat(
        settings.providerEndpoint,
        apiKey,
        resolvedModel,
        messages.map(m => ({ role: m.role, content: m.content })),
        settings.requestTimeoutMs
      );
    }

    if (settings.providerEndpoint) {
      return this.ollama.chat(messages, resolvedModel, agentConfig, {
        baseURL: settings.providerEndpoint,
        timeoutMs: settings.requestTimeoutMs,
        preferStreaming: settings.preferStreaming
      });
    }

    return this.ollama.chat(messages, resolvedModel, agentConfig, {
      timeoutMs: settings.requestTimeoutMs,
      preferStreaming: settings.preferStreaming
    });
  }
}
