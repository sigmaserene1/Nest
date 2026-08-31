// AUTO-GENERATED from contracts/NestBusinessV2.sol (solc 0.8.28, optimizer 200 runs).
// Regenerate with: npm run compile:business-v2 -- --emit

export const NEST_BUSINESS_V2_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "usdcAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BatchTooLarge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DuplicateCreditor",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DuplicateParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyBatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidExpense",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSplits",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAMember",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NothingToSettle",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SharesMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TooManyParticipants",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "AgentPolicyRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "validUntil",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxPerRun",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxPerPeriod",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "periodSeconds",
        "type": "uint64"
      }
    ],
    "name": "AgentPolicySet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "AgentSettlement",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "submittedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "counterparties",
        "type": "uint256"
      }
    ],
    "name": "BatchSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Borrowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "BusinessRoomCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "expenseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "payer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ExpenseAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      }
    ],
    "name": "ManagerSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "member",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "MemberInvited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interestPaid",
        "type": "uint256"
      }
    ],
    "name": "Repaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "expenseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "SplitSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Supplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BORROW_APR_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_BATCH_COUNTERPARTIES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_EXPENSE_PARTICIPANTS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_LTV_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "participants",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "shares",
        "type": "uint256[]"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      }
    ],
    "name": "addExpense",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "expenseId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "createBusinessRoom",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "expenseCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "getAgentPolicy",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "uint64",
            "name": "validAfter",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "validUntil",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "periodSeconds",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "periodStartedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "maxPerRun",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPerPeriod",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "spentThisPeriod",
            "type": "uint256"
          }
        ],
        "internalType": "struct NestBusinessV2.AgentPolicy",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getCreditPosition",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "supplied",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "borrowed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "borrowInterest",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "debt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "borrowLimit",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "available",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "poolLiquidity",
            "type": "uint256"
          }
        ],
        "internalType": "struct NestBusinessV2.CreditPosition",
        "name": "position",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "name": "getExpenses",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roomId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "payer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalAmount",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "address[]",
            "name": "participants",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "shares",
            "type": "uint256[]"
          },
          {
            "internalType": "bool[]",
            "name": "settled",
            "type": "bool[]"
          }
        ],
        "internalType": "struct NestBusinessV2.ExpenseView[]",
        "name": "out",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "name": "getRoomMembers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getRooms",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct NestBusinessV2.Room[]",
        "name": "out",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "member",
        "type": "address"
      }
    ],
    "name": "inviteMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isManager",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isMember",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "expenseId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "openShare",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      }
    ],
    "name": "owedBetween",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "revokeAgentPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "roomCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "validAfter",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "validUntil",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "maxPerRun",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxPerPeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "periodSeconds",
        "type": "uint64"
      }
    ],
    "name": "setAgentPolicy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      }
    ],
    "name": "setManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "creditors",
        "type": "address[]"
      }
    ],
    "name": "settleBatch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      }
    ],
    "name": "settleWith",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      }
    ],
    "name": "settleWithFor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "supply",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBorrowed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupplied",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IBusinessUSDC",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const NEST_BUSINESS_V2_BYTECODE =
  "0x60a060405234801561000f575f5ffd5b50604051613a4e380380613a4e83398101604081905261002e91610089565b6001600160a01b0381166100785760405162461bcd60e51b815260206004820152600d60248201526c1554d110c81c995c5d5a5c9959609a1b604482015260640160405180910390fd5b6001600160a01b03166080526100b6565b5f60208284031215610099575f5ffd5b81516001600160a01b03811681146100af575f5ffd5b9392505050565b60805161394161010d5f395f81816102800152818161077e015281816108750152818161097d01528181610b3301528181610f540152818161145701528181611fa6015281816120b10152612e4501526139415ff3fe608060405234801561000f575f5ffd5b50600436106101dc575f3560e01c8063687b3b3211610109578063b65fa7701161009e578063dbbfc3371161006e578063dbbfc337146104a7578063df8a1a0e146104ba578063df93a4e3146104cd578063f4cad18b146104d5575f5ffd5b8063b65fa7701461045b578063c3cd17db1461046e578063c5ebeaec14610481578063d94ee8e014610494575f5ffd5b80637ad9fe51116100d95780637ad9fe51146103e85780637d9e10f5146103fb5780639e6d683014610428578063a504a2b21461043b575f5ffd5b8063687b3b3214610310578063721dbb1514610378578063773ed13c146103985780637a949c62146103d5575f5ffd5b80633c6ae14e1161017f57806352e7df5d1161014f57806352e7df5d146102e35780635a74fc29146102ec578063600e764f146102ff578063630fd0ac14610307575f5ffd5b80633c6ae14e146102735780633e413bee1461027b57806349836982146102ba5780634c19386c146102da575f5ffd5b806326bb9058116101ba57806326bb9058146102185780632e1a7d4d14610238578063354030231461024d578063371fd8e614610260575f5ffd5b80630268e33b146101e05780630f8c9454146101fc5780631bfaae1d1461020f575b5f5ffd5b6101e961032081565b6040519081526020015b60405180910390f35b6101e961020a366004612f56565b6104e8565b6101e961138881565b61022b610226366004612f56565b61058d565b6040516101f39190612f8f565b61024b61024636600461301d565b610676565b005b61024b61025b36600461301d565b61093e565b61024b61026e36600461301d565b610a85565b6101e9602081565b6102a27f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016101f3565b6102cd6102c836600461301d565b610c7b565b6040516101f39190613107565b6101e960035481565b6101e960015481565b61024b6102fa366004613249565b610d3b565b6101e9604081565b6101e960025481565b61032361031e366004613286565b610e75565b6040516101f391905f60e082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c083015292915050565b61038b610386366004613286565b611022565b6040516101f3919061329f565b6103c56103a6366004613333565b600760209081525f928352604080842090915290825290205460ff1681565b60405190151581526020016101f3565b6101e96103e33660046133a4565b611237565b6101e96103f6366004613428565b611593565b6103c5610409366004613333565b600660209081525f928352604080842090915290825290205460ff1681565b61024b610436366004613333565b61178d565b61044e61044936600461301d565b611911565b6040516101f39190613466565b6101e9610469366004612f56565b61197a565b61024b61047c3660046134c7565b611ba2565b61024b61048f36600461301d565b611edd565b6101e96104a2366004613533565b612171565b6101e96104b5366004613333565b612648565b6101e96104c8366004613333565b6126c7565b6101e95f5481565b61024b6104e3366004613333565b612714565b5f838152600d60205260408120815b815481101561058457836001600160a01b031660095f84848154811061051f5761051f613612565b5f91825260208083209091015483528201929092526040019020600201546001600160a01b03160361057c5761056f82828154811061056057610560613612565b905f5260205f20015486612648565b610579908461363a565b92505b6001016104f7565b50509392505050565b60408051610100810182525f80825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e0810191909152505f838152600e602090815260408083206001600160a01b038681168552908352818420908516845282529182902082516101008082018552825460ff8116151583529081046001600160401b0390811694830194909452600160481b8104841694820194909452600160881b9093048216606084015260018101549091166080830152600281015460a0830152600381015460c08301526004015460e08201525b9392505050565b61067f336127df565b335f908152600f60205260409020811580159061069d575080548211155b6106e65760405162461bcd60e51b8152602060048201526015602482015274616d6f756e74206578636565647320737570706c7960581b60448201526064015b60405180910390fd5b80545f906106f590849061364d565b905061070082612887565b61271061070f61138884613660565b6107199190613677565b10156107675760405162461bcd60e51b815260206004820152601960248201527f776f756c642065786365656420637265646974206c696d69740000000000000060448201526064016106dd565b6040516370a0823160e01b815230600482015283907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa1580156107cb573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906107ef9190613696565b101561083d5760405162461bcd60e51b815260206004820152601b60248201527f696e73756666696369656e7420706f6f6c206c6971756964697479000000000060448201526064016106dd565b808255600280548491905f9061085490849061364d565b909155505060405163a9059cbb60e01b8152336004820152602481018490527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af11580156108c3573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906108e791906136ad565b6109035760405162461bcd60e51b81526004016106dd906136c8565b60405183815233907f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5906020015b60405180910390a2505050565b5f811161095d5760405162461bcd60e51b81526004016106dd906136f6565b610966336127df565b6040516323b872dd60e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd906109b69033903090869060040161371f565b6020604051808303815f875af11580156109d2573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906109f691906136ad565b610a125760405162461bcd60e51b81526004016106dd906136c8565b335f908152600f602052604081208054839290610a3090849061363a565b925050819055508060025f828254610a48919061363a565b909155505060405181815233907f6473c9f7da8f23a3d810f05b3e8fb3945f0ad17deadcc09e302cdf5d58e48fe79060200160405180910390a250565b5f8111610aa45760405162461bcd60e51b81526004016106dd906136f6565b610aad336127df565b335f908152600f6020526040812090610ac582612887565b90505f8111610b095760405162461bcd60e51b815260206004820152601060248201526f6e6f7468696e6720746f20726570617960801b60448201526064016106dd565b5f818411610b175783610b19565b815b6040516323b872dd60e01b81529091506001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd90610b6c9033903090869060040161371f565b6020604051808303815f875af1158015610b88573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610bac91906136ad565b610bc85760405162461bcd60e51b81526004016106dd906136c8565b5f83600201548211610bda5781610be0565b83600201545b905080846002015f828254610bf5919061364d565b909155505f9050610c06828461364d565b905080856001015f828254610c1b919061364d565b925050819055508060035f828254610c33919061364d565b9091555050604080518481526020810184905233917f1b8cd61ed43bec7c6bdad3a18ffee613f99c853d16c50678d248d879e1b43438910160405180910390a2505050505050565b5f818152600d602052604090208054606091906001600160401b03811115610ca557610ca5613743565b604051908082528060200260200182016040528015610cde57816020015b610ccb612edb565b815260200190600190039081610cc35790505b5091505f5b8154811015610d3457610d0f828281548110610d0157610d01613612565b905f5260205f20015461289c565b838281518110610d2157610d21613612565b6020908102919091010152600101610ce3565b5050919050565b5f838152600460205260409020600201546001600160a01b03163314610d9a5760405162461bcd60e51b815260206004820152601460248201527337b7363c903bb7b935b9b830b1b29037bbb732b960611b60448201526064016106dd565b5f8381526006602090815260408083206001600160a01b038616845290915290205460ff16610e0b5760405162461bcd60e51b815260206004820152601860248201527f6d616e61676572206d7573742062652061206d656d626572000000000000000060448201526064016106dd565b5f8381526007602090815260408083206001600160a01b03861680855290835292819020805460ff1916851515908117909155905190815285917f32b612ac0dc4b283702ba177590509d0e14f29d40298828ef1cca3028dce7942910160405180910390a3505050565b610eae6040518060e001604052805f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81525090565b6001600160a01b0382165f908152600f6020526040812060018101546003820154919291610eef9190610eea906001600160401b03164261364d565b612c1b565b8260020154610efe919061363a565b90505f818360010154610f11919061363a565b90505f612710611388855f0154610f289190613660565b610f329190613677565b6040516370a0823160e01b81523060048201529091505f906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906370a0823190602401602060405180830381865afa158015610f99573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610fbd9190613696565b90506040518060e00160405280865f0154815260200186600101548152602001858152602001848152602001838152602001848411610ffc575f61100f565b61100f611009868661364d565b84612c69565b8152602001919091529695505050505050565b6001600160a01b0381165f90815260086020908152604080832080548251818502810185019093528083526060949383018282801561107e57602002820191905f5260205f20905b81548152602001906001019080831161106a575b5050505050905080516001600160401b0381111561109e5761109e613743565b60405190808252806020026020018201604052801561110957816020015b6110f660405180608001604052805f8152602001606081526020015f6001600160a01b031681526020015f6001600160401b031681525090565b8152602001906001900390816110bc5790505b5091505f5b8151811015610d345760045f83838151811061112c5761112c613612565b602002602001015181526020019081526020015f206040518060800160405290815f820154815260200160018201805461116590613757565b80601f016020809104026020016040519081016040528092919081815260200182805461119190613757565b80156111dc5780601f106111b3576101008083540402835291602001916111dc565b820191905f5260205f20905b8154815290600101906020018083116111bf57829003601f168201915b5050509183525050600291909101546001600160a01b0381166020830152600160a01b90046001600160401b0316604090910152835184908390811061122457611224613612565b602090810291909101015260010161110e565b5f838152600660209081526040808320338452909152812054849060ff166112715760405162461bcd60e51b81526004016106dd9061378f565b825f8190036112935760405163c2e5347d60e01b815260040160405180910390fd5b60208111156112b5576040516305beb17160e11b815260040160405180910390fd5b5f816001600160401b038111156112ce576112ce613743565b6040519080825280602002602001820160405280156112f7578160200160208202803683370190505b5090505f5b82811015611409575f61131082600161363a565b90505b838110156113a15787878281811061132d5761132d613612565b90506020020160208101906113429190613286565b6001600160a01b031688888481811061135d5761135d613612565b90506020020160208101906113729190613286565b6001600160a01b03160361139957604051638add6a4560e01b815260040160405180910390fd5b600101611313565b505f6113d489338a8a868181106113ba576113ba613612565b90506020020160208101906113cf9190613286565b612c7e565b9050808383815181106113e9576113e9613612565b60209081029190910101526113fe818761363a565b9550506001016112fc565b50835f0361142a57604051630c30209d60e31b815260040160405180910390fd5b5f5b828110156115495781818151811061144657611446613612565b60200260200101515f0315611541577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166323b872dd3389898581811061149757611497613612565b90506020020160208101906114ac9190613286565b8585815181106114be576114be613612565b60200260200101516040518463ffffffff1660e01b81526004016114e49392919061371f565b6020604051808303815f875af1158015611500573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061152491906136ad565b611541576040516312171d8360e31b815260040160405180910390fd5b60010161142c565b506040805185815260208101849052339182918a917fd1fce3afef1b5453c7422f3ebaa3824620161c00d302f4deb21276f603a2fd1d910160405180910390a45050509392505050565b5f81158015906115a4575060508211155b6115e95760405162461bcd60e51b8152602060048201526016602482015275696e76616c696420776f726b7370616365206e616d6560501b60448201526064016106dd565b5f5f81546115f6906137bf565b9190508190559050604051806080016040528082815260200184848080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201829052509385525050336020808501919091526001600160401b034216604094850152858352600481529290912083518155918301516001830191506116829082613823565b50604082810151600290920180546060909401516001600160401b0316600160a01b026001600160e01b03199094166001600160a01b03909316929092179290921790555f8281526006602090815282822033808452908252838320805460ff19908116600190811790925586855260078452858520838652845285852080549091168217905585845260058352848420805480830182559085528385200180546001600160a01b03191683179055818452600883528484208054918201815584529190922001839055905182907f65e38d0a9e4d37351b9d4bcb69a9e67a998dc0be6c866b0d55b62a44e6bfb3d49061177f90879087906138dd565b60405180910390a392915050565b5f828152600760209081526040808320338452909152902054829060ff166117f75760405162461bcd60e51b815260206004820152601760248201527f6e6f74206120776f726b7370616365206d616e6167657200000000000000000060448201526064016106dd565b6001600160a01b0382161580159061183157505f8381526006602090815260408083206001600160a01b038616845290915290205460ff16155b61186e5760405162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b21036b2b6b132b960911b60448201526064016106dd565b5f8381526006602090815260408083206001600160a01b038616808552908352818420805460ff1916600190811790915587855260058452828520805480830182559086528486200180546001600160a01b031916831790558185526008845282852080549182018155855292842090920186905551339286917fd438df2e3c135b20fd0baa49eb4701ac7b0cc03d5936bdd88d3f36779b0b6f169190a4505050565b5f8181526005602090815260409182902080548351818402810184019094528084526060939283018282801561196e57602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311611950575b50505050509050919050565b5f838152600e602090815260408083206001600160a01b038616845282528083203384529091528120805460ff1680156119c35750805461010090046001600160401b03164210155b80156119e057508054600160481b90046001600160401b03164211155b611a235760405162461bcd60e51b81526020600482015260146024820152731859d95b9d081b9bdd08185d5d1a1bdc9a5cd95960621b60448201526064016106dd565b611a2e8585856104e8565b91505f82118015611a43575080600201548211155b611a815760405162461bcd60e51b815260206004820152600f60248201526e06f7574736964652072756e2063617608c1b60448201526064016106dd565b80546001820154611aa5916001600160401b03600160881b9091048116911661363a565b4210611ad05760018101805467ffffffffffffffff1916426001600160401b03161790555f60048201555b8060030154828260040154611ae5919061363a565b1115611b285760405162461bcd60e51b815260206004820152601260248201527106f75747369646520706572696f64206361760741b60448201526064016106dd565b81816004015f828254611b3b919061363a565b90915550611b4c9050858585612e00565b60408051338152602081018390529193506001600160a01b03808616929087169188917f05ccfc718e112895ce2ee45bf4dfb96775448cfbc34521b2cbde0263afca13ae910160405180910390a4509392505050565b5f878152600660209081526040808320338452909152902054879060ff16611bdc5760405162461bcd60e51b81526004016106dd9061378f565b6001600160a01b03871615801590611c055750856001600160401b0316856001600160401b0316115b8015611c19575042856001600160401b0316115b611c565760405162461bcd60e51b815260206004820152600e60248201526d696e76616c696420706f6c69637960901b60448201526064016106dd565b5f84118015611c655750838310155b8015611c7c5750610e10826001600160401b031610155b611cb95760405162461bcd60e51b815260206004820152600e60248201526d696e76616c6964206c696d69747360901b60448201526064016106dd565b604051806101000160405280600115158152602001876001600160401b03168152602001866001600160401b03168152602001836001600160401b03168152602001426001600160401b031681526020018581526020018481526020015f815250600e5f8a81526020019081526020015f205f336001600160a01b03166001600160a01b031681526020019081526020015f205f896001600160a01b03166001600160a01b031681526020019081526020015f205f820151815f015f6101000a81548160ff0219169083151502179055506020820151815f0160016101000a8154816001600160401b0302191690836001600160401b031602179055506040820151815f0160096101000a8154816001600160401b0302191690836001600160401b031602179055506060820151815f0160116101000a8154816001600160401b0302191690836001600160401b031602179055506080820151816001015f6101000a8154816001600160401b0302191690836001600160401b0316021790555060a0820151816002015560c0820151816003015560e08201518160040155905050866001600160a01b0316336001600160a01b0316897fd26b517153e5401584a39fd0ebc8025ca2485645787fa5e5ca4ddde2bf41622e88888888604051611ecb94939291906001600160401b03948516815260208101939093526040830191909152909116606082015260800190565b60405180910390a45050505050505050565b5f8111611efc5760405162461bcd60e51b81526004016106dd906136f6565b611f05336127df565b335f908152600f60205260408120805490919061271090611f299061138890613660565b611f339190613677565b90508083611f4084612887565b611f4a919061363a565b1115611f8f5760405162461bcd60e51b8152602060048201526014602482015273195e18d959591cc818dc99591a5d081b1a5b5a5d60621b60448201526064016106dd565b6040516370a0823160e01b815230600482015283907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015611ff3573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906120179190613696565b10156120655760405162461bcd60e51b815260206004820152601b60248201527f696e73756666696369656e7420706f6f6c206c6971756964697479000000000060448201526064016106dd565b82826001015f828254612078919061363a565b925050819055508260035f828254612090919061363a565b909155505060405163a9059cbb60e01b8152336004820152602481018490527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af11580156120ff573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061212391906136ad565b61213f5760405162461bcd60e51b81526004016106dd906136c8565b60405183815233907fac59582e5396aca512fa873a2047e7f4c80f8f55d4a06cb34a78a0187f62719f90602001610931565b5f8a81526006602090815260408083203384529091528120548b9060ff166121ab5760405162461bcd60e51b81526004016106dd9061378f565b8915806121b85750898814155b156121d6576040516355195b2160e01b815260040160405180910390fd5b60408a11156121f857604051632f0dcef760e21b815260040160405180910390fd5b821580612203575083155b8061220e575060c884115b1561222c57604051637aacbb5760e01b815260040160405180910390fd5b5f5f5b8b811015612371575f8e8152600660205260408120908e8e8481811061225757612257613612565b905060200201602081019061226c9190613286565b6001600160a01b0316815260208101919091526040015f205460ff166122a5576040516305031d1160e31b815260040160405180910390fd5b5f6122b182600161363a565b90505b8c811015612342578d8d828181106122ce576122ce613612565b90506020020160208101906122e39190613286565b6001600160a01b03168e8e848181106122fe576122fe613612565b90506020020160208101906123139190613286565b6001600160a01b03160361233a5760405163fbae880560e01b815260040160405180910390fd5b6001016122b4565b508a8a8281811061235557612355613612565b9050602002013582612367919061363a565b915060010161222f565b5083811461239257604051632bd02d8d60e21b815260040160405180910390fd5b60015f81546123a0906137bf565b91905081905592506040518060e001604052808481526020018e8152602001336001600160a01b0316815260200185815260200189898080601f0160208091040260200160405190810160405280939291908181526020018383808284375f92019190915250505090825250604080516020601f8a01819004810282018101909252888152918101919089908990819084018382808284375f920182905250938552505050426001600160401b031660209283015285815260098252604090819020835181559183015160018301558201516002820180546001600160a01b0319166001600160a01b0390921691909117905560608201516003820155608082015160048201906124b19082613823565b5060a082015160058201906124c69082613823565b5060c091909101516006909101805467ffffffffffffffff19166001600160401b039092169190911790555f5b8b8110156125d6575f8d8d8381811061250e5761250e613612565b90506020020160208101906125239190613286565b5f868152600a602090815260408220805460018101825590835291200180546001600160a01b0319166001600160a01b03831617905590508b8b8381811061256d5761256d613612565b5f888152600b602090815260408083206001600160a01b0388168085529083529220920293909301359055503390036125cd575f858152600c602090815260408083206001600160a01b03851684529091529020805460ff191660011790555b506001016124f3565b505f8d8152600d60209081526040808320805460018101825590845291909220018490555133908e9085907fcce5df0764f156d5d8021e18a302ab652c016fc057e00406d3b63a2e21606029906126309089815260200190565b60405180910390a450509a9950505050505050505050565b5f828152600960209081526040808320600c83528184206001600160a01b038616855290925282205460ff168061268e575060028101546001600160a01b038481169116145b1561269c575f9150506126c1565b50505f828152600b602090815260408083206001600160a01b03851684529091529020545b92915050565b5f828152600660209081526040808320338452909152812054839060ff166127015760405162461bcd60e51b81526004016106dd9061378f565b61270c843385612e00565b949350505050565b5f828152600660209081526040808320338452909152902054829060ff1661274e5760405162461bcd60e51b81526004016106dd9061378f565b5f838152600e60209081526040808320338085529083528184206001600160a01b038716808652935281842080546001600160c81b031916815560018101805467ffffffffffffffff19169055600281018590556003810185905560040184905590519192909186917f64a578708b83cf136b55fec510202c2d9a6ecb53e1ab8b959d00ea81424a583491a4505050565b6001600160a01b0381165f908152600f60205260408120600381015490916001600160401b03909116900361282e57600301805467ffffffffffffffff1916426001600160401b031617905550565b600181015460038201546128509190610eea906001600160401b03164261364d565b816002015f828254612862919061363a565b9091555050600301805467ffffffffffffffff1916426001600160401b031617905550565b5f816002015482600101546126c1919061363a565b6128a4612edb565b5f828152600960209081526040808320600a90925282208054919290916001600160401b038111156128d8576128d8613743565b604051908082528060200260200182016040528015612901578160200160208202803683370190505b5082549091505f906001600160401b0381111561292057612920613743565b604051908082528060200260200182016040528015612949578160200160208202803683370190505b5090505f5b8354811015612a3957600b5f8881526020019081526020015f205f85838154811061297b5761297b613612565b5f9182526020808320909101546001600160a01b0316835282019290925260400190205483518490839081106129b3576129b3613612565b602002602001018181525050600c5f8881526020019081526020015f205f8583815481106129e3576129e3613612565b5f9182526020808320909101546001600160a01b03168352820192909252604001902054825160ff90911690839083908110612a2157612a21613612565b9115156020928302919091019091015260010161294e565b506040805161014081018252855481526001860154602082015260028601546001600160a01b03169181019190915260038501546060820152600485018054608083019190612a8790613757565b80601f0160208091040260200160405190810160405280929190818152602001828054612ab390613757565b8015612afe5780601f10612ad557610100808354040283529160200191612afe565b820191905f5260205f20905b815481529060010190602001808311612ae157829003601f168201915b50505050508152602001856005018054612b1790613757565b80601f0160208091040260200160405190810160405280929190818152602001828054612b4390613757565b8015612b8e5780601f10612b6557610100808354040283529160200191612b8e565b820191905f5260205f20905b815481529060010190602001808311612b7157829003601f168201915b505050918352505060068601546001600160401b031660208083019190915285546040805182840281018401825282815293019291879190830182828015612bfd57602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311612bdf575b50505091835250506020810193909352604090920152949350505050565b5f821580612c27575081155b612c6157612c3b6301e13380612710613660565b82612c4861032086613660565b612c529190613660565b612c5c9190613677565b61066f565b5f9392505050565b5f818310612c77578161066f565b5090919050565b5f8381526006602090815260408083206001600160a01b038616845290915281205460ff161580612cd157505f8481526006602090815260408083206001600160a01b038616845290915290205460ff16155b15612cef576040516305031d1160e31b815260040160405180910390fd5b5f848152600d60205260408120905b8154811015610584575f828281548110612d1a57612d1a613612565b5f91825260208083209091015480835260099091526040909120600201549091506001600160a01b0390811690861614612d545750612df8565b5f612d5f8288612648565b9050805f03612d6f575050612df8565b5f828152600c602090815260408083206001600160a01b038b1684529091529020805460ff19166001179055612da5818661363a565b9450856001600160a01b0316876001600160a01b0316837fec7e547b07e12f0161459deaead5e944ce93fc4b69d368ce3eb438ec830c84e784604051612ded91815260200190565b60405180910390a450505b600101612cfe565b5f612e0c848484612c7e565b9050805f03612e2e57604051630c30209d60e31b815260040160405180910390fd5b6040516323b872dd60e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd90612e7e9086908690869060040161371f565b6020604051808303815f875af1158015612e9a573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612ebe91906136ad565b61066f576040516312171d8360e31b815260040160405180910390fd5b6040518061014001604052805f81526020015f81526020015f6001600160a01b031681526020015f815260200160608152602001606081526020015f6001600160401b031681526020016060815260200160608152602001606081525090565b80356001600160a01b0381168114612f51575f5ffd5b919050565b5f5f5f60608486031215612f68575f5ffd5b83359250612f7860208501612f3b565b9150612f8660408501612f3b565b90509250925092565b5f610100820190508251151582526001600160401b0360208401511660208301526001600160401b0360408401511660408301526060830151612fdd60608401826001600160401b03169052565b506080830151612ff860808401826001600160401b03169052565b5060a083015160a083015260c083015160c083015260e083015160e083015292915050565b5f6020828403121561302d575f5ffd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b5f8151808452602084019350602083015f5b8281101561309b5781516001600160a01b0316865260209586019590910190600101613074565b5093949350505050565b5f8151808452602084019350602083015f5b8281101561309b5781518652602095860195909101906001016130b7565b5f8151808452602084019350602083015f5b8281101561309b57815115158652602095860195909101906001016130e7565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b8281101561322d57603f1987860301845281518051865260208101516020870152604081015161316860408801826001600160a01b03169052565b50606081015160608701526080810151610140608088015261318e610140880182613034565b905060a082015187820360a08901526131a78282613034565b91505060c08201516131c460c08901826001600160401b03169052565b5060e082015187820360e08901526131dc8282613062565b9150506101008201518782036101008901526131f882826130a5565b915050610120820151915086810361012088015261321681836130d5565b96505050602093840193919091019060010161312d565b50929695505050505050565b8015158114613246575f5ffd5b50565b5f5f5f6060848603121561325b575f5ffd5b8335925061326b60208501612f3b565b9150604084013561327b81613239565b809150509250925092565b5f60208284031215613296575f5ffd5b61066f82612f3b565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b8281101561322d57603f198786030184528151805186526020810151608060208801526132f56080880182613034565b6040838101516001600160a01b0316908901526060928301516001600160401b031692909701919091525060209384019391909101906001016132c5565b5f5f60408385031215613344575f5ffd5b8235915061335460208401612f3b565b90509250929050565b5f5f83601f84011261336d575f5ffd5b5081356001600160401b03811115613383575f5ffd5b6020830191508360208260051b850101111561339d575f5ffd5b9250929050565b5f5f5f604084860312156133b6575f5ffd5b8335925060208401356001600160401b038111156133d2575f5ffd5b6133de8682870161335d565b9497909650939450505050565b5f5f83601f8401126133fb575f5ffd5b5081356001600160401b03811115613411575f5ffd5b60208301915083602082850101111561339d575f5ffd5b5f5f60208385031215613439575f5ffd5b82356001600160401b0381111561344e575f5ffd5b61345a858286016133eb565b90969095509350505050565b602080825282518282018190525f918401906040840190835b818110156134a65783516001600160a01b031683526020938401939092019160010161347f565b509095945050505050565b80356001600160401b0381168114612f51575f5ffd5b5f5f5f5f5f5f5f60e0888a0312156134dd575f5ffd5b873596506134ed60208901612f3b565b95506134fb604089016134b1565b9450613509606089016134b1565b93506080880135925060a0880135915061352560c089016134b1565b905092959891949750929550565b5f5f5f5f5f5f5f5f5f5f60c08b8d03121561354c575f5ffd5b8a35995060208b01356001600160401b03811115613568575f5ffd5b6135748d828e0161335d565b909a5098505060408b01356001600160401b03811115613592575f5ffd5b61359e8d828e0161335d565b90985096505060608b01356001600160401b038111156135bc575f5ffd5b6135c88d828e016133eb565b90965094505060808b01356001600160401b038111156135e6575f5ffd5b6135f28d828e016133eb565b9b9e9a9d50989b979a96999598949794969560a090950135949350505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b808201808211156126c1576126c1613626565b818103818111156126c1576126c1613626565b80820281158282048414176126c1576126c1613626565b5f8261369157634e487b7160e01b5f52601260045260245ffd5b500490565b5f602082840312156136a6575f5ffd5b5051919050565b5f602082840312156136bd575f5ffd5b815161066f81613239565b6020808252601490820152731554d110c81d1c985b9cd9995c8819985a5b195960621b604082015260600190565b6020808252600f908201526e185b5bdd5b9d081c995c5d5a5c9959608a1b604082015260600190565b6001600160a01b039384168152919092166020820152604081019190915260600190565b634e487b7160e01b5f52604160045260245ffd5b600181811c9082168061376b57607f821691505b60208210810361378957634e487b7160e01b5f52602260045260245ffd5b50919050565b6020808252601690820152753737ba1030903bb7b935b9b830b1b29036b2b6b132b960511b604082015260600190565b5f600182016137d0576137d0613626565b5060010190565b601f82111561381e57805f5260205f20601f840160051c810160208510156137fc5750805b601f840160051c820191505b8181101561381b575f8155600101613808565b50505b505050565b81516001600160401b0381111561383c5761383c613743565b6138508161384a8454613757565b846137d7565b6020601f821160018114613882575f831561386b5750848201515b5f19600385901b1c1916600184901b17845561381b565b5f84815260208120601f198516915b828110156138b15787850151825560209485019460019092019101613891565b50848210156138ce57868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b60208152816020820152818360408301375f818301604090810191909152601f909201601f1916010191905056fea2646970667358221220e5e2db073880295e88bc188937b85f3a9d370cc8b26452cd890a3d69441bc06964736f6c634300081c0033" as const;
