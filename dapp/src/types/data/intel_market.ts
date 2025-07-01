/**
 * Program IDL for Intel Market
 * Generated from: target/idl/intel_market.json
 */
// TODO: Implement type-safe API client generation from OpenAPI specifications - PRIORITY: MEDIUM
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
