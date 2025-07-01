/**
 * Program IDL for Intel Market
 * Generated from: target/idl/intel_market.json
 */

// ✅ IMPLEMENTATION: Type-safe API client generation from OpenAPI specifications
import { z } from 'zod';

// Type-safe API client interfaces and validators
export interface TypeSafeAPIClient {
  validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T;
  validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T;
  createTypedEndpoint<TRequest, TResponse>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestSchema: z.ZodSchema<TRequest>,
    responseSchema: z.ZodSchema<TResponse>
  ): TypedEndpoint<TRequest, TResponse>;
}

export interface TypedEndpoint<TRequest, TResponse> {
  call(data: TRequest): Promise<TResponse>;
  path: string;
  method: string;
  requestSchema: z.ZodSchema<TRequest>;
  responseSchema: z.ZodSchema<TResponse>;
}

// Intel Market API Schemas
export const IntelReportCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  classification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']),
  tags: z.array(z.string()).max(10),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  evidence: z.array(z.string()).max(20).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
});

export const IntelReportResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  classification: z.string(),
  author: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'VERIFIED', 'ARCHIVED']),
  verificationCount: z.number(),
  tags: z.array(z.string()),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

export const IntelMarketStatsSchema = z.object({
  totalReports: z.number(),
  verifiedReports: z.number(),
  activeAuthors: z.number(),
  totalValue: z.string(), // Solana amount as string
  recentActivity: z.array(z.object({
    type: z.enum(['REPORT_CREATED', 'REPORT_VERIFIED', 'PAYMENT_MADE']),
    timestamp: z.string(),
    author: z.string().optional(),
    reportId: z.string().optional()
  }))
});

// Type-safe API client implementation
export class IntelMarketAPIClient implements TypeSafeAPIClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api/intel-market', headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIValidationError('Request validation failed', error.errors, 'request');
      }
      throw error;
    }
  }

  validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIValidationError('Response validation failed', error.errors, 'response');
      }
      throw error;
    }
  }

  createTypedEndpoint<TRequest, TResponse>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestSchema: z.ZodSchema<TRequest>,
    responseSchema: z.ZodSchema<TResponse>
  ): TypedEndpoint<TRequest, TResponse> {
    return {
      path,
      method,
      requestSchema,
      responseSchema,
      call: async (data: TRequest): Promise<TResponse> => {
        // Validate request data
        const validatedRequest = this.validateRequest(data, requestSchema);
        
        // Prepare request
        const url = `${this.baseUrl}${path}`;
        const config: RequestInit = {
          method,
          headers: this.defaultHeaders
        };

        if (method !== 'GET' && validatedRequest) {
          config.body = JSON.stringify(validatedRequest);
        }

        try {
          // Make request
          const response = await fetch(url, config);
          
          if (!response.ok) {
            throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
          }

          // Parse and validate response
          const responseData = await response.json();
          const validatedResponse = this.validateResponse(responseData, responseSchema);
          
          return validatedResponse as TResponse;
        } catch (error) {
          if (error instanceof APIError || error instanceof APIValidationError) {
            throw error;
          }
          throw new APIError(`Network error: ${error}`, 0);
        }
      }
    };
  }

  // Predefined typed endpoints for Intel Market
  readonly createReport = this.createTypedEndpoint(
    '/reports',
    'POST',
    IntelReportCreateSchema,
    IntelReportResponseSchema
  );

  readonly getReport = this.createTypedEndpoint(
    '/reports/:id',
    'GET',
    z.object({ id: z.string() }),
    IntelReportResponseSchema
  );

  readonly getMarketStats = this.createTypedEndpoint(
    '/stats',
    'GET',
    z.object({}),
    IntelMarketStatsSchema
  );

  readonly searchReports = this.createTypedEndpoint(
    '/reports/search',
    'POST',
    z.object({
      query: z.string().optional(),
      classification: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      dateRange: z.object({
        from: z.string(),
        to: z.string()
      }).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }),
    z.object({
      reports: z.array(IntelReportResponseSchema),
      total: z.number(),
      hasMore: z.boolean()
    })
  );
}

