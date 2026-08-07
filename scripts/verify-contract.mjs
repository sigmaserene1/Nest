#!/usr/bin/env node
/**
 * Nest — ExpenseManager verification driver.
 *
 * Generates standard-JSON input variants, compiles each one locally with the
 * exact deploy compiler, compares the produced runtime bytecode against the
 * onchain code, and submits the matching variant to the Arcscan (Blockscout)
 * verification API. It keeps retrying variants until the explorer reports a
 * FULL match (or reports the contract is already fully verified).
 *
 * Usage:
 *   node scripts/verify-contract.mjs
 *   node scripts/verify-contract.mjs --dry-run      # compile + compare only
 *   node scripts/verify-contract.mjs --address 0x…  # override target
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import solc from 'solc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  address: '0x709cbAd88162b999882788155cde79aDe46A6D42',
  contractName: 'ExpenseManager',
  sourcePath: 'contracts/ExpenseManager.sol',
  compilerVersion: 'v0.8.28+commit.7893614a',
  license: 'mit',
  constructorArgs:
    '0000000000000000000000003600000000000000000000000000000000000000',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerApi: 'https://testnet.arcscan.app/api',
  outDir: 'verification',
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : (args[i + 1] ?? true);
};
if (flag('address')) CONFIG.address = String(flag('address'));
const DRY_RUN = args.includes('--dry-run');

/** Every settings combination worth trying, most likely first. */
const VARIANTS = [
  { label: 'ipfs-metadata / default evm', metadataHash: 'ipfs' },
  { label: 'ipfs-metadata / paris', metadataHash: 'ipfs', evmVersion: 'paris' },
  { label: 'ipfs-metadata / shanghai', metadataHash: 'ipfs', evmVersion: 'shanghai' },
  { label: 'ipfs-metadata / cancun', metadataHash: 'ipfs', evmVersion: 'cancun' },
  { label: 'bzzr1-metadata / default evm', metadataHash: 'bzzr1' },
  { label: 'no-metadata-hash / default evm', metadataHash: 'none' },
];

const source = fs.readFileSync(path.join(ROOT, CONFIG.sourcePath), 'utf8');

function buildInput({ metadataHash, evmVersion }) {
  const input = {
    language: 'Solidity',
    sources: { [CONFIG.sourcePath]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      metadata: { bytecodeHash: metadataHash, useLiteralContent: true },
      outputSelection: {
        '*': {
          '*': ['abi', 'metadata', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
    },
  };
  if (evmVersion) input.settings.evmVersion = evmVersion;
  return input;
}

function compile(input) {
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (out.errors ?? []).filter((e) => e.severity === 'error');
  if (fatal.length) throw new Error(fatal.map((e) => e.formattedMessage).join('\n'));
  const artifact = out.contracts?.[CONFIG.sourcePath]?.[CONFIG.contractName];
  if (!artifact) throw new Error(`${CONFIG.contractName} not found in compiler output`);
  return artifact.evm.deployedBytecode.object.toLowerCase().replace(/^0x/, '');
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
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  const code = String(json.result ?? '').toLowerCase().replace(/^0x/, '');
  if (!code || code === '') throw new Error('No code at address — wrong network or address?');
  return code;
}

/** Blockscout considers metadata-only differences a "partial" match. */
function classify(local, onchain) {
  if (local === onchain) return 'full';
  const trim = (s) => s.slice(0, Math.max(0, s.length - 106));
  if (trim(local) === trim(onchain) && local.length === onchain.length) return 'partial';
  return 'none';
}

async function submit(input) {
  const body = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    codeformat: 'solidity-standard-json-input',
    contractaddress: CONFIG.address,
    contractname: `${CONFIG.sourcePath}:${CONFIG.contractName}`,
    compilerversion: CONFIG.compilerVersion,
    sourceCode: JSON.stringify(input),
    constructorArguements: CONFIG.constructorArgs,
    licenseType: CONFIG.license,
  });
  const res = await fetch(CONFIG.explorerApi, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: '0', result: text.slice(0, 400) };
  }
}

async function pollStatus(guid, tries = 20) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const url = `${CONFIG.explorerApi}?module=contract&action=checkverifystatus&guid=${encodeURIComponent(guid)}`;
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    const result = String(json.result ?? '');
    console.log(`   status(${i + 1}/${tries}): ${result || 'pending'}`);
    if (/pending/i.test(result)) continue;
    return json;
  }
  return { status: '0', result: 'timed out waiting for explorer' };
}

async function isFullyVerified() {
  const url = `${CONFIG.explorerApi}/v2/smart-contracts/${CONFIG.address}`;
  const res = await fetch(url);
  if (!res.ok) return { verified: false, full: false };
  const json = await res.json().catch(() => ({}));
  const verified = Boolean(json.is_verified);
  const full = verified && json.is_partially_verified === false;
  return { verified, full, matchType: json.is_partially_verified ? 'partial' : verified ? 'full' : 'none' };
}

async function main() {
  console.log(`Target ${CONFIG.address} on Arc Testnet\n`);
  const onchain = await fetchOnchainRuntime();
  console.log(`Onchain runtime bytecode: ${onchain.length / 2} bytes\n`);

  fs.mkdirSync(path.join(ROOT, CONFIG.outDir), { recursive: true });

  const ranked = [];
  for (const variant of VARIANTS) {
    process.stdout.write(`Compiling ${variant.label}… `);
    const input = buildInput(variant);
    let match = 'none';
    try {
      match = classify(compile(input), onchain);
    } catch (err) {
      console.log(`compile failed: ${err.message.split('\n')[0]}`);
      continue;
    }
    console.log(match === 'full' ? 'FULL match' : match === 'partial' ? 'partial match' : 'no match');
    ranked.push({ variant, input, match });
    if (match === 'full') break;
  }

  ranked.sort((a, b) => ({ full: 0, partial: 1, none: 2 })[a.match] - ({ full: 0, partial: 1, none: 2 })[b.match]);
  const best = ranked[0];
  if (!best || best.match === 'none') {
    console.error('\nNo variant reproduces the onchain bytecode. The deployed source differs.');
    process.exit(1);
  }

  const outFile = path.join(ROOT, CONFIG.outDir, 'ExpenseManager-standard-input.json');
  fs.writeFileSync(outFile, `${JSON.stringify(best.input, null, 2)}\n`);
  console.log(`\nBest variant: ${best.variant.label} (${best.match})`);
  console.log(`Wrote ${path.relative(ROOT, outFile)}`);

  if (DRY_RUN) return;

  const already = await isFullyVerified();
  if (already.full) {
    console.log('\nExplorer already reports a FULL match. Nothing to do.');
    return;
  }

  for (const candidate of ranked.filter((r) => r.match !== 'none')) {
    console.log(`\nSubmitting ${candidate.variant.label}…`);
    const submitted = await submit(candidate.input);
    console.log(`   response: ${submitted.result ?? submitted.message}`);
    if (submitted.status === '1' && submitted.result) await pollStatus(String(submitted.result));

    const state = await isFullyVerified();
    console.log(`   explorer match type: ${state.matchType}`);
    if (state.full) {
      console.log('\nFULL match achieved.');
      return;
    }
  }

  console.error(
    '\nStill only a partial match. The deployed metadata hash points at source bytes that differ ' +
      'from contracts/ExpenseManager.sol — redeploy from this exact file for a full match.',
  );
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
