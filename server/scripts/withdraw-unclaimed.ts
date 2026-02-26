import { mnemonicToPrivateKey } from '@ton/crypto';
import { beginCell, toNano } from '@ton/core';
import {
  Address,
  TonClient,
  WalletContractV4,
  WalletContractV5R1,
  internal,
} from '@ton/ton';

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parseArgs(): { gas: string } {
  const gasArg = process.argv.find((arg) => arg.startsWith('--gas='));
  const gas = gasArg ? gasArg.slice('--gas='.length) : '0.05';
  return { gas };
}

async function main() {
  const { gas } = parseArgs();

  const endpoint = getEnv(
    'TON_ENDPOINT',
    'https://toncenter.com/api/v2/jsonRPC',
  );
  const apiKey = process.env.TON_API_KEY;
  const mnemonic = getEnv('TON_ADMIN_MNEMONIC');
  const escrowAddress = getEnv('TON_ESCROW_ADDRESS');
  const walletVersion = (process.env.TON_ADMIN_WALLET_VERSION || 'v5').toLowerCase();

  const words = mnemonic.trim().split(/\s+/);
  if (words.length < 12) {
    throw new Error('TON_ADMIN_MNEMONIC looks invalid (too few words)');
  }

  const client = new TonClient({
    endpoint,
    apiKey,
  });

  const keyPair = await mnemonicToPrivateKey(words);
  const wallet =
    walletVersion === 'v4'
      ? WalletContractV4.create({
          workchain: 0,
          publicKey: keyPair.publicKey,
        })
      : WalletContractV5R1.create({
          workchain: 0,
          publicKey: keyPair.publicKey,
        });
  const walletContract = client.open(wallet);
  const seqno = await walletContract.getSeqno();

  // WithdrawUnclaimed opcode = 0x05
  const body = beginCell().storeUint(0x05, 32).endCell();

  console.log('Sending WithdrawUnclaimed...');
  console.log(`Escrow: ${Address.parse(escrowAddress).toString()}`);
  console.log(`Admin wallet: ${wallet.address.toString()}`);
  console.log(`Admin wallet version: ${walletVersion}`);
  console.log(`Seqno: ${seqno}`);
  console.log(`Gas: ${gas} TON`);

  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: Address.parse(escrowAddress),
        value: toNano(gas),
        body,
      }),
    ],
  });

  console.log('WithdrawUnclaimed transaction sent.');
  console.log('Note: withdrawn TON goes to feeWallet configured in the contract.');
}

main().catch((error) => {
  console.error('Withdraw failed:', error);
  process.exit(1);
});