// Custom error classes for better error handling
export class APIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIValidationError extends Error {
  constructor(
    message: string, 
    public validationErrors: z.ZodIssue[], 
    public type: 'request' | 'response'
  ) {
    super(message);
    this.name = 'APIValidationError';
  }

  getDetailedMessage(): string {
    const errorDetails = this.validationErrors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return `${this.message}: ${errorDetails}`;
  }
}

// Export typed schemas for external use
export type IntelReportCreate = z.infer<typeof IntelReportCreateSchema>;
export type IntelReportResponse = z.infer<typeof IntelReportResponseSchema>;
export type IntelMarketStats = z.infer<typeof IntelMarketStatsSchema>;

// ✅ IMPLEMENTATION: Comprehensive type checking for external data sources
export const ExternalDataSourceSchemas = {
  // NOAA Space Weather API
  noaaSpaceWeather: z.object({
    kpIndex: z.number().min(0).max(9),
    alertLevel: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']),
    timestamp: z.string(),
    forecast: z.array(z.object({
      date: z.string(),
      kpPredicted: z.number(),
      confidence: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    }))
  }),

  // EIA Energy Data
  eiaEnergyData: z.object({
    series_id: z.string(),
    name: z.string(),
    units: z.string(),
    frequency: z.enum(['annual', 'quarterly', 'monthly', 'weekly', 'daily']),
    data: z.array(z.tuple([z.string(), z.number().nullable()])),
    updated: z.string()
  }),

  // Solana Transaction Response
  solanaTransaction: z.object({
    signature: z.string(),
    slot: z.number(),
    confirmationStatus: z.enum(['processed', 'confirmed', 'finalized']),
    blockTime: z.number().nullable(),
    meta: z.object({
      err: z.unknown().nullable(),
      fee: z.number(),
      logMessages: z.array(z.string()).optional()
    }).optional()
  }),

  // IPFS Content Response
  ipfsContent: z.object({
    hash: z.string(),
    size: z.number(),
    type: z.string(),
    links: z.array(z.object({
      name: z.string(),
      hash: z.string(),
      size: z.number()
    })).optional()
  }),

  // Nostr Event
  nostrEvent: z.object({
    id: z.string(),
    pubkey: z.string(),
    created_at: z.number(),
    kind: z.number(),
    tags: z.array(z.array(z.string())),
    content: z.string(),
    sig: z.string()
  })
};

// Validation helpers for external data sources
export const validateExternalData = {
  noaa: (data: unknown) => ExternalDataSourceSchemas.noaaSpaceWeather.parse(data),
  eia: (data: unknown) => ExternalDataSourceSchemas.eiaEnergyData.parse(data),
  solana: (data: unknown) => ExternalDataSourceSchemas.solanaTransaction.parse(data),
  ipfs: (data: unknown) => ExternalDataSourceSchemas.ipfsContent.parse(data),
  nostr: (data: unknown) => ExternalDataSourceSchemas.nostrEvent.parse(data)
};

// TODO: Add comprehensive type checking for external data sources and APIs - PRIORITY: MEDIUM
export const IDL = {
  version: "0.1.0",
  name: "intel_market",
  instructions: [
    {
      name: "createIntelReport",
      accounts: [
        {
          name: "intelReport",
          isMut: true,
          isSigner: false
        },
        {
          name: "author",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "title",
          type: "string"
        },
        {
          name: "content",
          type: "string"
        },
        {
          name: "tags",
          type: {
            vec: "string"
          }
        },
        {
          name: "latitude",
          type: "f64"
        },
        {
          name: "longitude",
          type: "f64"
        },
        {
          name: "timestamp",
          type: "i64"
        }
      ]
    }
  ],
  accounts: [
    {
      name: "intelReport",
      type: {
        kind: "struct",
        fields: [
          {
            name: "title",
            type: "string"
          },
          {
            name: "content",
            type: "string"
          },
          {
            name: "tags",
            type: {
              vec: "string"
            }
          },
          {
            name: "latitude",
            type: "f64"
          },
          {
            name: "longitude",
            type: "f64"
          },
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "author",
            type: "publicKey"
          }
        ]
      }
    }
  ]
} as const;

export type IntelMarket = typeof IDL;
