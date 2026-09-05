import solc from 'solc';
import fs from 'node:fs';

const source = fs.readFileSync('contracts/ExpenseManagerOriginal.sol', 'utf8');

const rpcRes = await fetch('https://rpc.testnet.arc.network', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'eth_getCode',
    params: ['0x709cbAd88162b999882788155cde79aDe46A6D42', 'latest']
  })
});
const { result } = await rpcRes.json();
const onchain = result.slice(2).toLowerCase();
console.log('Onchain bytecode length:', onchain.length / 2, 'bytes');

const stripMeta = (c) => c.replace(/a264697065735822[0-9a-f]{64}64736f6c6343[0-9a-f]{6}0033$/, '');

const metadataHashes = ['ipfs', 'bzzr1', 'none'];
const evmVersions = ['paris', 'shanghai', 'cancun', 'default'];
const optimizerRuns = [0, 1, 200, 1000, 10000, 999999];
const optimizerEnabled = [true, false];

for (const optEnabled of optimizerEnabled) {
  for (const runs of optimizerRuns) {
    if (!optEnabled && runs > 0) continue;
    for (const meta of metadataHashes) {
      for (const evm of evmVersions) {€ЫЫњЭX™[H	ЫЬ‰И
ИЬ[X›Y
И	Иќ[њО‰И
Иќ[њИ
И	ИY]N‰И
ИY]H
И	И]›N‰И
И]›NВ€ћHВ€ЫЫњЭ[њ]HВ€[™ЭXYЩN€	ФЫЫY]IЛ€ЫЭ\Щ\О€И	ШЫЫќXЭЛС^[њЩSX[YЩ\“ЬљYЪ[[њЫЫ	О€ИЫЫќ[ќ€ЫЭ\ЩHHK€Щ][™ЬО€В€Ь[Z^™\Ћ€И[X›Y€Ь[X›Yќ[њИK€Y]Y]N€Ић]XЫЩR\Ъ€Y]HK€Э]]Щ[XЭ[ЫЋ€И	К‰О€И	К‰О€ЙЩ]›K™\ЮYYћ]XЫЩIЧHHB€B€NВ€Y€
]›HOOH	ЩY][	КH[њ]њЩ][™ЬЛ™]›U™\њЪ[Ы€H]›NВ‚€ЫЫњЭЭ]H”УУ‹њ\њЩJЫЫЛЫЫ\[J”УУ‹њЭљ[™ЪYћJ[њ]
JJNВ€ЫЫњЭ\ќYXЭHЭ]ЫЫќXЭПЛ–ЙШЫЫќXЭЛС^[њЩSX[YЩ\“ЬљYЪ[[њЫЫ	ЧOЛ‘^[њЩSX[YЩ\ЋВ€Y€
X\ќYXЭ
HЫЫќ[ќYNВ€ЫЫњЭЫЩHH\ќYXЭ™]›K™\ЮYYћ]XЫЩK›Шљ™XЭќУЭЩ\ђШ\ЩJ
Kњ™\XЩJЧЊЛ	ЙКNВ‚€Y€
ЫЩHOOHЫЪZ[ЉHВ€ЫЫњЫЫK›ЩК	С•SPUТ‰ЛX™[
NВ€њЛќЬљ]Qљ[TЮ[К	Э™\љYљXШ][Ы‹ЭЪ[›љ[™ЛZ[њ]љњЫЫ‰Л”УУ‹њЭљ[™ЪYћJ[њ]ќ[ЉJNВ€ЫЫњЫЫK›ЩК	ФШ]™YИ™\љYљXШ][Ы‹ЭЪ[›љ[™ЛZ[њ]љњЫЫ‰КNВ€›ШЩ\ЬЛ™^]

NВ€B€Y€
Эљ\Y]JЫЩJHOOHЭљ\Y]JЫЪZ[ЉJHВ€ЫЫњЫЫK›ЩК	ФT•PS‰ЛX™[
NВ€B€HШ]Ъ
JHЯB€B€B€BџBЫЫњЫЫK›ЩК	У›Иќ[X]Ъ›Э[™	КNВ