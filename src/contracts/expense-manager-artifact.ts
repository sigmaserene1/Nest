// AUTO-GENERATED from contracts/ExpenseManager.sol (solc 0.8.28, optimizer 200 runs).
// Do not edit by hand — recompile the Solidity source instead.

export const EXPENSE_MANAGER_ABI = [
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
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
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "note",
        "type": "string"
      }
    ],
    "name": "DirectTransfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "DisplayNameSet",
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
        "name": "member",
        "type": "address"
      }
    ],
    "name": "MemberJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
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
    "name": "RoomCreated",
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
        "name": "user",
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
        "name": "user",
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
    "inputs": [],
    "name": "SUPPLY_APR_BPS",
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
    "inputs": [],
    "name": "claimInterest",
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
    "name": "createRoom",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "roomId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "note",
        "type": "string"
      }
    ],
    "name": "directTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "displayNames",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
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
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getActivity",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "kind",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "refId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roomId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "actor",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "counterparty",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "text",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          }
        ],
        "internalType": "struct ExpenseManager.ActivityView[]",
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
    "name": "getBalances",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "members",
        "type": "address[]"
      },
      {
        "internalType": "int256[]",
        "name": "net",
        "type": "int256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "users",
        "type": "address[]"
      }
    ],
    "name": "getDisplayNames",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "out",
        "type": "string[]"
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
      }
    ],
    "name": "getExpense",
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
        "internalType": "struct ExpenseManager.ExpenseView",
        "name": "v",
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
        "internalType": "struct ExpenseManager.ExpenseView[]",
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
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getLendingPosition",
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
            "name": "supplyInterest",
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
            "name": "poolSupplied",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "poolBorrowed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "liquidity",
            "type": "uint256"
          }
        ],
        "internalType": "struct ExpenseManager.LendingPosition",
        "name": "p",
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
    "name": "getRoom",
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
        "internalType": "struct ExpenseManager.Room",
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
        "internalType": "struct ExpenseManager.Room[]",
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
        "name": "roomId",
        "type": "uint256"
      }
    ],
    "name": "joinRoom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lendingEnabled",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
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
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "setDisplayName",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "expenseId",
        "type": "uint256"
      }
    ],
    "name": "settleSplit",
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
        "name": "to",
        "type": "address"
      }
    ],
    "name": "settleWith",
    "outputs": [],
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
        "internalType": "contract IERC20",
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

