export interface AgentforceConfig {
  baseUrl: string;
  agentId: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  instanceUrl?: string;
}

export interface RawAgentResponse {
  message: string;
  metadata?: {
    uiDirective?: {
      action: string;
      payload: Record<string, unknown>;
    };
  };
  rawText?: string;
}
