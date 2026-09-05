#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  address: '0x709cbAd88162b999882788155cde79aDe46A6D42',
  contractName: 'ExpenseManager',
  sourcePath: 'contracts/ExpenseManagerOriginal.sol',
  compilerVersion: 'v0.8.28+commit.7893614a',
  license: 'mit',
  constructorArgs: '0000000000000000000000003600000000000000000000000000000000000000',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerApi: 'https://testnet.arcscan.app/api',
};

const source = fs.readFileSync(path.join(ROOT, CONFIG.sourcePath), 'utf8');

// Try ALL combinations
const variants = [];
const metadataHashes = ['ipfs', 'bzzr1', 'none'];
const evmVersions = ['default', 'paris', 'shanghai', 'cancun'];
const optimizerRuns = [1, 200, 1000, 10000, 999999];

for (const metadataHash of metadataHashes) {
  for (const evmVersion of evmVersions) {
    for (const runs of optimizerRuns) {
      variants.push({ metadataHash, evmVersion, runs });
    }
  }
}

async function fetchOnchainRuntime() {
  const res = await fetch(CONFIG.rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getCode',
      params: [CONFIG.address, 'latest'],
    }),
  });
  const json = await res.json();
  return String(json.result).toLowerCase().replace(/^0x/, '');
}

function compile(input) {
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (out.errors ?? []).filter((e) => e.severity === 'error');
  if (fatal.length) throw new Error(fatal.map((e) => e.formattedMessage).join('\n'));
  const artifact = out.contracts?.[CONFIG.sourcePath]?.[CONFIG.contractName];
  if (!artifact) throw new Error(`${CONFIG.contractName} not found in compiler output`);
  return {
    code: artifact.evm.deployedBytecode.object.toLowerCase().replace(/^0x/, ''),
    metadata: artifact.metadata,
  };
}

function buildInput({ metadataHash, evmVersion, runs }) {
  const input = {
    language: 'Solidity',
    sources: { [CONFIG.sourcePath]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs },
      metadata: { bytecodeHash: metadataHash },
      outputSelection: {
        '*': { '*': ['abi', 'metadata', 'evm.bytecode', 'evm.deployedBytecode'] },
      },
    },
  };
  if (evmVersion !== 'default') input.settings.evmVersion = evmVersion;
  return input;
}

async function main() {
  const onchain = await fetchOnchainRuntime();
  console.log(`Onchain runtime: ${onchain.length / 2} bytes`);
  
  for (const variant of variants) {
    const label = `metadata:${variant.metadataHash} evm:${variant.evmVersion} runs:${variant.runs}`;
    try {
      const input = buildInput(variant);
      const { code, metadata } = compile(input);
      
      // Check if runtime bytecode matches (excluding metadata)
      const codeWithoutMetadata = code.replace(/a264697066735822[0-9a-f]{64}64736f6c6343[0-9a-f]{6}0033$/, '');
      const onchainWithoutMetadata = onchain.replace(/a264697066735822[0-9a-f]{64}64736f6c6343[0-9a-f]{6}0033$/, '');
      
      if (codeWithoutMetadata === onchainWithoutMetadata) {
        console.log(`\n✅ FULL MATCH FOUND: ${label}`);
        console.log(`Metadata: ${metadata}`);
        
        // Save the winning input
        const outFile = path.join(ROOT, 'verification', 'ExpenseManager-winning-input.json');
        fs.writeFileSync(outFile, JSON.stringify(input, null, 2));
        console.log(`\nSaved to: ${outFile}`);
        return;
      }
    } catch (e) {
      // Skip failed compilations
    }
  }
  
  console.log('\n❌ No full match found. The deployed bytecode was compiled with settings not in our list.');
}

main().catch(console.error);
