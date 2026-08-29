// AUTO-GENERATED from contracts/NestBusinessV2.sol (solc 0.8.28, optimizer 200 runs).

export const NEST_BUSINESS_V2_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "usdcAddress",
        type: "address",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "agent",
        type: "address",
      },
    ],
    name: "AgentPolicyRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "agent",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "validUntil",
        type: "uint64",
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
      {
        indexed: false,
        internalType: "uint64",
        name: "periodSeconds",
        type: "uint64",
      },
    ],
    name: "AgentPolicySet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creditor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "agent",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "AgentSettlement",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Borrowed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
    ],
    name: "BusinessRoomCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
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
    ],
    name: "ExpenseAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "manager",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "ManagerSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "member",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "MemberInvited",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "interestPaid",
        type: "uint256",
      },
    ],
    name: "Repaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "SplitSettled",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Supplied",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "BORROW_APR_BPS",
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
    name: "MAX_LTV_BPS",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
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
      {
        internalType: "string",
        name: "category",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
    ],
    name: "addExpense",
    outputs: [
      {
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "borrow",
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
    name: "createBusinessRoom",
    outputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "expenseCount",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "agent",
        type: "address",
      },
    ],
    name: "getAgentPolicy",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
          {
            internalType: "uint64",
            name: "validAfter",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "validUntil",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "periodSeconds",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "periodStartedAt",
            type: "uint64",
          },
          {
            internalType: "uint256",
            name: "maxPerRun",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPerPeriod",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "spentThisPeriod",
            type: "uint256",
          },
        ],
        internalType: "struct NestBusinessV2.AgentPolicy",
        name: "",
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
    name: "getCreditPosition",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "supplied",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "borrowed",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "borrowInterest",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "debt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "borrowLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "available",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "poolLiquidity",
            type: "uint256",
          },
        ],
        internalType: "struct NestBusinessV2.CreditPosition",
        name: "position",
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
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "getExpenses",
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
            name: "roomId",
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
            name: "description",
            type: "string",
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
          {
            internalType: "bool[]",
            name: "settled",
            type: "bool[]",
          },
        ],
        internalType: "struct NestBusinessV2.ExpenseView[]",
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
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "getRoomMembers",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getRooms",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
        ],
        internalType: "struct NestBusinessV2.Room[]",
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
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "member",
        type: "address",
      },
    ],
    name: "inviteMember",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isManager",
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
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
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
    inputs: [
      {
        internalType: "uint256",
        name: "expenseId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "openShare",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        internalType: "address",
        name: "creditor",
        type: "address",
      },
    ],
    name: "owedBetween",
    outputs: [
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "agent",
        type: "address",
      },
    ],
    name: "revokeAgentPolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "roomCount",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "agent",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "validAfter",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "validUntil",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "maxPerRun",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxPerPeriod",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "periodSeconds",
        type: "uint64",
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "manager",
        type: "address",
      },
      {
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "creditor",
        type: "address",
      },
    ],
    name: "settleWith",
    outputs: [
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
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "debtor",
        type: "address",
      },
      {
        internalType: "address",
        name: "creditor",
        type: "address",
      },
    ],
    name: "settleWithFor",
    outputs: [
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBorrowed",
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
    name: "totalSupplied",
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
    name: "usdc",
    outputs: [
      {
        internalType: "contract IBusinessUSDC",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const NEST_BUSINESS_V2_BYTECODE =
  "0x60a060405234801561000f575f5ffd5b5060405161365f38038061365f83398101604081905261002e91610089565b6001600160a01b0381166100785760405162461bcd60e51b815260206004820152600d60248201526c1554d110c81c995c5d5a5c9959609a1b604482015260640160405180910390fd5b6001600160a01b03166080526100b6565b5f60208284031215610099575f5ffd5b81516001600160a01b03811681146100af575f5ffd5b9392505050565b6080516135596101065f395f8181610339015281816107330152818161082a0152818161093d01528181610af701528181610f1101528181611c0701528181611d1201526129fb01526135595ff3fe608060405234801561000f575f5ffd5b50600436106101bb575f3560e01c8063721dbb15116100f3578063c3cd17db11610093578063dbbfc3371161006e578063dbbfc33714610545578063df8a1a0e14610558578063df93a4e31461056b578063f4cad18b14610573575f5ffd5b8063c3cd17db1461050c578063c5ebeaec1461051f578063d94ee8e014610532575f5ffd5b80637d9e10f5116100ce5780637d9e10f5146104995780639e6d6830146104c6578063a504a2b2146104d9578063b65fa770146104f9575f5ffd5b8063721dbb1514610429578063773ed13c146104495780637ad9fe5114610486575f5ffd5b80633e413bee1161015e57806352e7df5d1161013957806352e7df5d1461039c5780635a74fc29146103a5578063630fd0ac146103b8578063687b3b32146103c1575f5ffd5b80633e413bee1461033457806349836982146103735780634c19386c14610393575f5ffd5b806326bb90581161019957806326bb9058146101f75780632e1a7d4d146102f9578063354030231461030e578063371fd8e614610321575f5ffd5b80630268e33b146101bf5780630f8c9454146101db5780631bfaae1d146101ee575b5f5ffd5b6101c861032081565b6040519081526020015b60405180910390f35b6101c86101e9366004612bd9565b610586565b6101c861138881565b6102ec610205366004612bd9565b60408051610100810182525f80825260208201819052918101829052606081018290526080810182905260a0810182905260c0810182905260e0810191909152505f928352600e602090815260408085206001600160a01b03948516865282528085209290931684529081529181902081516101008082018452825460ff8116151583529081046001600160401b0390811695830195909552600160481b8104851693820193909352600160881b9092048316606083015260018101549092166080820152600282015460a0820152600382015460c082015260049091015460e082015290565b6040516101d29190612c12565b61030c610307366004612ca0565b61062b565b005b61030c61031c366004612ca0565b6108f3565b61030c61032f366004612ca0565b610a3e565b61035b7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016101d2565b610386610381366004612ca0565b610c38565b6040516101d29190612d8a565b6101c860035481565b6101c860015481565b61030c6103b3366004612ecc565b610cf8565b6101c860025481565b6103d46103cf366004612f09565b610e32565b6040516101d291905f60e082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c083015292915050565b61043c610437366004612f09565b610fdf565b6040516101d29190612f22565b610476610457366004612fb6565b600760209081525f928352604080842090915290825290205460ff1681565b60405190151581526020016101d2565b6101c8610494366004613024565b6111f4565b6104766104a7366004612fb6565b600660209081525f928352604080842090915290825290205460ff1681565b61030c6104d4366004612fb6565b6113ee565b6104ec6104e7366004612ca0565b611572565b6040516101d29190613062565b6101c8610507366004612bd9565b6115db565b61030c61051a3660046130c3565b611803565b61030c61052d366004612ca0565b611b3e565b6101c861054036600461316f565b611dd2565b6101c8610553366004612fb6565b61227f565b6101c8610566366004612fb6565b6122fe565b6101c85f5481565b61030c610581366004612fb6565b61234b565b5f838152600d60205260408120815b815481101561062257836001600160a01b031660095f8484815481106105bd576105bd61324e565b5f91825260208083209091015483528201929092526040019020600201546001600160a01b03160361061a5761060d8282815481106105fe576105fe61324e565b905f5260205f2001548661227f565b6106179084613276565b92505b600101610595565b50509392505050565b61063433612416565b335f908152600f602052604090208115801590610652575080548211155b61069b5760405162461bcd60e51b8152602060048201526015602482015274616d6f756e74206578636565647320737570706c7960581b60448201526064015b60405180910390fd5b80545f906106aa908490613289565b90506106b5826124be565b6127106106c46113888461329c565b6106ce91906132b3565b101561071c5760405162461bcd60e51b815260206004820152601960248201527f776f756c642065786365656420637265646974206c696d6974000000000000006044820152606401610692565b6040516370a0823160e01b815230600482015283907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610780573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906107a491906132d2565b10156107f25760405162461bcd60e51b815260206004820152601b60248201527f696e73756666696369656e7420706f6f6c206c697175696469747900000000006044820152606401610692565b808255600280548491905f90610809908490613289565b909155505060405163a9059cbb60e01b8152336004820152602481018490527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610878573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061089c91906132e9565b6108b85760405162461bcd60e51b815260040161069290613304565b60405183815233907f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5906020015b60405180910390a2505050565b5f81116109125760405162461bcd60e51b815260040161069290613332565b61091b33612416565b6040516323b872dd60e01b8152336004820152306024820152604481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303815f875af115801561098b573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906109af91906132e9565b6109cb5760405162461bcd60e51b815260040161069290613304565b335f908152600f6020526040812080548392906109e9908490613276565b925050819055508060025f828254610a019190613276565b909155505060405181815233907f6473c9f7da8f23a3d810f05b3e8fb3945f0ad17deadcc09e302cdf5d58e48fe79060200160405180910390a250565b5f8111610a5d5760405162461bcd60e51b815260040161069290613332565b610a6633612416565b335f908152600f6020526040812090610a7e826124be565b90505f8111610ac25760405162461bcd60e51b815260206004820152601060248201526f6e6f7468696e6720746f20726570617960801b6044820152606401610692565b5f818411610ad05783610ad2565b815b6040516323b872dd60e01b8152336004820152306024820152604481018290529091507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303815f875af1158015610b45573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610b6991906132e9565b610b855760405162461bcd60e51b815260040161069290613304565b5f83600201548211610b975781610b9d565b83600201545b905080846002015f828254610bb29190613289565b909155505f9050610bc38284613289565b905080856001015f828254610bd89190613289565b925050819055508060035f828254610bf09190613289565b9091555050604080518481526020810184905233917f1b8cd61ed43bec7c6bdad3a18ffee613f99c853d16c50678d248d879e1b43438910160405180910390a2505050505050565b5f818152600d602052604090208054606091906001600160401b03811115610c6257610c6261335b565b604051908082528060200260200182016040528015610c9b57816020015b610c88612b5e565b815260200190600190039081610c805790505b5091505f5b8154811015610cf157610ccc828281548110610cbe57610cbe61324e565b905f5260205f2001546124d3565b838281518110610cde57610cde61324e565b6020908102919091010152600101610ca0565b5050919050565b5f838152600460205260409020600201546001600160a01b03163314610d575760405162461bcd60e51b815260206004820152601460248201527337b7363c903bb7b935b9b830b1b29037bbb732b960611b6044820152606401610692565b5f8381526006602090815260408083206001600160a01b038616845290915290205460ff16610dc85760405162461bcd60e51b815260206004820152601860248201527f6d616e61676572206d7573742062652061206d656d62657200000000000000006044820152606401610692565b5f8381526007602090815260408083206001600160a01b03861680855290835292819020805460ff1916851515908117909155905190815285917f32b612ac0dc4b283702ba177590509d0e14f29d40298828ef1cca3028dce7942910160405180910390a3505050565b610e6b6040518060e001604052805f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81525090565b6001600160a01b0382165f908152600f6020526040812060018101546003820154919291610eac9190610ea7906001600160401b031642613289565b612852565b8260020154610ebb9190613276565b90505f818360010154610ece9190613276565b90505f612710611388855f0154610ee5919061329c565b610eef91906132b3565b6040516370a0823160e01b81523060048201529091505f906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906370a0823190602401602060405180830381865afa158015610f56573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610f7a91906132d2565b90506040518060e00160405280865f0154815260200186600101548152602001858152602001848152602001838152602001848411610fb9575f610fcc565b610fcc610fc68686613289565b846128a1565b8152602001919091529695505050505050565b6001600160a01b0381165f90815260086020908152604080832080548251818502810185019093528083526060949383018282801561103b57602002820191905f5260205f20905b815481526020019060010190808311611027575b5050505050905080516001600160401b0381111561105b5761105b61335b565b6040519080825280602002602001820160405280156110c657816020015b6110b360405180608001604052805f8152602001606081526020015f6001600160a01b031681526020015f6001600160401b031681525090565b8152602001906001900390816110795790505b5091505f5b8151811015610cf15760045f8383815181106110e9576110e961324e565b602002602001015181526020019081526020015f206040518060800160405290815f82015481526020016001820180546111229061336f565b80601f016020809104026020016040519081016040528092919081815260200182805461114e9061336f565b80156111995780601f1061117057610100808354040283529160200191611199565b820191905f5260205f20905b81548152906001019060200180831161117c57829003601f168201915b5050509183525050600291909101546001600160a01b0381166020830152600160a01b90046001600160401b031660409091015283518490839081106111e1576111e161324e565b60209081029190910101526001016110cb565b5f8115801590611205575060508211155b61124a5760405162461bcd60e51b8152602060048201526016602482015275696e76616c696420776f726b7370616365206e616d6560501b6044820152606401610692565b5f5f8154611257906133a7565b9190508190559050604051806080016040528082815260200184848080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201829052509385525050336020808501919091526001600160401b034216604094850152858352600481529290912083518155918301516001830191506112e3908261340b565b50604082810151600290920180546060909401516001600160401b0316600160a01b026001600160e01b03199094166001600160a01b03909316929092179290921790555f8281526006602090815282822033808452908252838320805460ff19908116600190811790925586855260078452858520838652845285852080549091168217905585845260058352848420805480830182559085528385200180546001600160a01b03191683179055818452600883528484208054918201815584529190922001839055905182907f65e38d0a9e4d37351b9d4bcb69a9e67a998dc0be6c866b0d55b62a44e6bfb3d4906113e090879087906134c5565b60405180910390a392915050565b5f828152600760209081526040808320338452909152902054829060ff166114585760405162461bcd60e51b815260206004820152601760248201527f6e6f74206120776f726b7370616365206d616e616765720000000000000000006044820152606401610692565b6001600160a01b0382161580159061149257505f8381526006602090815260408083206001600160a01b038616845290915290205460ff16155b6114cf5760405162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b21036b2b6b132b960911b6044820152606401610692565b5f8381526006602090815260408083206001600160a01b038616808552908352818420805460ff1916600190811790915587855260058452828520805480830182559086528486200180546001600160a01b031916831790558185526008845282852080549182018155855292842090920186905551339286917fd438df2e3c135b20fd0baa49eb4701ac7b0cc03d5936bdd88d3f36779b0b6f169190a4505050565b5f818152600560209081526040918290208054835181840281018401909452808452606093928301828280156115cf57602002820191905f5260205f20905b81546001600160a01b031681526001909101906020018083116115b1575b50505050509050919050565b5f838152600e602090815260408083206001600160a01b038616845282528083203384529091528120805460ff1680156116245750805461010090046001600160401b03164210155b801561164157508054600160481b90046001600160401b03164211155b6116845760405162461bcd60e51b81526020600482015260146024820152731859d95b9d081b9bdd08185d5d1a1bdc9a5cd95960621b6044820152606401610692565b61168f858585610586565b91505f821180156116a4575080600201548211155b6116e25760405162461bcd60e51b815260206004820152600f60248201526e06f7574736964652072756e2063617608c1b6044820152606401610692565b80546001820154611706916001600160401b03600160881b90910481169116613276565b42106117315760018101805467ffffffffffffffff1916426001600160401b03161790555f60048201555b80600301548282600401546117469190613276565b11156117895760405162461bcd60e51b815260206004820152601260248201527106f75747369646520706572696f64206361760741b6044820152606401610692565b81816004015f82825461179c9190613276565b909155506117ad90508585856128b6565b60408051338152602081018390529193506001600160a01b03808616929087169188917f05ccfc718e112895ce2ee45bf4dfb96775448cfbc34521b2cbde0263afca13ae910160405180910390a4509392505050565b5f878152600660209081526040808320338452909152902054879060ff1661183d5760405162461bcd60e51b8152600401610692906134f3565b6001600160a01b038716158015906118665750856001600160401b0316856001600160401b0316115b801561187a575042856001600160401b0316115b6118b75760405162461bcd60e51b815260206004820152600e60248201526d696e76616c696420706f6c69637960901b6044820152606401610692565b5f841180156118c65750838310155b80156118dd5750610e10826001600160401b031610155b61191a5760405162461bcd60e51b815260206004820152600e60248201526d696e76616c6964206c696d69747360901b6044820152606401610692565b604051806101000160405280600115158152602001876001600160401b03168152602001866001600160401b03168152602001836001600160401b03168152602001426001600160401b031681526020018581526020018481526020015f815250600e5f8a81526020019081526020015f205f336001600160a01b03166001600160a01b031681526020019081526020015f205f896001600160a01b03166001600160a01b031681526020019081526020015f205f820151815f015f6101000a81548160ff0219169083151502179055506020820151815f0160016101000a8154816001600160401b0302191690836001600160401b031602179055506040820151815f0160096101000a8154816001600160401b0302191690836001600160401b031602179055506060820151815f0160116101000a8154816001600160401b0302191690836001600160401b031602179055506080820151816001015f6101000a8154816001600160401b0302191690836001600160401b0316021790555060a0820151816002015560c0820151816003015560e08201518160040155905050866001600160a01b0316336001600160a01b0316897fd26b517153e5401584a39fd0ebc8025ca2485645787fa5e5ca4ddde2bf41622e88888888604051611b2c94939291906001600160401b03948516815260208101939093526040830191909152909116606082015260800190565b60405180910390a45050505050505050565b5f8111611b5d5760405162461bcd60e51b815260040161069290613332565b611b6633612416565b335f908152600f60205260408120805490919061271090611b8a906113889061329c565b611b9491906132b3565b90508083611ba1846124be565b611bab9190613276565b1115611bf05760405162461bcd60e51b8152602060048201526014602482015273195e18d959591cc818dc99591a5d081b1a5b5a5d60621b6044820152606401610692565b6040516370a0823160e01b815230600482015283907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015611c54573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611c7891906132d2565b1015611cc65760405162461bcd60e51b815260206004820152601b60248201527f696e73756666696369656e7420706f6f6c206c697175696469747900000000006044820152606401610692565b82826001015f828254611cd99190613276565b925050819055508260035f828254611cf19190613276565b909155505060405163a9059cbb60e01b8152336004820152602481018490527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015611d60573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611d8491906132e9565b611da05760405162461bcd60e51b815260040161069290613304565b60405183815233907fac59582e5396aca512fa873a2047e7f4c80f8f55d4a06cb34a78a0187f62719f906020016108e6565b5f8a81526006602090815260408083203384529091528120548b9060ff16611e0c5760405162461bcd60e51b8152600401610692906134f3565b8915801590611e1a57508988145b611e575760405162461bcd60e51b815260206004820152600e60248201526d696e76616c69642073706c69747360901b6044820152606401610692565b5f83118015611e6557508315155b611ea35760405162461bcd60e51b815260206004820152600f60248201526e696e76616c696420657870656e736560881b6044820152606401610692565b5f5f5b8b811015611f79575f8e8152600660205260408120908e8e84818110611ece57611ece61324e565b9050602002016020810190611ee39190612f09565b6001600160a01b0316815260208101919091526040015f205460ff16611f4b5760405162461bcd60e51b815260206004820152601860248201527f7061727469636970616e74206e6f742061206d656d62657200000000000000006044820152606401610692565b8a8a82818110611f5d57611f5d61324e565b9050602002013582611f6f9190613276565b9150600101611ea6565b50838114611fc95760405162461bcd60e51b815260206004820152601760248201527f736861726573206d75737420657175616c20746f74616c0000000000000000006044820152606401610692565b60015f8154611fd7906133a7565b91905081905592506040518060e001604052808481526020018e8152602001336001600160a01b0316815260200185815260200189898080601f0160208091040260200160405190810160405280939291908181526020018383808284375f92019190915250505090825250604080516020601f8a01819004810282018101909252888152918101919089908990819084018382808284375f920182905250938552505050426001600160401b031660209283015285815260098252604090819020835181559183015160018301558201516002820180546001600160a01b0319166001600160a01b0390921691909117905560608201516003820155608082015160048201906120e8908261340b565b5060a082015160058201906120fd908261340b565b5060c091909101516006909101805467ffffffffffffffff19166001600160401b039092169190911790555f5b8b81101561220d575f8d8d838181106121455761214561324e565b905060200201602081019061215a9190612f09565b5f868152600a602090815260408220805460018101825590835291200180546001600160a01b0319166001600160a01b03831617905590508b8b838181106121a4576121a461324e565b5f888152600b602090815260408083206001600160a01b038816808552908352922092029390930135905550339003612204575f858152600c602090815260408083206001600160a01b03851684529091529020805460ff191660011790555b5060010161212a565b505f8d8152600d60209081526040808320805460018101825590845291909220018490555133908e9085907fcce5df0764f156d5d8021e18a302ab652c016fc057e00406d3b63a2e21606029906122679089815260200190565b60405180910390a450509a9950505050505050505050565b5f828152600960209081526040808320600c83528184206001600160a01b038616855290925282205460ff16806122c5575060028101546001600160a01b038481169116145b156122d3575f9150506122f8565b50505f828152600b602090815260408083206001600160a01b03851684529091529020545b92915050565b5f828152600660209081526040808320338452909152812054839060ff166123385760405162461bcd60e51b8152600401610692906134f3565b6123438433856128b6565b949350505050565b5f828152600660209081526040808320338452909152902054829060ff166123855760405162461bcd60e51b8152600401610692906134f3565b5f838152600e60209081526040808320338085529083528184206001600160a01b038716808652935281842080546001600160c81b031916815560018101805467ffffffffffffffff19169055600281018590556003810185905560040184905590519192909186917f64a578708b83cf136b55fec510202c2d9a6ecb53e1ab8b959d00ea81424a583491a4505050565b6001600160a01b0381165f908152600f60205260408120600381015490916001600160401b03909116900361246557600301805467ffffffffffffffff1916426001600160401b031617905550565b600181015460038201546124879190610ea7906001600160401b031642613289565b816002015f8282546124999190613276565b9091555050600301805467ffffffffffffffff1916426001600160401b031617905550565b5f816002015482600101546122f89190613276565b6124db612b5e565b5f828152600960209081526040808320600a90925282208054919290916001600160401b0381111561250f5761250f61335b565b604051908082528060200260200182016040528015612538578160200160208202803683370190505b5082549091505f906001600160401b038111156125575761255761335b565b604051908082528060200260200182016040528015612580578160200160208202803683370190505b5090505f5b835481101561267057600b5f8881526020019081526020015f205f8583815481106125b2576125b261324e565b5f9182526020808320909101546001600160a01b0316835282019290925260400190205483518490839081106125ea576125ea61324e565b602002602001018181525050600c5f8881526020019081526020015f205f85838154811061261a5761261a61324e565b5f9182526020808320909101546001600160a01b03168352820192909252604001902054825160ff909116908390839081106126585761265861324e565b91151560209283029190910190910152600101612585565b506040805161014081018252855481526001860154602082015260028601546001600160a01b031691810191909152600385015460608201526004850180546080830191906126be9061336f565b80601f01602080910402602001604051908101604052809291908181526020018280546126ea9061336f565b80156127355780601f1061270c57610100808354040283529160200191612735565b820191905f5260205f20905b81548152906001019060200180831161271857829003601f168201915b5050505050815260200185600501805461274e9061336f565b80601f016020809104026020016040519081016040528092919081815260200182805461277a9061336f565b80156127c55780601f1061279c576101008083540402835291602001916127c5565b820191905f5260205f20905b8154815290600101906020018083116127a857829003601f168201915b505050918352505060068601546001600160401b03166020808301919091528554604080518284028101840182528281529301929187919083018282801561283457602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311612816575b50505091835250506020810193909352604090920152949350505050565b5f82158061285e575081155b612898576128726301e1338061271061329c565b8261287f6103208661329c565b612889919061329c565b61289391906132b3565b61289a565b5f5b9392505050565b5f8183106128af578161289a565b5090919050565b5f8381526006602090815260408083206001600160a01b038616845290915281205460ff16801561290857505f8481526006602090815260408083206001600160a01b038616845290915290205460ff165b61294d5760405162461bcd60e51b8152602060048201526016602482015275696e76616c696420636f756e7465727061727469657360501b6044820152606401610692565b5f848152600d60205260408120905b8154811015612b12575f8282815481106129785761297861324e565b5f91825260208083209091015480835260099091526040909120600201549091506001600160a01b03908116908616146129b25750612b0a565b5f6129bd828861227f565b9050805f036129cd575050612b0a565b6040516323b872dd60e01b81526001600160a01b0388811660048301528781166024830152604482018390527f000000000000000000000000000000000000000000000000000000000000000016906323b872dd906064016020604051808303815f875af1158015612a41573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612a6591906132e9565b612a815760405162461bcd60e51b815260040161069290613304565b5f828152600c602090815260408083206001600160a01b038b1684529091529020805460ff19166001179055612ab78186613276565b9450856001600160a01b0316876001600160a01b0316837fec7e547b07e12f0161459deaead5e944ce93fc4b69d368ce3eb438ec830c84e784604051612aff91815260200190565b60405180910390a450505b60010161295c565b505f8211612b565760405162461bcd60e51b81526020600482015260116024820152706e6f7468696e6720746f20736574746c6560781b6044820152606401610692565b509392505050565b6040518061014001604052805f81526020015f81526020015f6001600160a01b031681526020015f815260200160608152602001606081526020015f6001600160401b031681526020016060815260200160608152602001606081525090565b80356001600160a01b0381168114612bd4575f5ffd5b919050565b5f5f5f60608486031215612beb575f5ffd5b83359250612bfb60208501612bbe565b9150612c0960408501612bbe565b90509250925092565b5f610100820190508251151582526001600160401b0360208401511660208301526001600160401b0360408401511660408301526060830151612c6060608401826001600160401b03169052565b506080830151612c7b60808401826001600160401b03169052565b5060a083015160a083015260c083015160c083015260e083015160e083015292915050565b5f60208284031215612cb0575f5ffd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b5f8151808452602084019350602083015f5b82811015612d1e5781516001600160a01b0316865260209586019590910190600101612cf7565b5093949350505050565b5f8151808452602084019350602083015f5b82811015612d1e578151865260209586019590910190600101612d3a565b5f8151808452602084019350602083015f5b82811015612d1e5781511515865260209586019590910190600101612d6a565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b82811015612eb057603f19878603018452815180518652602081015160208701526040810151612deb60408801826001600160a01b03169052565b506060810151606087015260808101516101406080880152612e11610140880182612cb7565b905060a082015187820360a0890152612e2a8282612cb7565b91505060c0820151612e4760c08901826001600160401b03169052565b5060e082015187820360e0890152612e5f8282612ce5565b915050610100820151878203610100890152612e7b8282612d28565b9150506101208201519150868103610120880152612e998183612d58565b965050506020938401939190910190600101612db0565b50929695505050505050565b8015158114612ec9575f5ffd5b50565b5f5f5f60608486031215612ede575f5ffd5b83359250612eee60208501612bbe565b91506040840135612efe81612ebc565b809150509250925092565b5f60208284031215612f19575f5ffd5b61289a82612bbe565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b82811015612eb057603f19878603018452815180518652602081015160806020880152612f786080880182612cb7565b6040838101516001600160a01b0316908901526060928301516001600160401b03169290970191909152506020938401939190910190600101612f48565b5f5f60408385031215612fc7575f5ffd5b82359150612fd760208401612bbe565b90509250929050565b5f5f83601f840112612ff0575f5ffd5b5081356001600160401b03811115613006575f5ffd5b60208301915083602082850101111561301d575f5ffd5b9250929050565b5f5f60208385031215613035575f5ffd5b82356001600160401b0381111561304a575f5ffd5b61305685828601612fe0565b90969095509350505050565b602080825282518282018190525f918401906040840190835b818110156130a25783516001600160a01b031683526020938401939092019160010161307b565b509095945050505050565b80356001600160401b0381168114612bd4575f5ffd5b5f5f5f5f5f5f5f60e0888a0312156130d9575f5ffd5b873596506130e960208901612bbe565b95506130f7604089016130ad565b9450613105606089016130ad565b93506080880135925060a0880135915061312160c089016130ad565b905092959891949750929550565b5f5f83601f84011261313f575f5ffd5b5081356001600160401b03811115613155575f5ffd5b6020830191508360208260051b850101111561301d575f5ffd5b5f5f5f5f5f5f5f5f5f5f60c08b8d031215613188575f5ffd5b8a35995060208b01356001600160401b038111156131a4575f5ffd5b6131b08d828e0161312f565b909a5098505060408b01356001600160401b038111156131ce575f5ffd5b6131da8d828e0161312f565b90985096505060608b01356001600160401b038111156131f8575f5ffd5b6132048d828e01612fe0565b90965094505060808b01356001600160401b03811115613222575f5ffd5b61322e8d828e01612fe0565b9b9e9a9d50989b979a96999598949794969560a090950135949350505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b808201808211156122f8576122f8613262565b818103818111156122f8576122f8613262565b80820281158282048414176122f8576122f8613262565b5f826132cd57634e487b7160e01b5f52601260045260245ffd5b500490565b5f602082840312156132e2575f5ffd5b5051919050565b5f602082840312156132f9575f5ffd5b815161289a81612ebc565b6020808252601490820152731554d110c81d1c985b9cd9995c8819985a5b195960621b604082015260600190565b6020808252600f908201526e185b5bdd5b9d081c995c5d5a5c9959608a1b604082015260600190565b634e487b7160e01b5f52604160045260245ffd5b600181811c9082168061338357607f821691505b6020821081036133a157634e487b7160e01b5f52602260045260245ffd5b50919050565b5f600182016133b8576133b8613262565b5060010190565b601f82111561340657805f5260205f20601f840160051c810160208510156133e45750805b601f840160051c820191505b81811015613403575f81556001016133f0565b50505b505050565b81516001600160401b038111156134245761342461335b565b61343881613432845461336f565b846133bf565b6020601f82116001811461346a575f83156134535750848201515b5f19600385901b1c1916600184901b178455613403565b5f84815260208120601f198516915b828110156134995787850151825560209485019460019092019101613479565b50848210156134b657868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b60208152816020820152818360408301375f818301604090810191909152601f909201601f19160101919050565b6020808252601690820152753737ba1030903bb7b935b9b830b1b29036b2b6b132b960511b60408201526060019056fea2646970667358221220462c740255b0686c9ee087cd6403609d0b3a3e8efb899b979c35ae1246c42bd764736f6c634300081c0033" as const;
