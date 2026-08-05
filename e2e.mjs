import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { EXPENSE_MANAGER_ABI } from '/dev-server/src/contracts/expense-manager-artifact.ts';

const RPCS=["https://arc-testnet.drpc.org","https://5042002.rpc.thirdweb.com","https://rpc.testnet.arc.network"];
const chain={id:5042002,name:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:6},rpcUrls:{default:{http:RPCS}}};
const USDC='0x3600000000000000000000000000000000000000';
const MGR='0x709cbad88162b999882788155cde79ade46a6d42';
const ERC20=parseAbi(['function balanceOf(address) view returns (uint256)','function allowance(address,address) view returns (uint256)','function approve(address,uint256) returns (bool)','function decimals() view returns (uint8)','function symbol() view returns (string)']);
const A='0x014a58708c30a60fa864b21c66822fd52dbc57dc';
const B='0x9ab99e195a2dde2f0e6cbd57ffad4de70ee3be27';

for (const url of RPCS) {
  const c=createPublicClient({chain,transport:http(url,{timeout:20000})});
  console.log('\n=== RPC',url);
  try{
    console.log('chainId',await c.getChainId(),'block',await c.getBlockNumber());
    const code=await c.getBytecode({address:MGR});
    console.log('manager bytecode bytes',code?(code.length-2)/2:0);
    console.log('usdc symbol',await c.readContract({address:USDC,abi:ERC20,functionName:'symbol'}),'decimals',await c.readContract({address:USDC,abi:ERC20,functionName:'decimals'}));
    const balA=await c.readContract({address:USDC,abi:ERC20,functionName:'balanceOf',args:[A]});
    const alw=await c.readContract({address:USDC,abi:ERC20,functionName:'allowance',args:[A,MGR]});
    console.log('A usdc',formatUnits(balA,6),'allowance->mgr',formatUnits(alw,6));
    // simulate approve
    const ap=await c.simulateContract({address:USDC,abi:ERC20,functionName:'approve',args:[MGR,1000000n],account:A});
    console.log('simulate approve: OK, returns', ap.result);
    // room state
    const rooms=await c.readContract({address:MGR,abi:EXPENSE_MANAGER_ABI,functionName:'roomsOf',args:[A]});
    console.log('rooms of A', rooms);
    const members=await c.readContract({address:MGR,abi:EXPENSE_MANAGER_ABI,functionName:'membersOf',args:[1n]});
    console.log('members room1', members);
    const owed=await c.readContract({address:MGR,abi:EXPENSE_MANAGER_ABI,functionName:'owedBetween',args:[1n,A,B]}).catch(e=>'n/a: '+e.shortMessage);
    console.log('owed A->B', owed);
    for (const [fn,args] of [['settleWith',[1n,B]],['directTransfer',[1n,B,1000n,'e2e test']]]) {
      try{ const s=await c.simulateContract({address:MGR,abi:EXPENSE_MANAGER_ABI,functionName:fn,args,account:A}); console.log('simulate',fn,'OK'); }
      catch(e){ console.log('simulate',fn,'REVERT:',e.shortMessage||e.message.split('\n')[0], e.metaMessages?.[0]||''); }
    }
    break;
  }catch(e){console.log('rpc failed:',e.shortMessage||e.message.split('\n')[0]);}
}