export const EXPENSE_MANAGER_BYTECODE = "0x60a060405234801561000f575f5ffd5b5060405161427e38038061427e83398101604081905261002e9161003f565b6001600160a01b031660805261006c565b5f6020828403121561004f575f5ffd5b81516001600160a01b0381168114610065575f5ffd5b9392505050565b6080516141ad6100d15f395f81816102bf0152818161060e015281816108f6015281816109bd01528181610ac601528181610c4101528181610cf201528181610e3f0152818161174901528181612521015281816125fc015261279401526141ad5ff3fe608060405234801561000f575f5ffd5b5060043610610208575f3560e01c8063721dbb151161011f578063ae8c1b16116100a9578063d94ee8e011610079578063d94ee8e01461053f578063dbbfc33714610552578063dc86638114610565578063df8a1a0e14610585578063df93a4e314610598575f5ffd5b8063ae8c1b1614610509578063c23b84a414610512578063c5ebeaec14610519578063d073c1ae1461052c575f5ffd5b806391e33085116100ef57806391e33085146104905780639cfc4b45146104a35780639e6d6830146104b6578063a283ca55146104c9578063a504a2b2146104e9575f5ffd5b8063721dbb15146104005780637306d2dd14610420578063735e5db6146104335780637d9e10f514610453575f5ffd5b8063384c5aa9116101a05780634c19386c116101705780634c19386c1461033a5780634f480fb01461034357806352e7df5d146103ce578063630fd0ac146103d75780636d8a74cb146103e0575f5ffd5b8063384c5aa91461029a5780633e413bee146102ba578063490adbaf146102f9578063498369821461031a575f5ffd5b80632e1a7d4d116101db5780632e1a7d4d14610259578063354030231461026c57806335981fd81461027f578063371fd8e614610287575f5ffd5b80630268e33b1461020c5780630e9a0202146102285780630f8c94541461023d5780631bfaae1d14610250575b5f5ffd5b61021561032081565b6040519081526020015b60405180910390f35b61023b6102363660046135fc565b6105a0565b005b61021561024b36600461365e565b61073f565b61021561138881565b61023b610267366004613697565b6107e4565b61023b61027a366004613697565b610a87565b61023b610bce565b61023b610295366004613697565b610d84565b6102ad6102a83660046136ae565b610f81565b60405161021f91906136fc565b6102e17f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200161021f565b61030c610307366004613697565b6111be565b60405161021f929190613825565b61032d610328366004613697565b611515565b60405161021f91906139bd565b61021560105481565b610356610351366004613a14565b6115d5565b60405161021f91905f61014082019050825182526020830151602083015260408301516040830152606083015160608301526080830151608083015260a083015160a083015260c083015160c083015260e083015160e083015261010083015161010083015261012083015161012083015292915050565b61021560015481565b610215600f5481565b6103f36103ee366004613697565b61181d565b60405161021f9190613a7c565b61041361040e366004613a14565b61190b565b60405161021f9190613a8e565b61021561042e366004613ae5565b611aee565b610446610441366004613697565b611c5c565b60405161021f9190613b23565b610480610461366004613b35565b600460209081525f928352604080842090915290825290205460ff1681565b604051901515815260200161021f565b61023b61049e366004613ae5565b611fdb565b61023b6104b1366004613697565b6120e6565b61023b6104c4366004613b35565b61219a565b6104dc6104d7366004613b9f565b61228c565b60405161021f9190613bd1565b6104fc6104f7366004613697565b6123e2565b60405161021f9190613c28565b61021561019081565b6001610480565b61023b610527366004613697565b61244b565b61023b61053a366004613697565b6126bc565b61021561054d366004613c3a565b6128d4565b610215610560366004613b35565b612e24565b610578610573366004613a14565b612ea9565b60405161021f9190613d19565b61023b610593366004613b35565b612f40565b6102155f5481565b6001600160a01b038416158015906105b757505f83115b6105f75760405162461bcd60e51b815260206004820152600c60248201526b3130b2103a3930b739b332b960a11b60448201526064015b60405180910390fd5b6040516323b872dd60e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd9061064790339088908890600401613d2b565b6020604051808303815f875af1158015610663573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906106879190613d4f565b6106a35760405162461bcd60e51b81526004016105ee90613d6e565b6106e860025f8733888888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061308b92505050565b836001600160a01b0316336001600160a01b0316867fd7aeba73924d4ca4cb0235c776cee391542268e8310e8c70d3a7f01cf68e6b2b86868660405161073093929190613dc4565b60405180910390a45050505050565b5f838152600a60205260408120815b81548110156107db57836001600160a01b031660065f84848154811061077657610776613ddd565b5f91825260208083209091015483528201929092526040019020600201546001600160a01b0316036107d3576107c68282815481106107b7576107b7613ddd565b905f5260205f20015486612e24565b6107d09084613e05565b92505b60010161074e565b50509392505050565b6107ed336132a2565b335f908152600e60205260409020811580159061080b575080548211155b61084f5760405162461bcd60e51b8152602060048201526015602482015274616d6f756e74206578636565647320737570706c7960581b60448201526064016105ee565b80545f9061085e908490613e18565b90505f826004015483600301546108759190613e05565b90508061271061088761138885613e2b565b6108919190613e42565b10156108df5760405162461bcd60e51b815260206004820152601960248201527f776f756c642065786365656420626f72726f77206c696d69740000000000000060448201526064016105ee565b6040516370a0823160e01b815230600482015284907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610943573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906109679190613e61565b10156109855760405162461bcd60e51b81526004016105ee90613e78565b818355600f80548591905f9061099c908490613e18565b909155505060405163a9059cbb60e01b8152336004820152602481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610a0b573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610a2f9190613d4f565b610a4b5760405162461bcd60e51b81526004016105ee90613d6e565b60405184815233907f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5906020015b60405180910390a250505050565b5f8111610aa65760405162461bcd60e51b81526004016105ee90613eaf565b610aaf336132a2565b6040516323b872dd60e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd90610aff90339030908690600401613d2b565b6020604051808303815f875af1158015610b1b573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610b3f9190613d4f565b610b5b5760405162461bcd60e51b81526004016105ee90613d6e565b335f908152600e602052604081208054839290610b79908490613e05565b9250508190555080600f5f828254610b919190613e05565b909155505060405181815233907f6473c9f7da8f23a3d810f05b3e8fb3945f0ad17deadcc09e302cdf5d58e48fe79060200160405180910390a250565b610bd7336132a2565b335f908152600e60205260409020600181015480610c2a5760405162461bcd60e51b815260206004820152601060248201526f6e6f7468696e6720746f20636c61696d60801b60448201526064016105ee565b6040516370a0823160e01b815230600482015281907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610c8e573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610cb29190613e61565b1015610cd05760405162461bcd60e51b81526004016105ee90613e78565b5f600183015560405163a9059cbb60e01b8152336004820152602481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610d40573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610d649190613d4f565b610d805760405162461bcd60e51b81526004016105ee90613d6e565b5050565b5f8111610da35760405162461bcd60e51b81526004016105ee90613eaf565b610dac336132a2565b335f908152600e6020526040812060048101546003820154919291610dd19190613e05565b90505f8111610e155760405162461bcd60e51b815260206004820152601060248201526f6e6f7468696e6720746f20726570617960801b60448201526064016105ee565b5f818411610e235783610e25565b815b6040516323b872dd60e01b81529091506001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906323b872dd90610e7890339030908690600401613d2b565b6020604051808303815f875af1158015610e94573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610eb89190613d4f565b610ed45760405162461bcd60e51b81526004016105ee90613d6e565b5f83600401548211610ee65781610eec565b83600401545b905080846004015f828254610f019190613e18565b909155505f9050610f128284613e18565b905080856003015f828254610f279190613e18565b925050819055508060105f828254610f3f9190613e18565b909155505060405183815233907f0516911bcc3a0a7412a44601057c0a0a1ec628bde049a84284bc4288665344889060200160405180910390a2505050505050565b5f828152600d602052604081208054606092908411610fa05783610fa3565b81545b9050806001600160401b03811115610fbd57610fbd613ed8565b60405190808252806020026020018201604052801561102957816020015b60408051610100810182525f808252602080830182905292820181905260608083018290526080830182905260a0830182905260c083015260e082015282525f19909201910181610fdb5790505b5092505f5b818110156111b557600c83826001868054905061104b9190613e18565b6110559190613e18565b8154811061106557611065613ddd565b905f5260205f2001548154811061107e5761107e613ddd565b5f91825260209182902060408051610100810182526008909302909101805460ff16835260018101549383019390935260028301549082015260038201546001600160a01b0390811660608301526004830154166080820152600582015460a082015260068201805491929160c0840191906110f990613eec565b80601f016020809104026020016040519081016040528092919081815260200182805461112590613eec565b80156111705780601f1061114757610100808354040283529160200191611170565b820191905f5260205f20905b81548152906001019060200180831161115357829003601f168201915b5050509183525050600791909101546001600160401b031660209091015284518590839081106111a2576111a2613ddd565b602090810291909101015260010161102e565b50505092915050565b60608060035f8481526020019081526020015f2080548060200260200160405190810160405280929190818152602001828054801561122457602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311611206575b5050505050915081516001600160401b0381111561124457611244613ed8565b60405190808252806020026020018201604052801561126d578160200160208202803683370190505b505f848152600a602052604081209192505b815481101561150e575f60065f84848154811061129e5761129e613ddd565b905f5260205f20015481526020019081526020015f2090505f60075f8585815481106112cc576112cc613ddd565b905f5260205f20015481526020019081526020015f2090505f5b81548110156115035760095f86868154811061130457611304613ddd565b905f5260205f20015481526020019081526020015f205f83838154811061132d5761132d613ddd565b5f9182526020808320909101546001600160a01b0316835282019290925260400190205460ff16806113955750600283015482546001600160a01b039091169083908390811061137f5761137f613ddd565b5f918252602090912001546001600160a01b0316145b6114fb575f60085f8787815481106113af576113af613ddd565b905f5260205f20015481526020019081526020015f205f8484815481106113d8576113d8613ddd565b5f9182526020808320909101546001600160a01b0316835282019290925260400181205491505b88518110156114f85783838154811061141a5761141a613ddd565b5f9182526020909120015489516001600160a01b03909116908a908390811061144557611445613ddd565b60200260200101516001600160a01b03160361148a578188828151811061146e5761146e613ddd565b602002602001018181516114829190613f24565b9052506114f0565b600285015489516001600160a01b03909116908a90839081106114af576114af613ddd565b60200260200101516001600160a01b0316036114f057818882815181106114d8576114d8613ddd565b602002602001018181516114ec9190613f43565b9052505b6001016113ff565b50505b6001016112e6565b50505060010161127f565b5050915091565b5f818152600a602052604090208054606091906001600160401b0381111561153f5761153f613ed8565b60405190808252806020026020018201604052801561157857816020015b611565613506565b81526020019060019003908161155d5790505b5091505f5b81548110156115ce576115a982828154811061159b5761159b613ddd565b905f5260205f200154611c5c565b8382815181106115bb576115bb613ddd565b602090810291909101015260010161157d565b5050919050565b6116216040518061014001604052805f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81526020015f81525090565b6001600160a01b0382165f908152600e6020526040812060028101549091906001600160401b03161561166b576002820154611666906001600160401b031642613e18565b61166d565b5f5b60058301549091505f906001600160401b0316156116a257600583015461169d906001600160401b031642613e18565b6116a4565b5f5b83548086529091506116b990610190846133d1565b83600101546116c89190613e05565b60208501526003830154604085018190526116e690610320836133d1565b83600401546116f59190613e05565b60608501819052604085015161170b9190613e05565b60808501528254612710906117239061138890613e2b565b61172d9190613e42565b60a08501526040516370a0823160e01b81523060048201525f907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015611796573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906117ba9190613e61565b90505f85608001518660a00151116117d2575f6117e6565b85608001518660a001516117e69190613e18565b90508181106117f557816117f7565b805b60c087015250600f5460e086015260105461010086015261012085015250919392505050565b611825613566565b60025f8381526020019081526020015f206040518060800160405290815f820154815260200160018201805461185a90613eec565b80601f016020809104026020016040519081016040528092919081815260200182805461188690613eec565b80156118d15780601f106118a8576101008083540402835291602001916118d1565b820191905f5260205f20905b8154815290600101906020018083116118b457829003601f168201915b5050509183525050600291909101546001600160a01b0381166020830152600160a01b90046001600160401b031660409091015292915050565b6001600160a01b0381165f90815260056020908152604080832080548251818502810185019093528083526060949383018282801561196757602002820191905f5260205f20905b815481526020019060010190808311611953575b5050505050905080516001600160401b0381111561198757611987613ed8565b6040519080825280602002602001820160405280156119c057816020015b6119ad613566565b8152602001906001900390816119a55790505b5091505f5b81518110156115ce5760025f8383815181106119e3576119e3613ddd565b602002602001015181526020019081526020015f206040518060800160405290815f8201548152602001600182018054611a1c90613eec565b80601f0160208091040260200160405190810160405280929190818152602001828054611a4890613eec565b8015611a935780601f10611a6a57610100808354040283529160200191611a93565b820191905f5260205f20905b815481529060010190602001808311611a7657829003601f168201915b5050509183525050600291909101546001600160a01b0381166020830152600160a01b90046001600160401b03166040909101528351849083908110611adb57611adb613ddd565b60209081029190910101526001016119c5565b5f81611b2c5760405162461bcd60e51b815260206004820152600d60248201526c1b985b59481c995c5d5a5c9959609a1b60448201526064016105ee565b5f5f8154611b3990613f6a565b9190508190559050604051806080016040528082815260200184848080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201829052509385525050336020808501919091526001600160401b03421660409485015285835260028152929091208351815591830151600183019150611bc59082613fc6565b506040820151600290910180546060909301516001600160401b0316600160a01b026001600160e01b03199093166001600160a01b0390921691909117919091179055611c128133613422565b336001600160a01b0316817f8ed409580b4ef61f89b8b2d12e05d49c7c07ba331696f9e3002bb44c34518a8f8585604051611c4e929190614080565b60405180910390a392915050565b611c64613506565b5f828152600660209081526040808320600790925282208054919290916001600160401b03811115611c9857611c98613ed8565b604051908082528060200260200182016040528015611cc1578160200160208202803683370190505b5082549091505f906001600160401b03811115611ce057611ce0613ed8565b604051908082528060200260200182016040528015611d09578160200160208202803683370190505b5090505f5b8354811015611df95760085f8881526020019081526020015f205f858381548110611d3b57611d3b613ddd565b5f9182526020808320909101546001600160a01b031683528201929092526040019020548351849083908110611d7357611d73613ddd565b60200260200101818152505060095f8881526020019081526020015f205f858381548110611da357611da3613ddd565b5f9182526020808320909101546001600160a01b03168352820192909252604001902054825160ff90911690839083908110611de157611de1613ddd565b91151560209283029190910190910152600101611d0e565b506040805161014081018252855481526001860154602082015260028601546001600160a01b03169181019190915260038501546060820152600485018054608083019190611e4790613eec565b80601f0160208091040260200160405190810160405280929190818152602001828054611e7390613eec565b8015611ebe5780601f10611e9557610100808354040283529160200191611ebe565b820191905f5260205f20905b815481529060010190602001808311611ea157829003601f168201915b50505050508152602001856005018054611ed790613eec565b80601f0160208091040260200160405190810160405280929190818152602001828054611f0390613eec565b8015611f4e5780601f10611f2557610100808354040283529160200191611f4e565b820191905f5260205f20905b815481529060010190602001808311611f3157829003601f168201915b505050918352505060068601546001600160401b031660208083019190915285546040805182840281018401825282815293019291879190830182828015611fbd57602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311611f9f575b50505091835250506020810193909352604090920152949350505050565b335f908152600b602052604090208054611ff490613eec565b15905061203a5760405162461bcd60e51b81526020600482015260146024820152731b985b5948185b1c9958591e4818db185a5b595960621b60448201526064016105ee565b801580159061204a5750603c8111155b6120855760405162461bcd60e51b815260206004820152600c60248201526b696e76616c6964206e616d6560a01b60448201526064016105ee565b335f908152600b6020526040902061209e828483614093565b50336001600160a01b03167f8d70d8b6ee456a185fc422da3d210272ba67ae49243bd64c1a1feac04b1605e183836040516120da929190614080565b60405180910390a25050565b5f8181526002602052604081205490036121315760405162461bcd60e51b815260206004820152600c60248201526b6e6f207375636820726f6f6d60a01b60448201526064016105ee565b5f81815260046020908152604080832033845290915290205460ff161561218d5760405162461bcd60e51b815260206004820152601060248201526f30b63932b0b23c90309036b2b6b132b960811b60448201526064016105ee565b6121978133613422565b50565b5f828152600460209081526040808320338452909152902054829060ff166121d45760405162461bcd60e51b81526004016105ee9061414c565b6001600160a01b0382166122185760405162461bcd60e51b815260206004820152600b60248201526a626164206164647265737360a81b60448201526064016105ee565b5f8381526004602090815260408083206001600160a01b038616845290915290205460ff161561227d5760405162461bcd60e51b815260206004820152601060248201526f30b63932b0b23c90309036b2b6b132b960811b60448201526064016105ee565b6122878383613422565b505050565b6060816001600160401b038111156122a6576122a6613ed8565b6040519080825280602002602001820160405280156122d957816020015b60608152602001906001900390816122c45790505b5090505f5b828110156123db57600b5f8585848181106122fb576122fb613ddd565b90506020020160208101906123109190613a14565b6001600160a01b03166001600160a01b031681526020019081526020015f20805461233a90613eec565b80601f016020809104026020016040519081016040528092919081815260200182805461236690613eec565b80156123b15780601f10612388576101008083540402835291602001916123b1565b820191905f5260205f20905b81548152906001019060200180831161239457829003601f168201915b50505050508282815181106123c8576123c8613ddd565b60209081029190910101526001016122de565b5092915050565b5f8181526003602090815260409182902080548351818402810184019094528084526060939283018282801561243f57602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311612421575b50505050509050919050565b5f811161246a5760405162461bcd60e51b81526004016105ee90613eaf565b612473336132a2565b335f908152600e602052604081208054909190612710906124979061138890613e2b565b6124a19190613e42565b90505f826004015483600301546124b89190613e05565b9050816124c58583613e05565b111561250a5760405162461bcd60e51b8152602060048201526014602482015273195e18d959591cc8189bdc9c9bddc81b1a5b5a5d60621b60448201526064016105ee565b6040516370a0823160e01b815230600482015284907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa15801561256e573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906125929190613e61565b10156125b05760405162461bcd60e51b81526004016105ee90613e78565b83836003015f8282546125c39190613e05565b925050819055508360105f8282546125db9190613e05565b909155505060405163a9059cbb60e01b8152336004820152602481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af115801561264a573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061266e9190613d4f565b61268a5760405162461bcd60e51b81526004016105ee90613d6e565b60405184815233907fac59582e5396aca512fa873a2047e7f4c80f8f55d4a06cb34a78a0187f62719f90602001610a79565b5f818152600660205260408120805490910361270c5760405162461bcd60e51b815260206004820152600f60248201526e6e6f207375636820657870656e736560881b60448201526064016105ee565b5f6127178333612e24565b90505f811161275c5760405162461bcd60e51b81526020600482015260116024820152706e6f7468696e6720746f20736574746c6560781b60448201526064016105ee565b5f83815260096020908152604080832033808552925291829020805460ff19166001179055600284015491516323b872dd60e01b81527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03908116936323b872dd936127da93909291909116908690600401613d2b565b6020604051808303815f875af11580156127f6573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061281a9190613d4f565b6128365760405162461bcd60e51b81526004016105ee90613d6e565b612887600184846001015433866002015f9054906101000a90046001600160a01b0316866040518060400160405280600f81526020016e736574746c6564206120736861726560881b81525061308b565b60028201546040518281526001600160a01b0390911690339085907fec7e547b07e12f0161459deaead5e944ce93fc4b69d368ce3eb438ec830c84e79060200160405180910390a4505050565b5f8a81526004602090815260408083203384529091528120548b9060ff1661290e5760405162461bcd60e51b81526004016105ee9061414c565b891580159061291c57508988145b6129555760405162461bcd60e51b815260206004820152600a6024820152696261642073706c69747360b01b60448201526064016105ee565b5f5f5b8b811015612a24575f8e8152600460205260408120908e8e8481811061298057612980613ddd565b90506020020160208101906129959190613a14565b6001600160a01b0316815260208101919091526040015f205460ff166129f65760405162461bcd60e51b81526020600482015260166024820152753830b93a34b1b4b830b73a103737ba1036b2b6b132b960511b60448201526064016105ee565b8a8a82818110612a0857612a08613ddd565b9050602002013582612a1a9190613e05565b9150600101612958565b508381148015612a3357505f84115b612a7f5760405162461bcd60e51b815260206004820152601760248201527f736861726573206d75737420657175616c20746f74616c00000000000000000060448201526064016105ee565b60015f8154612a8d90613f6a565b91905081905592506040518060e001604052808481526020018e8152602001336001600160a01b0316815260200185815260200189898080601f0160208091040260200160405190810160405280939291908181526020018383808284375f92019190915250505090825250604080516020601f8a01819004810282018101909252888152918101919089908990819084018382808284375f920182905250938552505050426001600160401b031660209283015285815260068252604090819020835181559183015160018301558201516002820180546001600160a01b0319166001600160a01b039092169190911790556060820151600382015560808201516004820190612b9e9082613fc6565b5060a08201516005820190612bb39082613fc6565b5060c091909101516006909101805467ffffffffffffffff19166001600160401b039092169190911790555f5b8b811015612d55575f8481526007602052604090208d8d83818110612c0757612c07613ddd565b9050602002016020810190612c1c9190613a14565b81546001810183555f928352602090922090910180546001600160a01b0319166001600160a01b039092169190911790558a8a82818110612c5f57612c5f613ddd565b9050602002013560085f8681526020019081526020015f205f8f8f85818110612c8a57612c8a613ddd565b9050602002016020810190612c9f9190613a14565b6001600160a01b0316815260208101919091526040015f2055338d8d83818110612ccb57612ccb613ddd565b9050602002016020810190612ce09190613a14565b6001600160a01b031603612d4d575f8481526009602052604081206001918f8f85818110612d1057612d10613ddd565b9050602002016020810190612d259190613a14565b6001600160a01b0316815260208101919091526040015f20805460ff19169115159190911790555b600101612be0565b50600a5f8e81526020019081526020015f2083908060018154018082558091505060019003905f5260205f20015f9091909190915055612dcf5f848f335f898c8c8080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061308b92505050565b336001600160a01b03168d847fcce5df0764f156d5d8021e18a302ab652c016fc057e00406d3b63a2e2160602987604051612e0c91815260200190565b60405180910390a450509a9950505050505050505050565b5f8281526009602090815260408083206001600160a01b038516845290915281205460ff1615612e5557505f612ea3565b5f838152600660205260409020600201546001600160a01b03808416911603612e7f57505f612ea3565b505f8281526008602090815260408083206001600160a01b03851684529091529020545b92915050565b600b6020525f908152604090208054612ec190613eec565b80601f0160208091040260200160405190810160405280929190818152602001828054612eed90613eec565b8015612f385780601f10612f0f57610100808354040283529160200191612f38565b820191905f5260205f20905b815481529060010190602001808311612f1b57829003601f168201915b505050505081565b5f828152600460209081526040808320338452909152902054829060ff16612f7a5760405162461bcd60e51b81526004016105ee9061414c565b5f838152600a6020526040812090805b825481101561304057846001600160a01b031660065f858481548110612fb257612fb2613ddd565b5f91825260208083209091015483528201929092526040019020600201546001600160a01b03160361303857613002838281548110612ff357612ff3613ddd565b905f5260205f20015433612e24565b156130385761302a83828154811061301c5761301c613ddd565b905f5260205f2001546126bc565b8161303481613f6a565b9250505b600101612f8a565b505f81116130845760405162461bcd60e51b81526020600482015260116024820152706e6f7468696e6720746f20736574746c6560781b60448201526064016105ee565b5050505050565b604080516101008101825260ff808a168252602082018981529282018881526001600160a01b03808916606085019081528882166080860190815260a0860189815260c087018981526001600160401b03421660e0890152600c80546001810182555f91909152885160089091027fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8c7810180549290991660ff1990921691909117885598517fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8c88a015594517fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8c989015591517fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8ca880180549185166001600160a01b031992831617905590517fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8cb8801805491909416911617909155517fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8cc85015551919290917fdf6966c971051c3d54ec59162606531493a51404a002842f56009d7e5cf4a8cd9091019061323d9082613fc6565b5060e091909101516007909101805467ffffffffffffffff19166001600160401b039092169190911790555f858152600d60205260409020600c5461328490600190613e18565b81546001810183555f92835260209092209091015550505050505050565b6001600160a01b0381165f908152600e60205260408120600281015490916001600160401b0390911690036132f05760028101805467ffffffffffffffff1916426001600160401b03161790555b60058101546001600160401b03165f036133235760058101805467ffffffffffffffff1916426001600160401b03161790555b8054600282015461334b919061019090613346906001600160401b031642613e18565b6133d1565b816001015f82825461335d9190613e05565b909155505060038101546005820154613388919061032090613346906001600160401b031642613e18565b816004015f82825461339a9190613e05565b90915550506002810180546001600160401b03421667ffffffffffffffff1991821681179092556005909201805490921617905550565b5f8315806133dd575081155b156133e957505f61341b565b6133f96301e13380612710613e2b565b826134048587613e2b565b61340e9190613e2b565b6134189190613e42565b90505b9392505050565b5f8281526004602090815260408083206001600160a01b038516808552908352818420805460ff191660019081179091558685526003808552838620805480840182559087528587200180546001600160a01b0319168417905591855260058452828520805491820181558552838520018690558151808301909252600f82526e6a6f696e65642074686520686f6d6560881b928201929092526134cd92859182918691819061308b565b6040516001600160a01b0382169083907f78da64a590c3052953ad9e0a5546bbf12bb68ae7634e3fb2a774e22a8c6557c1905f90a35050565b6040518061014001604052805f81526020015f81526020015f6001600160a01b031681526020015f815260200160608152602001606081526020015f6001600160401b031681526020016060815260200160608152602001606081525090565b60405180608001604052805f8152602001606081526020015f6001600160a01b031681526020015f6001600160401b031681525090565b80356001600160a01b03811681146135b3575f5ffd5b919050565b5f5f83601f8401126135c8575f5ffd5b5081356001600160401b038111156135de575f5ffd5b6020830191508360208285010111156135f5575f5ffd5b9250929050565b5f5f5f5f5f60808688031215613610575f5ffd5b853594506136206020870161359d565b93506040860135925060608601356001600160401b03811115613641575f5ffd5b61364d888289016135b8565b969995985093965092949392505050565b5f5f5f60608486031215613670575f5ffd5b833592506136806020850161359d565b915061368e6040850161359d565b90509250925092565b5f602082840312156136a7575f5ffd5b5035919050565b5f5f604083850312156136bf575f5ffd5b50508035926020909101359150565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b828110156137d657603f19878603018452815160ff8151168652602081015160208701526040810151604087015260018060a01b036060820151166060870152608081015161377c60808801826001600160a01b03169052565b5060a081015160a087015260c081015161010060c08801526137a26101008801826136ce565b905060e082015191506137c060e08801836001600160401b03169052565b9550506020938401939190910190600101613722565b50929695505050505050565b5f8151808452602084019350602083015f5b8281101561381b5781516001600160a01b03168652602095860195909101906001016137f4565b5093949350505050565b604081525f61383760408301856137e2565b82810360208401528084518083526020830191506020860192505f5b81811015613871578351835260209384019390920191600101613853565b50909695505050505050565b5f8151808452602084019350602083015f5b8281101561381b57815186526020958601959091019060010161388f565b5f8151808452602084019350602083015f5b8281101561381b57815115158652602095860195909101906001016138bf565b80518252602081015160208301525f604082015161390860408501826001600160a01b03169052565b50606082015160608401526080820151610140608085015261392e6101408501826136ce565b905060a083015184820360a086015261394782826136ce565b91505060c083015161396460c08601826001600160401b03169052565b5060e083015184820360e086015261397c82826137e2565b915050610100830151848203610100860152613998828261387d565b9150506101208301518482036101208601526139b482826138ad565b95945050505050565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b828110156137d657603f198786030184526139ff8583516138df565b945060209384019391909101906001016139e3565b5f60208284031215613a24575f5ffd5b61341b8261359d565b805182525f602082015160806020850152613a4b60808501826136ce565b6040848101516001600160a01b0316908601526060938401516001600160401b031693909401929092525090919050565b602081525f61341b6020830184613a2d565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b828110156137d657603f19878603018452613ad0858351613a2d565b94506020938401939190910190600101613ab4565b5f5f60208385031215613af6575f5ffd5b82356001600160401b03811115613b0b575f5ffd5b613b17858286016135b8565b90969095509350505050565b602081525f61341b60208301846138df565b5f5f60408385031215613b46575f5ffd5b82359150613b566020840161359d565b90509250929050565b5f5f83601f840112613b6f575f5ffd5b5081356001600160401b03811115613b85575f5ffd5b6020830191508360208260051b85010111156135f5575f5ffd5b5f5f60208385031215613bb0575f5ffd5b82356001600160401b03811115613bc5575f5ffd5b613b1785828601613b5f565b5f602082016020835280845180835260408501915060408160051b8601019250602086015f5b828110156137d657603f19878603018452613c138583516136ce565b94506020938401939190910190600101613bf7565b602081525f61341b60208301846137e2565b5f5f5f5f5f5f5f5f5f5f60c08b8d031215613c53575f5ffd5b8a35995060208b01356001600160401b03811115613c6f575f5ffd5b613c7b8d828e01613b5f565b909a5098505060408b01356001600160401b03811115613c99575f5ffd5b613ca58d828e01613b5f565b90985096505060608b01356001600160401b03811115613cc3575f5ffd5b613ccf8d828e016135b8565b90965094505060808b01356001600160401b03811115613ced575f5ffd5b613cf98d828e016135b8565b9b9e9a9d50989b979a96999598949794969560a090950135949350505050565b602081525f61341b60208301846136ce565b6001600160a01b039384168152919092166020820152604081019190915260600190565b5f60208284031215613d5f575f5ffd5b8151801515811461341b575f5ffd5b6020808252601490820152731554d110c81d1c985b9cd9995c8819985a5b195960621b604082015260600190565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b838152604060208201525f6139b4604083018486613d9c565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b80820180821115612ea357612ea3613df1565b81810381811115612ea357612ea3613df1565b8082028115828204841417612ea357612ea3613df1565b5f82613e5c57634e487b7160e01b5f52601260045260245ffd5b500490565b5f60208284031215613e71575f5ffd5b5051919050565b6020808252601b908201527f696e73756666696369656e7420706f6f6c206c69717569646974790000000000604082015260600190565b6020808252600f908201526e185b5bdd5b9d081c995c5d5a5c9959608a1b604082015260600190565b634e487b7160e01b5f52604160045260245ffd5b600181811c90821680613f0057607f821691505b602082108103613f1e57634e487b7160e01b5f52602260045260245ffd5b50919050565b8181035f8312801583831316838312821617156123db576123db613df1565b8082018281125f831280158216821582161715613f6257613f62613df1565b505092915050565b5f60018201613f7b57613f7b613df1565b5060010190565b601f82111561228757805f5260205f20601f840160051c81016020851015613fa75750805b601f840160051c820191505b81811015613084575f8155600101613fb3565b81516001600160401b03811115613fdf57613fdf613ed8565b613ff381613fed8454613eec565b84613f82565b6020601f821160018114614025575f831561400e5750848201515b5f19600385901b1c1916600184901b178455613084565b5f84815260208120601f198516915b828110156140545787850151825560209485019460019092019101614034565b508482101561407157868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b602081525f613418602083018486613d9c565b6001600160401b038311156140aa576140aa613ed8565b6140be836140b88354613eec565b83613f82565b5f601f8411600181146140ef575f85156140d85750838201355b5f19600387901b1c1916600186901b178355613084565b5f83815260208120601f198716915b8281101561411e57868501358255602094850194600190920191016140fe565b508682101561413a575f1960f88860031b161c19848701351681555b505060018560011b0183555050505050565b6020808252601190820152703737ba1030903937b7b69036b2b6b132b960791b60408201526060019056fea2646970667358221220b6516bc45b024069872dfaa609dc884ea987a272cbce3291a47fba7c6eeef93964736f6c634300081c0033" as const;
