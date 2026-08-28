// AUTO-GENERATED from contracts/NestTreasuryV2.sol (solc 0.8.28+commit.7893614a.Emscripten.clang, viaIR, optimizer 200 runs).
// Run npm run build:contract after changing the Solidity source.

export const NEST_TREASURY_V2_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "usdcAddress",
        type: "address",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "ownerName",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "executor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxPerRun",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxPerPeriod",
        type: "uint256",
      },
    ],
    name: "AgentPolicyUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "runId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "executor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paymentCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "memoId",
        type: "bytes32",
      },
    ],
    name: "AgentRunRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bool",
        name: "admin",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "string",
        name: "displayName",
        type: "string",
      },
    ],
    name: "MemberAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "MemberRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "settlementId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "memoId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "executedByAgent",
        type: "bool",
      },
    ],
    name: "NetSettlement",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "obligationId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "referenceId",
        type: "bytes32",
      },
    ],
    name: "ObligationAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "displayName",
        type: "string",
      },
    ],
    name: "ProfileUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "treasury",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "TreasuryCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_MEMBERS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PARTICIPANTS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "VERSION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "activityCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "string",
        name: "displayName",
        type: "string",
      },
      {
        internalType: "bool",
        name: "admin",
        type: "bool",
      },
    ],
    name: "addMember",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "participants",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "shares",
        type: "uint256[]",
      },
      {
        internalType: "string",
        name: "category",
        type: "string",
      },
      {
        internalType: "string",
        name: "title",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "referenceId",
        type: "bytes32",
      },
    ],
    name: "addObligation",
    outputs: [
      {
        internalType: "uint256",
        name: "obligationId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "agentAllowanceRemaining",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "agentRunCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "createdAt",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getActivity",
    outputs: [
      {
        components: [
          {
            internalType: "enum NestTreasuryV2.ActivityKind",
            name: "kind",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "refId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "actor",
            type: "address",
          },
          {
            internalType: "address",
            name: "counterparty",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "memoId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "timestamp",
            type: "uint64",
          },
        ],
        internalType: "struct NestTreasuryV2.ActivityView[]",
        name: "out",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getAgentPolicy",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "executor",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "maxPerRun",
            type: "uint96",
          },
          {
            internalType: "uint96",
            name: "maxPerPeriod",
            type: "uint96",
          },
          {
            internalType: "uint96",
            name: "spentThisPeriod",
            type: "uint96",
          },
          {
            internalType: "uint64",
            name: "periodIndex",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "validUntil",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "lastRunAt",
            type: "uint64",
          },
          {
            internalType: "uint32",
            name: "minInterval",
            type: "uint32",
          },
          {
            internalType: "uint256",
            name: "agentId",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "enabled",
            type: "bool",
          },
        ],
        internalType: "struct NestTreasuryV2.AgentPolicy",
        name: "policy",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "runId",
        type: "uint256",
      },
    ],
    name: "getAgentRun",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "agentId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "executor",
            type: "address",
          },
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "paymentCount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "memoId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
        ],
        internalType: "struct NestTreasuryV2.AgentRun",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalances",
    outputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "int256[]",
        name: "balances",
        type: "int256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getMember",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "string",
            name: "displayName",
            type: "string",
          },
          {
            internalType: "uint64",
            name: "joinedAt",
            type: "uint64",
          },
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "admin",
            type: "bool",
          },
        ],
        internalType: "struct NestTreasuryV2.Member",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMembers",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "string",
            name: "displayName",
            type: "string",
          },
          {
            internalType: "uint64",
            name: "joinedAt",
            type: "uint64",
          },
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "admin",
            type: "bool",
          },
        ],
        internalType: "struct NestTreasuryV2.Member[]",
        name: "out",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "obligationId",
        type: "uint256",
      },
    ],
    name: "getObligation",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "payer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalAmount",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "category",
            type: "string",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "referenceId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
          {
            internalType: "address[]",
            name: "participants",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "shares",
            type: "uint256[]",
          },
        ],
        internalType: "struct NestTreasuryV2.ObligationView",
        name: "view_",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getRecentAgentRuns",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "agentId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "executor",
            type: "address",
          },
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "paymentCount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "memoId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
        ],
        internalType: "struct NestTreasuryV2.AgentRun[]",
        name: "out",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getRecentObligations",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "payer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalAmount",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "category",
            type: "string",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "referenceId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
          {
            internalType: "address[]",
            name: "participants",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "shares",
            type: "uint256[]",
          },
        ],
        internalType: "struct NestTreasuryV2.ObligationView[]",
        name: "out",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getRecentSettlements",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "debtor",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "memoId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
          {
            internalType: "bool",
            name: "executedByAgent",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "agentRunId",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "creditors",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "amounts",
            type: "uint256[]",
          },
        ],
        internalType: "struct NestTreasuryV2.SettlementView[]",
        name: "out",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "settlementId",
        type: "uint256",
      },
    ],
    name: "getSettlement",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "debtor",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "memoId",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
          {
            internalType: "bool",
            name: "executedByAgent",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "agentRunId",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "creditors",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "amounts",
            type: "uint256[]",
          },
        ],
        internalType: "struct NestTreasuryV2.SettlementView",
        name: "view_",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "isMember",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "obligationCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
    ],
    name: "previewSettlement",
    outputs: [
      {
        internalType: "address[]",
        name: "creditors",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "removeMember",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "memoId",
        type: "bytes32",
      },
    ],
    name: "runAgent",
    outputs: [
      {
        internalType: "uint256",
        name: "runId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "settlementId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bool",
        name: "admin",
        type: "bool",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "executor",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
      {
        internalType: "uint96",
        name: "maxPerRun",
        type: "uint96",
      },
      {
        internalType: "uint96",
        name: "maxPerPeriod",
        type: "uint96",
      },
      {
        internalType: "uint32",
        name: "minInterval",
        type: "uint32",
      },
      {
        internalType: "uint64",
        name: "validUntil",
        type: "uint64",
      },
      {
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "setAgentPolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "displayName",
        type: "string",
      },
    ],
    name: "setDisplayName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "setTreasuryName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestedAmount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "memoId",
        type: "bytes32",
      },
    ],
    name: "settleMyBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "settlementId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "settlementCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nextOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasuryName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20Like",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "usdcAllowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const NEST_TREASURY_V2_BYTECODE =
  "0x60c0604052346108c957614f1580380380610019816108ec565b9283398101906060818303126108c95780516001600160a01b03811691908290036108c95760208101516001600160401b0381116108c9578361005d918301610911565b60408201519093906001600160401b0381116108c95761007d9201610911565b90600160055580156108955782518015159081610889575b5015610855576080525f80546001600160a01b0319163317905581516001600160401b03811161055957600154600181811c9116801561084b575b602082101461062457601f81116107e8575b50806020601f8211600114610784575f91610779575b508160011b915f199060031b1c1916176001555b426001600160401b031660a081905290331561074357335f52600760205260ff600260405f20015460401c1661070b5760065460408110156106d757603c8251116106a257335f908152600760205260409020546001600160a01b031615610642575b5060405160a081016001600160401b03811182821017610559576040908152338083526020808401858152848401878152600160608701818152608088018281525f968752600790955295909420955186546001600160a01b0319166001600160a01b0391909116178655905180519195929493830191906001600160401b038211610559578254600181811c91168015610638575b602082101461062457601f81116105df575b50602090601f8311600114610578576002949392915f918361056d575b50508160011b915f199060031b1c19161790555b935193018054915192516001600160501b03199092166001600160401b03949094169390931791151560401b68ff0000000000000000169190911790151560481b69ff000000000000000000161790556102a06108cd565b906001825260208201915f83526040810133815260608201338152608083015f815260a08401905f825260c0850192888452601154680100000000000000008110156105595760018101806011558110156105455760115f52600760205f20910201955194600786101561053157865460ff90961660ff1996909616959095178655965160018681019190915593516002860180546001600160a01b03199081166001600160a01b039384161790915597516003870180549099169116179096559451600484015593516005830155925160069190910180546001600160401b0319166001600160401b039290921691909117905560405133917f1349014908a23af2ddd21ff5ab909e53ad23e02d4046f9e63e42a757337a89f3919081906103c99082610962565b0390a36103d46108cd565b905f825260208201905f825260408301338152606084015f815260808501905f825260a08601925f845260c08701948552601154680100000000000000008110156105595760018101806011558110156105455760115f52600760205f20910201965195600787101561053157875460ff90971660ff19979097169690961787559451600187015593516002860180546001600160a01b03199081166001600160a01b0393841617909155945160038701805490961691161790935591516004840155905160058301555160069190910180546001600160401b0319166001600160401b0392909216919091179055604051339130917f7e896c7378cc33b746306fa69875d41075975a12a1201711285fab1381eef70c9181906104f89082610962565b0390a3604051614588908161098d8239608051818181610d7801528181612612015281816128900152613262015260a05181610c0d0152f35b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52604160045260245ffd5b015190505f80610234565b90601f19831691845f52815f20925f5b8181106105c75750916001939185600298979694106105af575b505050811b019055610248565b01515f1960f88460031b161c191690555f80806105a2565b92936020600181928786015181550195019301610588565b835f5260205f20601f840160051c8101916020851061061a575b601f0160051c01905b81811061060f5750610217565b5f8155600101610602565b90915081906105f9565b634e487b7160e01b5f52602260045260245ffd5b90607f1690610205565b680100000000000000008110156105595760018101806006558110156105455760065f9081527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f9190910180546001600160a01b0319163317905561016f565b60405162461bcd60e51b815260206004820152600d60248201526c6e616d6520746f6f206c6f6e6760981b6044820152606490fd5b60405162461bcd60e51b815260206004820152600c60248201526b1b595b58995c881b1a5b5a5d60a21b6044820152606490fd5b60405162461bcd60e51b815260206004820152601060248201526f30b63932b0b23c90309036b2b6b132b960811b6044820152606490fd5b60405162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b21036b2b6b132b960911b6044820152606490fd5b90508301515f6100f8565b60015f9081528181209250601f198416905b8181106107d0575090836001949392106107b8575b5050811b0160015561010c565b8501515f1960f88460031b161c191690555f806107ab565b9192602060018192868a015181550194019201610796565b60015f527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6601f830160051c81019160208410610841575b601f0160051c01905b81811061083657506100e2565b5f8155600101610829565b9091508190610820565b90607f16906100d0565b60405162461bcd60e51b815260206004820152600c60248201526b696e76616c6964206e616d6560a01b6044820152606490fd5b6050915011155f610095565b60405162461bcd60e51b815260206004820152600c60248201526b696e76616c6964205553444360a01b6044820152606490fd5b5f80fd5b6040519060e082016001600160401b0381118382101761055957604052565b6040519190601f01601f191682016001600160401b0381118382101761055957604052565b81601f820112156108c9578051906001600160401b03821161055957610940601f8301601f19166020016108ec565b92828452602083830101116108c957815f9260208093018386015e8301015290565b602060409281835280519182918282860152018484015e5f828201840152601f01601f191601019056fe60806040526004361015610011575f80fd5b5f3560e01c8062113e081461340857806273d4c3146132f7578063037eca76146132da5780630952e899146132195780630b1ca49a146130c657806315a14fb2146130a95780632ada2596146130055780632d06ca3414612e9b578063381416be146126415780633e413bee146125fd5780634b0bddd21461256b5780634c5823801461253857806353b7acdf1461245a57806356b671441461242f5780635abae4f3146123f85780636b8cd1441461225d57806370a08231146122255780637cc4adad14611d515780638da5cb5b14611d2a57806391e3308514611a9f578063922635d81461189b57806394620ba8146116bc5780639eab52531461155a578063a230c52414611517578063a568f91614611089578063c159dfb214610f78578063ca3fe77714610c31578063cf09e0d014610bee578063d365d6fb14610454578063d5a7f4c5146103ab578063dade4cf91461038e578063e6240deb14610371578063e8f67173146102f0578063ea0e35b1146102d5578063f2fde38b146101e7578063f3baf070146101cd5763ffa1ad74146101ae575f80fd5b346101c9575f3660031901126101c957602060405160028152f35b5f80fd5b346101c9575f3660031901126101c9576020604051818152f35b346101c95760203660031901126101c957610200613627565b5f54906001600160a01b03821690610219338314613bd1565b60018060a01b031691825f52600760205260ff600260405f20015460401c1615610299576001600160a01b03191682175f908155828152600760205260408120600201805460ff60481b191669010000000000000000001790557f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b60405162461bcd60e51b815260206004820152601460248201527337bbb732b91036bab9ba1031329036b2b6b132b960611b6044820152606490fd5b346101c9575f3660031901126101c957602060405160408152f35b346101c95760403660031901126101c95761031561030c613627565b60243590614257565b919061032c6040519260608452606084019061352e565b9282840360208401526020808351958681520192015f945b80861061035957505082935060408301520390f35b90926020806001928651815201940195019490610344565b346101c9575f3660031901126101c9576020601154604051908152f35b346101c9575f3660031901126101c9576020600454604051908152f35b346101c95760203660031901126101c9576103c4613b00565b506004355f52601060205261010060405f206001600160401b036007604051926103ed8461376b565b805484526001810154602085015260018060a01b03600282015416604085015260018060a01b03600382015416606085015260048101546080850152600581015460a0850152600681015460c085015201541660e082015261045260405180926136b4565bf35b346101c95760a03660031901126101c9576004356001600160401b0381116101c957610484903690600401613951565b6024356001600160401b0381116101c9576104a3903690600401613951565b916044356001600160401b0381116101c9576104c3903690600401613924565b9290936064356001600160401b0381116101c9576104e5903690600401613924565b969060843596335f52600760205261050960ff600260405f20015460401c1661408a565b85151580610be3575b80610bda575b15610ba55760288711610b6c5788151580610b61575b15610b2c575f965f995f5b8881106109ae5750908880989796959493926105c29c6105d19c9b1515806109a5575b61056590614155565b335f52600860205261057c60405f20918254614195565b9055610589600254613bc3565b9b8c95866002556001600160401b0342169e8f96604051986105aa8a613787565b8952602089019633885260408a019687523691614054565b92606088019384523691614054565b6080860190815260a086018c815260c087019586525f8e81526009602052604090209651875593516001870180546001600160a01b0319166001600160a01b03929092169190911790559151600286015551805160038601916001600160401b03821161085f5761064c826106468554613718565b85613fea565b602090601f83116001146109425761067b92915f91836108c5575b50508160011b915f199060031b1c19161790565b90555b51805160048501916001600160401b03821161085f576106a2826106468554613718565b602090601f83116001146108d057926106df836001600160401b0397946006979489975f926108c55750508160011b915f199060031b1c19161790565b90555b5160058601555116920191166001600160401b03198254161790555f5b84811061087357505050505060405161071781613787565b6003815260208101848152604082019033825260608301965f8852608084019085825260a0850187815260c08601918252601154600160401b81101561085f5780600161076792016011556140c4565b96909661084c575192600784101561083857865460ff90941660ff19949094169390931786559251600186015592516002850180546001600160a01b03199081166001600160a01b03938416179091559851600386018054909a1691161790975595516004830155945160058201559351600694909401805467ffffffffffffffff19166001600160401b039590951694909417909355604051928352602092339083907fc82405c96e57d3f46021e33c0918c3b5e3986e8e56159b8caad3920dbb4b60fc908690a4604051908152f35b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f525f60045260245ffd5b634e487b7160e01b5f52604160045260245ffd5b600190885f52600a60205261089e60405f20610898610893848a88614119565b614129565b906141b0565b885f52600b6020526108bf60405f206108b8838789614119565b35906141f1565b016106ff565b015190505f80610667565b90601f19831691845f52815f20925f5b81811061092a575093600696936001600160401b03989593600193838b999610610912575b505050811b0190556106e2565b01515f1960f88460031b161c191690555f8080610905565b929360206001819287860151815501950193016108e0565b90601f19831691845f52815f20925f5b81811061098d5750908460019594939210610975575b505050811b01905561067e565b01515f1960f88460031b161c191690558f8080610968565b92936020600181928786015181550195019301610952565b5080151561055c565b6109bc610893828b89614119565b6109c782898b614119565b359060018060a01b03169a8b5f52600760205260ff600260405f20015460401c1615610aee578115610abc57815f8d8a8e5b878410610a4e5750505050610a0d91613bb6565b9a338103610a20575b5050600101610539565b906001929d610a46925f52600860205260405f20610a3f83825461413d565b9055613bb6565b9b908d610a16565b92935090916001600160a01b0391610a6c9161089391869190614119565b1614610a7f5760010182908d8a8e6109f9565b60405162461bcd60e51b8152602060048201526015602482015274191d5c1b1a58d85d19481c185c9d1a58da5c185b9d605a1b6044820152606490fd5b60405162461bcd60e51b815260206004820152600a6024820152697a65726f20736861726560b01b6044820152606490fd5b60405162461bcd60e51b81526020600482015260166024820152757061727469636970616e74206e6f742061637469766560501b6044820152606490fd5b60405162461bcd60e51b815260206004820152600d60248201526c696e76616c6964207469746c6560981b6044820152606490fd5b50607889111561052e565b60405162461bcd60e51b815260206004820152601160248201527063617465676f727920746f6f206c6f6e6760781b6044820152606490fd5b60405162461bcd60e51b815260206004820152600d60248201526c1a5b9d985b1a59081cdc1b1a5d609a1b6044820152606490fd5b50838614610518565b506020861115610512565b346101c9575f3660031901126101c95760206040516001600160401b037f0000000000000000000000000000000000000000000000000000000000000000168152f35b346101c95760403660031901126101c957602435335f526007602052610c6360ff600260405f20015460401c1661408a565b610c71600160055414613b3c565b60026005555f90610c8460043533614257565b9390610c91851515614155565b610c9c600354613bc3565b9485600355600560405191610cb083613787565b878352610d70602084019133835260408501908152606085019089825260808601916001600160401b034216835260a08701915f835260c08801955f87528d5f52600c60205260405f209851895560018060a01b03905116600189019060018060a01b03166001600160601b0360a01b8254161790555160028801555160038701556001600160401b038060048801935116166001600160401b031983541617825551151560ff60401b825491151560401b169060ff60401b1916179055565b519101555f927f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316925b8151851015610f25576001600160a01b03610dbd86846139e9565b5116905f80610dcc88876139e9565b5193338252600860205260408220610de5868254614195565b9055808252600860205260408220610dfe86825461413d565b90558a8252600d602052610e1581604084206141b0565b8a8252600e602052610e2a85604084206141f1565b60405160208101916323b872dd60e01b8352336024830152604482015285606482015260648152610e5c6084826137da565b519082895af13d15610f1e573d610e7281614039565b90610e8060405192836137da565b81523d5f602083013e5b81610ee6575b5015610eaa57600191610ea291613bb6565b940193610da2565b60405162461bcd60e51b81526020600482015260146024820152731554d110c81d1c985b9cd9995c8819985a5b195960621b6044820152606490fd5b8051801592508215610efb575b505089610e90565b81925090602091810103126101c9576020015180151581036101c9578980610ef3565b6060610e8a565b8660409187610f368183338661444b565b83518281525f6020820152837f8eeb8ad1f4621ee5f39f6456bdf8167f56c941bace8ceb63a926200bd02975ca863393a4600160055582519182526020820152f35b346101c95760203660031901126101c957600254600435808210156110845750805b610fa3816139d2565b91610fb160405193846137da565b818352601f19610fc0836139d2565b015f5b81811061106d5750505f5b82811061103c57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061100d57505050500390f35b9193600191939550602061102c8192603f198a8203018652885161389b565b9601920192018594939192610ffe565b8061105161104c60019385613a54565b613ec4565b61105b82876139e9565b5261106681866139e9565b5001610fce565b602090611078613e81565b82828801015201610fc3565b610f9a565b346101c95760e03660031901126101c9576110a2613627565b60243590604435906001600160601b0382168092036101c9576064356001600160601b0381168091036101c9576084359263ffffffff84168094036101c95760a4356001600160401b0381168091036101c95760c43593841515948581036101c957335f52600760205261112260ff600260405f20015460401c1661408a565b611463575b335f52600f60205260405f206001600160401b0362278d00420416926001820154848160c01c145f14611459576001600160601b0360029160601c16925b015460401c6001600160401b03169760405193611181856137a2565b600160a01b6001900316988985526020850195878752604086019089825260608701956001600160601b031686526080870190815260a0870194855260c0870192835260e087019384526101008701958d87526101208801988c8a52335f52600f60205260405f2098600160a01b6001900390600160a01b60019003905116166001600160601b0360a01b8a5416178955518854906001600160601b0360a01b9060a01b1690600160a01b60019003161788556001880192516001600160601b03166001600160601b0319845416178355516001600160601b03166112889083908154906001600160601b0360601b9060601b16906001600160601b0360601b1916179055565b5181546001600160c01b031660c09190911b6001600160c01b0319161790559151600285018054935167ffffffffffffffff60401b60409190911b166001600160401b039092166fffffffffffffffffffffffffffffffff19909416939093171782555181549063ffffffff60801b9060801b169063ffffffff60801b19161790555160038201556004019051151560ff198254169060ff1617905560405161133081613787565b60058152602081018681526040820190338252606083018781526080840185815260a085015f815260c08601916001600160401b0342168352601154600160401b81101561085f5780600161138892016011556140c4565b97909761084c575193600785101561083857875460ff90951660ff19959095169490941787559351600187015593516002860180546001600160a01b03199081166001600160a01b03938416179091559251600387018054909416911617909155905160048401559051600583015551600691909101805467ffffffffffffffff19166001600160401b039290921691909117905560408051938452602084019190915282015233907f45dc9a3e4c7f937b4bbd9c74d50b0b4f66c45f36aebeb79426006157f404893290606090a4005b5060025f92611165565b6001600160a01b038116156114de57821515806114d4575b156114a05781158015611497575b61149290613b79565b611127565b50428211611489565b60405162461bcd60e51b815260206004820152600c60248201526b696e76616c6964206361707360a01b6044820152606490fd5b508284101561147b565b60405162461bcd60e51b8152602060048201526011602482015270195e1958dd5d1bdc881c995c5d5a5c9959607a1b6044820152606490fd5b346101c95760203660031901126101c9576001600160a01b03611538613627565b165f526007602052602060ff600260405f20015460401c166040519015158152f35b346101c9575f3660031901126101c957600654611576816139d2565b9061158460405192836137da565b808252601f19611593826139d2565b015f5b8181106116a55750505f5b81811061160f57826040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106115e057505050500390f35b919360019193955060206115ff8192603f198a82030186528851613661565b96019201920185949391926115d1565b8061161b6001926140ec565b838060a01b0391549060031b1c165f52600760205260405f2060ff60026040519261164584613750565b858060a01b03815416845261165b8682016137fb565b602085015201546001600160401b0381166040840152818160401c161515606084015260481c161515608082015261169382866139e9565b5261169e81856139e9565b50016115a1565b6020906116b0613ad5565b82828701015201611596565b346101c95760203660031901126101c9576116d5613627565b5f6101206040516116e5816137a2565b8281528260208201528260408201528260608201528260808201528260a08201528260c08201528260e082015282610100820152015260018060a01b03165f52600f60205260405f206040519061173b826137a2565b80549060018060a01b0382168352602083019160a01c82526001810154604084016001600160601b0382168152606085016001600160601b038360601c168152608086019260c01c835260028401549260a08701916001600160401b038516835260c08801936001600160401b038660401c16855263ffffffff60e08a019660801c16865260ff60046003890154986101008c01998a52015416976101208a0198151589526001600160401b0362278d00420416806001600160401b0386511603611890575b5060405199600160a01b600190039051168a52516001600160601b031660208a0152516001600160601b03166040890152516001600160601b03166060880152516001600160401b03166080870152516001600160401b031660a0860152516001600160401b031660c08501525163ffffffff1660e08401525161010083015251151561012082015261014090f35b84525f83528a611801565b346101c95760203660031901126101c95760115460043580821015611a995750805b6118c6826139d2565b916118d460405193846137da565b808352601f196118e3826139d2565b015f5b818110611a585750505f1982019182115f5b8281106119a1578460405160208101916020825280518093526020604083019101925f5b8181106119295783830384f35b909184518051600781101561083857826001600160401b0360c060209460e094600197528581015186850152868060a01b036040820151166040850152868060a01b0360608201511660608501526080810151608085015260a081015160a085015201511660c082015201950191019391909361191c565b81611a4457806119bb6119b660019387613a54565b6140c4565b506001600160401b036006604051926119d384613787565b6119e160ff825416856140e0565b858101546020850152858060a01b036002820154166040850152858060a01b03600382015416606085015260048101546080850152600581015460a085015201541660c0820152611a3282886139e9565b52611a3d81876139e9565b50016118f8565b634e487b7160e01b5f52601160045260245ffd5b602090604051611a6781613787565b5f81525f838201525f60408201525f60608201525f60808201525f60a08201525f60c0820152828288010152016118e6565b906118bd565b346101c95760203660031901126101c9576004356001600160401b0381116101c957611acf903690600401613924565b90335f526007602052611aee60ff600260405f20015460401c1661408a565b81151580611d1f575b611b0090613faf565b335f526007602052600160405f20016001600160401b03831161085f57611b3183611b2b8354613718565b83613fea565b5f83601f8111600114611cbc5780611b5d925f91611cb1575b508160011b915f199060031b1c19161790565b90555b60405190611b6d82613787565b6002825260208201915f83526040810133815260608201935f8552608083015f815260a084015f815260c08501906001600160401b0342168252601154600160401b81101561085f57806001611bc692016011556140c4565b96909661084c575192600784101561083857865460ff90941660ff19949094169390931786559251600186015592516002850180546001600160a01b03199081166001600160a01b0393841617909155965160038601805490981691161790955593516004830155925160058201559151600692909201805467ffffffffffffffff19166001600160401b03939093169290921790915560408051602080825281018490527fdd635a4cd84864e37e4479dbfc2ec667acfa473c83c8422a8ac9d9d07599b01c9290918491908301375f604084830101526040813394601f80199101168101030190a2005b905084013586611b4a565b50601f19841690825f528460205f20925f5b818110611d04575010611ceb575b5050600183811b019055611b60565b8301355f19600386901b60f8161c191690558380611cdc565b86840135855560019094019360209384019388935001611cce565b50603c821115611af7565b346101c9575f3660031901126101c9575f546040516001600160a01b039091168152602090f35b346101c95760603660031901126101c957611d6a613627565b6024356001600160401b0381116101c957611d89903690600401613924565b6044358015159392908490036101c957611dc09160018060a01b035f541633148015612207575b611db990613a61565b3691614054565b6001600160a01b039091169081156121d157815f52600760205260ff600260405f20015460401c16612199576040600654101561216557603c815111612130575f828152600760205260409020546001600160a01b0316156120ee575b6001600160401b03421690604051611e3481613750565b83815260208082018381526040808401868152600160608601818152608087018b81525f8b8152600790975293909520955186546001600160a01b0319166001600160a01b0391909116178655925180519195929493830191906001600160401b03821161085f57611eaa826106468554613718565b602090601f831160011461207457611f2694611f4198979694611eef856001600160401b039687966002965f926108c55750508160011b915f199060031b1c19161790565b90555b01955116166001600160401b0319855416178455511515839060ff60401b825491151560401b169060ff60401b1916179055565b51815460ff60481b191690151560481b60ff60481b16179055565b60405190611f4e82613787565b6001825260208201915f835260408101338152606082019386855260808301955f875260a08401905f825260c08501908152601154600160401b81101561085f57806001611f9f92016011556140c4565b95909561084c575191600783101561083857855460ff90931660ff19939093169290921785559151600185015591516002840180546001600160a01b03199081166001600160a01b0393841617909155955160038501805490971691161790945593516004820155925160058401559051600692909201805467ffffffffffffffff19166001600160401b03939093169290921790915560405160208082527f1349014908a23af2ddd21ff5ab909e53ad23e02d4046f9e63e42a757337a89f392829161206f919083019061363d565b0390a3005b90601f19831691845f52815f20925f5b8181106120d65750946001856001600160401b039695600295611f269a958998611f419f9e9d9b106120be575b505050811b019055611ef2565b01515f1960f88460031b161c191690555f80806120b1565b92936020600181928786015181550195019301612084565b600654600160401b81101561085f5780600161210f92016006556006614104565b81546001600160a01b0360039290921b91821b19169084901b179055611e1d565b60405162461bcd60e51b815260206004820152600d60248201526c6e616d6520746f6f206c6f6e6760981b6044820152606490fd5b60405162461bcd60e51b815260206004820152600c60248201526b1b595b58995c881b1a5b5a5d60a21b6044820152606490fd5b60405162461bcd60e51b815260206004820152601060248201526f30b63932b0b23c90309036b2b6b132b960811b6044820152606490fd5b60405162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b21036b2b6b132b960911b6044820152606490fd5b50335f9081526007602052604090206002015460481c60ff16611db0565b346101c95760203660031901126101c9576001600160a01b03612246613627565b165f526008602052602060405f2054604051908152f35b346101c95760203660031901126101c9576004356001600160401b0381116101c95761228d903690600401613924565b6122a160018060a01b035f54163314613bd1565b801515806123ed575b6122b390613faf565b6001600160401b03811161085f576122cc600154613718565b601f811161238a575b505f601f8211600114612312578190612302935f926123075750508160011b915f199060031b1c19161790565b600155005b013590508380610667565b601f198216927fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6915f5b85811061237257508360019510612359575b505050811b01600155005b01355f19600384901b60f8161c1916905582808061234e565b9092602060018192868601358155019401910161233c565b60015f527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6601f830160051c810191602084106123e3575b601f0160051c01905b8181106123d857506122d5565b5f81556001016123cb565b90915081906123c2565b5060508111156122aa565b346101c95760203660031901126101c95761242b612417600435613ec4565b60405191829160208352602083019061389b565b0390f35b346101c95760203660031901126101c957602061245261244d613627565b613d46565b604051908152f35b346101c9575f3660031901126101c9576040515f60015461247a81613718565b808452906001811690811561251457506001146124b6575b61242b836124a2818503826137da565b60405191829160208352602083019061363d565b60015f9081527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6939250905b8082106124fa575090915081016020016124a2612492565b9192600181602092548385880101520191019092916124e2565b60ff191660208086019190915291151560051b840190910191506124a29050612492565b346101c95760203660031901126101c95761242b612557600435613c52565b60405191829160208352602083019061359d565b346101c95760403660031901126101c957612584613627565b60243580151581036101c9576125fb916125a860018060a01b035f54163314613bd1565b6001600160a01b03165f8181526007602052604090819020600201546125d1911c60ff16613a9a565b5f526007602052600260405f20019060ff60481b825491151560481b169060ff60481b1916179055565b005b346101c9575f3660031901126101c9576040517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b346101c95760603660031901126101c95761265a613627565b6024359060443591612670600160055414613b3c565b600260055560018060a01b03821691825f52600760205260ff600260405f20015460401c1615612e6157825f52600f60205260405f209260ff60048501541680612e4e575b15612e1257600284019384546126de6001600160401b0382168015908115612e07575b50613b79565b6001600160401b038160401c168015918215612de9575b505015612db2576001600160401b0362278d0042041695600182019680885460c01c03612d8c575b5086546001600160601b038082169160601c16908181115f14612d7c57036001600160601b038111611a44576001600160601b03905b169480158015612d6f575b15612d695750815460a01c945b808611612d61575b508415612d275761278960049695949654613bc3565b806004556127985f9588614257565b92919390946127a8841515614155565b6127b3600354613bc3565b9a8b6003556001600160401b0342169460058d612888604051936127d685613787565b828552602085018d8152604086019182526060860189815260808701928c845260a08801926001845260c08901968d88525f52600c60205260405f209851895560018060a01b03905116600189019060018060a01b03166001600160601b0360a01b8254161790555160028801555160038701556001600160401b038060048801935116166001600160401b031983541617825551151560ff60401b825491151560401b169060ff60401b1916179055565b519101555f997f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316995b87518c1015612a07578d905f808d8f828f918f908f906128ed916128e58260018060a01b03926139e9565b5116926139e9565b51978383526008602052604083206129068a8254614195565b905581835260086020526040832061291f8a825461413d565b9055808352600d60205261293682604085206141b0565b8252600e60205261294a88604084206141f1565b6040519060208201936323b872dd60e01b8552602483015260448201528760648201526064815261297c6084826137da565b51925af13d15612a00573d61299081614039565b9061299e60405192836137da565b81523d5f602083013e5b816129c8575b5015610eaa576001916129c091613bb6565b9b019a6128ba565b80518015925082156129dd575b50505f6129ae565b81925090602091810103126101c9576020015180151581036101c9575f806129d5565b60606129a8565b96508c9598949750612a1b84888e8961444b565b8385877f8eeb8ad1f4621ee5f39f6456bdf8167f56c941bace8ceb63a926200bd02975ca604080518c815260016020820152a46001600160601b0387166001600160601b03835460601c1601906001600160601b038211611a445782546bffffffffffffffffffffffff60601b191660609290921b6bffffffffffffffffffffffff60601b1691909117909155612ad4908867ffffffffffffffff60401b82549160401b169067ffffffffffffffff60401b1916179055565b835f52600d602052600360405f2054910180546001600160401b036007818b878c8c8b60405198612b048a61376b565b838a5260208a0190815260408a019033825260608b0192835260808b0193845260a08b01948d865260c08c0196875260e08c019788525f52601060205260405f209a518b555160018b015560018060a01b0390511660028a019060018060a01b03166001600160601b0360a01b82541617905560018060a01b03905116600389019060018060a01b03166001600160601b0360a01b8254161790555160048801555160058701555160068601555116920191166001600160401b0319825416179055845f52600c60205286600560405f200155604051612be381613787565b6006815260208101928884526040820192338452606083019287845260808101948a865260a082019688885260c083019d8e52601154600160401b81101561085f57806001612c3592016011556140c4565b93909361084c5751600781101561083857835460ff90911660ff1991909116178355516001830155516002820180546001600160a01b03199081166001600160a01b0393841617909155945160038301805490961691161790935592516004830155925160058201559751600698909801805467ffffffffffffffff19166001600160401b0399909916989098179097559554604080513381526020810187905290810197909752606087810192909252909585907f962416f6cd1bd54616264f4e03756972ba8b4fc72ddfd5fec7a5bd17b691d0a590608090a4600160055560405192835260208301526040820152f35b60405162461bcd60e51b81526020600482015260126024820152711c195c9a5bd90818d85c081c995858da195960721b6044820152606490fd5b945087612773565b9461276b565b50825460a01c811161275e565b50506001600160601b035f612753565b875460c09190911b6001600160c01b0319166001600160601b039091161787558761271d565b60405162461bcd60e51b815260206004820152600f60248201526e636f6f6c646f776e2061637469766560881b6044820152606490fd5b612dfd925060801c63ffffffff1690613bb6565b42101587806126f5565b9050421115896126d8565b60405162461bcd60e51b81526020600482015260146024820152731859d95b9d081b9bdd08185d5d1a1bdc9a5cd95960621b6044820152606490fd5b5083546001600160a01b031633146126b5565b60405162461bcd60e51b81526020600482015260126024820152716163636f756e74206e6f742061637469766560701b6044820152606490fd5b346101c95760203660031901126101c957600480549035808210156130005750805b612ec6816139d2565b91612ed460405193846137da565b818352601f19612ee3836139d2565b015f5b818110612fe95750505f5b828110612f4957836040518091602082016020835281518091526020604084019201905f5b818110612f24575050500390f35b91935091602061010082612f3b60019488516136b4565b019401910191849392612f16565b80612f5660019284613a54565b5f52601060205260405f206001600160401b03600760405192612f788461376b565b80548452858101546020850152858060a01b036002820154166040850152858060a01b03600382015416606085015260048101546080850152600581015460a0850152600681015460c085015201541660e0820152612fd782876139e9565b52612fe281866139e9565b5001612ef1565b602090612ff4613b00565b82828801015201612ee6565b612ebd565b346101c95760203660031901126101c95761301e613627565b613026613ad5565b5060018060a01b03165f52600760205261242b60405f2060ff60026040519261304e84613750565b80546001600160a01b03168452613067600182016137fb565b602085015201546001600160401b0381166040840152818160401c161515606084015260481c1615156080820152604051918291602083526020830190613661565b346101c9575f3660031901126101c9576020600254604051908152f35b346101c95760203660031901126101c9576130df613627565b5f546001600160a01b03169033821480156131fb575b6130fe90613a61565b6001600160a01b03169081146131c057805f52600760205261312c60ff600260405f20015460401c16613a9a565b805f52600860205260405f2054613184575f818152600760205260408120600201805469ffff0000000000000000191690557f6e76fb4c77256006d9c38ec7d82b45a8c8f3c27b1d6766fffc42dfb8de6844929080a2005b60405162461bcd60e51b815260206004820152601460248201527362616c616e6365206d757374206265207a65726f60601b6044820152606490fd5b60405162461bcd60e51b815260206004820152601360248201527231b0b73737ba103932b6b7bb329037bbb732b960691b6044820152606490fd5b50335f9081526007602052604090206002015460481c60ff166130f5565b346101c95760203660031901126101c957613232613627565b604051636eb1769f60e11b81526001600160a01b03918216600482015230602482015290602090829060449082907f0000000000000000000000000000000000000000000000000000000000000000165afa80156132cf575f9061329c575b602090604051908152f35b506020813d6020116132c7575b816132b6602093836137da565b810103126101c95760209051613291565b3d91506132a9565b6040513d5f823e3d90fd5b346101c9575f3660031901126101c9576020600354604051908152f35b346101c95760203660031901126101c957600354600435808210156134035750805b613322816139d2565b9161333060405193846137da565b818352601f1961333f836139d2565b015f5b8181106133ec5750505f5b8281106133bb57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061338c57505050500390f35b919360019193955060206133ab8192603f198a8203018652885161359d565b960192019201859493919261337d565b806133d06133cb60019385613a54565b613c52565b6133da82876139e9565b526133e581866139e9565b500161334d565b6020906133f7613a11565b82828801015201613342565b613319565b346101c9575f3660031901126101c957604051600654808252816020810160065f5260205f20925f5b81811061350c575050613446925003826137da565b805161346a613454826139d2565b9161346260405193846137da565b8083526139d2565b602082019190601f19013683375f5b83518110156134b6576001906001600160a01b0361349782876139e9565b51165f52600860205260405f20546134af82856139e9565b5201613479565b50906134d39291602060405194859460408652604086019061352e565b918483038286015251918281520191905f5b8181106134f3575050500390f35b82518452859450602093840193909201916001016134e5565b84546001600160a01b0316835260019485019486945060209093019201613431565b90602080835192838152019201905f5b81811061354b5750505090565b82516001600160a01b031684526020938401939092019160010161353e565b90602080835192838152019201905f5b8181106135875750505090565b825184526020938401939092019160010161357a565b613624918151815260018060a01b03602083015116602082015260408201516040820152606082015160608201526001600160401b03608083015116608082015260a0820151151560a082015260c082015160c082015261010061361260e084015161012060e085015261012084019061352e565b9201519061010081840391015261356a565b90565b600435906001600160a01b03821682036101c957565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b9060018060a01b03825116815260808061368a602085015160a0602086015260a085019061363d565b936001600160401b0360408201511660408501526060810151151560608501520151151591015290565b6001600160401b0360e08092805185526020810151602086015260018060a01b03604082015116604086015260018060a01b0360608201511660608601526080810151608086015260a081015160a086015260c081015160c0860152015116910152565b90600182811c92168015613746575b602083101461373257565b634e487b7160e01b5f52602260045260245ffd5b91607f1691613727565b60a081019081106001600160401b0382111761085f57604052565b61010081019081106001600160401b0382111761085f57604052565b60e081019081106001600160401b0382111761085f57604052565b61014081019081106001600160401b0382111761085f57604052565b61012081019081106001600160401b0382111761085f57604052565b90601f801991011681019081106001600160401b0382111761085f57604052565b9060405191825f82549261380e84613718565b80845293600181169081156138795750600114613835575b50613833925003836137da565b565b90505f9291925260205f20905f915b81831061385d575050906020613833928201015f613826565b6020919350806001915483858901015201910190918492613844565b90506020925061383394915060ff191682840152151560051b8201015f613826565b613624918151815260018060a01b036020830151166020820152604082015160408201526101006136126138f56138e36060860151610120606087015261012086019061363d565b6080860151858203608087015261363d565b60a085015160a08501526001600160401b0360c08601511660c085015260e085015184820360e086015261352e565b9181601f840112156101c9578235916001600160401b0383116101c957602083818601950101116101c957565b9181601f840112156101c9578235916001600160401b0383116101c9576020808501948460051b0101116101c957565b90604051918281549182825260208201905f5260205f20925f5b8181106139b0575050613833925003836137da565b84546001600160a01b031683526001948501948794506020909301920161399b565b6001600160401b03811161085f5760051b60200190565b80518210156139fd5760209160051b010190565b634e487b7160e01b5f52603260045260245ffd5b60405190613a1e826137be565b6060610100835f81525f60208201525f60408201525f838201525f60808201525f60a08201525f60c08201528260e08201520152565b91908203918211611a4457565b15613a6857565b60405162461bcd60e51b815260206004820152600a60248201526961646d696e206f6e6c7960b01b6044820152606490fd5b15613aa157565b60405162461bcd60e51b815260206004820152600c60248201526b3737ba10309036b2b6b132b960a11b6044820152606490fd5b60405190613ae282613750565b5f608083828152606060208201528260408201528260608201520152565b60405190613b0d8261376b565b5f60e0838281528260208201528260408201528260608201528260808201528260a08201528260c08201520152565b15613b4357565b60405162461bcd60e51b815260206004820152600e60248201526d1c99595b9d1c985b9d0818d85b1b60921b6044820152606490fd5b15613b8057565b60405162461bcd60e51b815260206004820152600e60248201526d1c1bdb1a58de48195e1c1a5c995960921b6044820152606490fd5b91908201809211611a4457565b5f198114611a445760010190565b15613bd857565b60405162461bcd60e51b815260206004820152600a6024820152696f776e6572206f6e6c7960b01b6044820152606490fd5b90604051918281549182825260208201905f5260205f20925f5b818110613c39575050613833925003836137da565b8454835260019485019487945060209093019201613c24565b613c5a613a11565b50805f52600c60205260405f20908154918215613d0c57613cf9613d039260018060a01b036001840154169260ff60028201549160038101546005600483015492015493855f52600d60205260405f20955f52600e60205260405f20976040519a613cc48c6137be565b8b5260208b015260408a015260608901526001600160401b038116608089015260401c16151560a087015260c0860152613981565b60e0840152613c0a565b61010082015290565b60405162461bcd60e51b81526020600482015260126024820152711d5b9adb9bdddb881cd95d1d1b195b595b9d60721b6044820152606490fd5b60018060a01b03165f52600f60205260405f20604051613d65816137a2565b815460018060a01b038116825260a01c602082015260018201549061012060408201936001600160601b038416855260608301936001600160601b038160601c16855260c01c9283608082015260ff600460028401549363ffffffff6001600160401b038616958660a08701526001600160401b038160401c1660c087015260801c1660e0850152600381015461010085015201541615908115938491015291613e65575b50613e5e5762278d0042046001600160401b031603613e4e576001600160601b0380809251165b16915116908082115f14613e485761362491613a54565b50505f90565b506001600160601b03805f613e31565b5050505f90565b801515915081613e77575b505f613e0a565b905042115f613e70565b60405190613e8e826137be565b6060610100835f81525f60208201525f604082015282808201528260808201525f60a08201525f60c08201528260e08201520152565b613ecc613e81565b50805f52600960205260405f20908154918215613f7557613cf9613d039260018060a01b0360018401541692600281015490613f6160046005830154926001600160401b0360068201541694865f52600a60205260405f20965f52600b60205260405f20986040519b613f3e8d6137be565b8c5260208c015260408b0152613f56600382016137fb565b60608b0152016137fb565b608088015260a087015260c0860152613981565b60405162461bcd60e51b81526020600482015260126024820152713ab735b737bbb71037b13634b3b0ba34b7b760711b6044820152606490fd5b15613fb657565b60405162461bcd60e51b815260206004820152600c60248201526b696e76616c6964206e616d6560a01b6044820152606490fd5b601f8211613ff757505050565b5f5260205f20906020601f840160051c8301931061402f575b601f0160051c01905b818110614024575050565b5f8155600101614019565b9091508190614010565b6001600160401b03811161085f57601f01601f191660200190565b92919261406082614039565b9161406e60405193846137da565b8294818452818301116101c9578281602093845f960137010152565b1561409157565b60405162461bcd60e51b815260206004820152600b60248201526a6d656d626572206f6e6c7960a81b6044820152606490fd5b6011548110156139fd5760115f52600760205f20910201905f90565b60078210156108385752565b6006548110156139fd5760065f5260205f2001905f90565b80548210156139fd575f5260205f2001905f90565b91908110156139fd5760051b0190565b356001600160a01b03811681036101c95790565b81810392915f138015828513169184121617611a4457565b1561415c57565b60405162461bcd60e51b81526020600482015260116024820152706e6f7468696e6720746f20736574746c6560781b6044820152606490fd5b9190915f8382019384129112908015821691151617611a4457565b8054600160401b81101561085f576141cd91600182018155614104565b81546001600160a01b0393841660039290921b91821b9390911b1916919091179055565b8054600160401b81101561085f5761420e91600182018155614104565b819291549060031b91821b915f19901b1916179055565b9061422f826139d2565b61423c60405191826137da565b828152809261424d601f19916139d2565b0190602036910137565b6001600160a01b03165f90815260086020526040812054919290918281121561441457600160ff1b8114611a44575f03928015158061440b575b614403575b50905f90835f91600654915b828410806143fa575b1561431c576142b9846140ec565b60018060a01b0391549060031b1c165f52600860205260405f20545f811315614310576142f6614302926142fc928181105f146143095790613a54565b95613bc3565b93613bc3565b92936142a2565b5080613a54565b50939261430290613bc3565b50915092939161433461432e82614225565b91614225565b5f955f935b868510806143f1575b156143e757614350856140ec565b905460039190911b1c6001600160a01b03165f81815260086020526040812054908113156143d9576143a66143b38b6143c595896143ad836143bf988f986143b9998082105f146143cd575097889687956139e9565b528b6139e9565b52613bb6565b98613a54565b98613bc3565b94613bc3565b939694614339565b905097889687956139e9565b50509496936143c590613bc3565b9450925093509350565b50851515614342565b508015156142ab565b92505f614296565b50838110614291565b5091505060209060405161442883826137da565b5f81525f3681376040519261443d81856137da565b5f8452505f36813791905f90565b9091926040519361445b85613787565b6004855260208501928352604085019360018060a01b0316845260608501915f83526080860191825260a0860190815260c08601916001600160401b0342168352601154600160401b81101561085f578060016144bb92016011556140c4565b97909761084c575193600785101561083857875460ff90951660ff19959095169490941787559351600187015593516002860180546001600160a01b03199081166001600160a01b03938416179091559251600387018054909416911617909155905160048401559051600583015551600691909101805467ffffffffffffffff19166001600160401b039290921691909117905556fea26469706673582212206e69ff83c2451bf3beacfc4654367517f4873ee3676f18573e0cbb812069bae664736f6c634300081c0033" as const;
