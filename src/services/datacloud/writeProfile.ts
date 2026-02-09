import type { ChatSummary, MeaningfulEvent, CapturedProfileField } from '@/types/customer';
import type { DataCloudConfig } from './types';

const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export class DataCloudWriteService {
  private config: DataCloudConfig;
  private accessToken: string | null;
  private tokenExpiresAt = 0;

  constructor(config: DataCloudConfig) {
    this.config = config;
    this.accessToken = config.accessToken || null;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (this.accessToken && !this.config.clientId) {
      return this.accessToken;
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      if (this.accessToken) return this.accessToken;
      throw new Error('No Data Cloud access token or OAuth credentials configured');
    }

    const tokenUrl = '/api/oauth/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Data Cloud OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 7200_000) - 300_000;
    return this.accessToken!;
  }

  private async postJson(path: string, body: Record<string, unknown>): Promise<void> {
    const token = await this.getAccessToken();
    // Route through proxy to avoid CORS
    const proxyPath = path.replace(/^\/services\/data\/v60\.0/, '/api/datacloud');
    const response = await fetch(proxyPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Data Cloud write failed (${response.status}): ${errText}`);
    }
  }

  async writeChatSummary(
    customerId: string,
    sessionId: string,
    summary: ChatSummary,
  ): Promise<void> {
    if (useMockData) {
      console.log('[mock] Would write chat summary:', summary.summary);
      return;
    }

    await this.postJson('/services/data/v60.0/sobjects/Chat_Summary__c', {
      Customer_Id__c: customerId,
      Session_Id__c: sessionId,
      Session_Date__c: summary.sessionDate,
      Summary_Text__c: summary.summary,
      Sentiment__c: summary.sentiment,
      Topics_Discussed__c: summary.topicsDiscussed.join(';'),
    });
  }

  async writeMeaningfulEvent(
    customerId: string,
    sessionId: string,
    event: MeaningfulEvent,
  ): Promise<void> {
    if (useMockData) {
      console.log('[mock] Would write meaningful event:', event.description, event.eventDate ? `(${event.eventDate})` : '');
      return;
    }

    // Build the record with optional temporal fields
    const record: Record<string, unknown> = {
      Customer_Id__c: customerId,
      Session_Id__c: sessionId,
      Event_Type__c: event.eventType,
      Description__c: event.description,
      Captured_At__c: event.capturedAt,
      Agent_Note__c: event.agentNote || '',
      Metadata_JSON__c: event.metadata ? JSON.stringify(event.metadata) : null,
    };

    // Add temporal fields for journey orchestration
    if (event.relativeTimeText) {
      record.Relative_Time_Text__c = event.relativeTimeText;
    }
    if (event.eventDate) {
      record.Event_Date__c = event.eventDate;
    }
    if (event.urgency) {
      record.Urgency__c = event.urgency;
    }

    await this.postJson('/services/data/v60.0/sobjects/Meaningful_Event__c', record);
  }

  async writeCapturedProfileField(
    customerId: string,
    sessionId: string,
    fieldName: string,
    field: CapturedProfileField,
  ): Promise<void> {
    if (useMockData) {
      console.log('[mock] Would write profile field:', fieldName, '=', field.value);
      return;
    }

    const dataType = Array.isArray(field.value) ? 'array' : 'string';
    const fieldValue = dataType === 'array' ? JSON.stringify(field.value) : String(field.value);

    await this.postJson('/services/data/v60.0/sobjects/Agent_Captured_Profile__c', {
      Customer_Id__c: customerId,
      Field_Name__c: fieldName,
      Field_Value__c: fieldValue,
      Captured_At__c: field.capturedAt,
      Captured_From__c: field.capturedFrom || `chat session ${sessionId}`,
      Confidence__c: field.confidence,
      Data_Type__c: dataType,
    });
  }
}

let writeService: DataCloudWriteService | null = null;

export const getDataCloudWriteService = (): DataCloudWriteService => {
  if (!writeService) {
    writeService = new DataCloudWriteService({
      baseUrl: import.meta.env.VITE_DATACLOUD_BASE_URL || '',
      accessToken: import.meta.env.VITE_DATACLOUD_ACCESS_TOKEN || '',
      clientId: import.meta.env.VITE_DATACLOUD_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_DATACLOUD_CLIENT_SECRET || '',
    });
  }
  return writeService;
};
