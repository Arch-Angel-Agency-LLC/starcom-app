/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/intel_market.json`.
 */
export type IntelMarket = {
  "address": "PLACEHOLDER_PROGRAM_ID",
  "metadata": {
    "name": "intelMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Intelligence Exchange Marketplace"
  },
  "instructions": [
    {
      "name": "createIntelReport",
      "discriminator": [0],
      "accounts": [
        {
          "name": "intelReport",
          "writable": true,
          "signer": false
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content", 
          "type": "string"
        },
        {
          "name": "tags",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "latitude",
          "type": "f64"
        },
        {
          "name": "longitude",
          "type": "f64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "intelReport",
      "discriminator": [0],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "tags",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "latitude",
            "type": "f64"
          },
          {
            "name": "longitude",
            "type": "f64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "author",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};

export const IDL: IntelMarket = {
  "address": "PLACEHOLDER_PROGRAM_ID",
  "metadata": {
    "name": "intelMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Intelligence Exchange Marketplace"
  },
  "instructions": [
    {
      "name": "createIntelReport",
      "discriminator": [0],
      "accounts": [
        {
          "name": "intelReport",
          "writable": true,
          "signer": false
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "writable": false,
          "signer": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content", 
          "type": "string"
        },
        {
          "name": "tags",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "latitude",
          "type": "f64"
        },
        {
          "name": "longitude",
          "type": "f64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "intelReport",
      "discriminator": [0],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "tags",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "latitude",
            "type": "f64"
          },
          {
            "name": "longitude",
            "type": "f64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "author",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
};
