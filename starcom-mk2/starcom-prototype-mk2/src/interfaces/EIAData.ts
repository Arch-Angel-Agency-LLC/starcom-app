export interface EIAData {
    response: {
      total: string;
      dateFormat: string;
      frequency: string;
      data: {
        period: string; // e.g., "2025-03-07"
        value: number; // e.g., 67.52
      }[];
    };
    request: {
      command: string;
      params: Record<string, any>;
    };
    apiVersion: string;
  }