#!/usr/bin/env node
import fs from "node:fs";
import solc from "solc";

const ADDRESS = "0x1173776512ae96af2a480a8a1898df8582489425";
const SOURCE_PATH = "contracts/NestTreasuryV3.sol";
const CONTRACT_NAME = "NestTreasuryV3";
const COMPILER_VERSION = "v0.8.28+commit.7893614a";
const RPC_URL = "https://rpc.testnet.arc.network";
const EXPLORER_API = "https://explorer.testnet.arc.io/api";
const USDC = "0x3600000000000000000000000000000000000000";

const source = fs.readFileSync(SOURCE_PATH,"utf8");
const input = {
  language:"Solidity",
  sources:{[SOURCE_PATH]:{content:source}},
  settings:{
    optimizer:{enabled:true,runs:200},
    outputSelection:{"*":{"*":["abi","metadata","evm.bytecode","evm.deployedBytecode"]}},
  },
};

const out=JSON.parse(solc.compile(JSON.stringify(input)));
const fatal=(out.errors??[]).filter(e=>e.severity==="error");
if(fatal.length) throw new Error(fatal.map(e=>e.formattedMessage).join("\n"));
const artifact=out.contracts?.[SOURCE_PATH]?.[CONTRACT_NAME];
if(!artifact) throw new Error("Treasury artifact missing.");

const local=artifact.evm.deployedBytecode.object.toLowerCase().replace(/^0x/,"");
const rpc=async(method,params)=>{
  const res=await fetch(RPC_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
  const json=await res.json();
  if(json.error) throw new Error(json.error.message);
  return json.result;
};
const onchain=String(await rpc("eth_getCode",[ADDRESS,"latest"])).toLowerCase().replace(/^0x/,"");
if(local!==onchain) throw new Error(`Runtime bytecode mismatch: local ${local.length/2}, chain ${onchain.length/2}`);

const constructorArgs=USDC.toLowerCase().replace(/^0x/,"").padStart(64,"0");
const body=new URLSearchParams({
  module:"contract",
  action:"verifysourcecode",
  codeformat:"solidity-standard-json-input",
  contractaddress:ADDRESS,
  contractname:`${SOURCE_PATH}:${CONTRACT_NAME}`,
  compilerversion:COMPILER_VERSION,
  sourceCode:JSON.stringify(input),
  constructorArguements:constructorArgs,
  licenseType:"3",
});
const submit=await fetch(EXPLORER_API,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
const response=await submit.json();
console.log("Explorer response:",response);
if(response.status!=="1" && !/already verified/i.test(String(response.result??""))) {
  throw new Error(String(response.result??response.message??"Verification submission failed"));
}
if(response.status==="1"){
  for(let i=0;i<24;i++){
    await new Promise(r=>setTimeout(r,5000));
    const res=await fetch(`${EXPLORER_API}?module=contract&action=checkverifystatus&guid=${encodeURIComponent(response.result)}`);
    const json=await res.json();
    console.log("Verification status:",json.result);
    if(/pending|queue/i.test(String(json.result??""))) continue;
    if(!/pass|verified/i.test(String(json.result??""))) throw new Error(String(json.result??"Verification failed"));
    break;
  }
}
const v2=await fetch(`https://explorer.testnet.arc.io/api/v2/smart-contracts/${ADDRESS}`);
const state=await v2.json();
console.log("Final explorer state:",{verified:state.is_verified,partial:state.is_partially_verified});
if(!state.is_verified || state.is_partially_verified) throw new Error("Explorer did not report a full verification.");
