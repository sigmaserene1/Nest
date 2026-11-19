import { expect, test } from "bun:test";
import { assertExecutableQuote, assertLifiDelivery } from "./lifi.ts";
const hash = `0x${"a".repeat(64)}`;
test("a refunded bridge is not a successful delivery", () => {
  expect(() => assertLifiDelivery({ status: "DONE", substatus: "REFUNDED", receiving: { txHash: hash } })).toThrow();
});
test("partial delivery is not successful", () => {
  expect(() => assertLifiDelivery({ status: "DONE", substatus: "PARTIAL", receiving: { txHash: hash } })).toThrow();
});
test("completion requires destination transaction evidence", () => {
  expect(() => assertLifiDelivery({ status: "DONE", substatus: "COMPLETED" })).toThrow();
  expect(() => assertLifiDelivery({ status: "DONE", substatus: "COMPLETED", receiving: { txHash: hash } })).not.toThrow();
});
test("a Testnet quote cannot execute a Mainnet request", () => {
  const token = "0x3600000000000000000000000000000000000000";
  const quote = { transactionRequest: { to: token, data: "0x1234", chainId: 5042002 }, action: { fromChainId: 5042002, toChainId: 84532, fromAmount: "1000000", fromToken: { address: token, chainId: 5042002 }, toToken: { address: token, chainId: 84532 } } };
  expect(() => assertExecutableQuote(quote, { fromChain: 5042, toChain: 8453, fromToken: token, toToken: token, fromAmount: "1000000", fromAddress: token, toAddress: token })).toThrow("does not match");
});