import Anthropic from "@anthropic-ai/sdk";

function createClient(): Anthropic {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ??
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Anthropic API key found. Set AI_INTEGRATIONS_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.",
    );
  }

  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

let _client: Anthropic | null = null;

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_client) {
      _client = createClient();
    }
    const value = (_client as any)[prop];
    return typeof value === "function" ? value.bind(_client) : value;
  },
});
