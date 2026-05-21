import Anthropic from "@anthropic-ai/sdk";

function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY must be set.");
  }
  return new Anthropic({ apiKey });
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
