import { useState, useEffect } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { TonClient, Address } from 'ton';
import { fromNano } from 'ton-core';
import { Buffer } from 'buffer';

// Polyfill for browser environment
window.Buffer = Buffer;

const JETTON_MINTER_ADDRESS = 'EQA5QopV0455mb09Nz6iPL3JsX_guIGf77a6l-DtqSQh0aE-';

// Create a single TonClient instance
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

export const useWalletBalances = () => {
  const wallet = useTonWallet();
  const [balanceTon, setBalanceTon] = useState(0);
  const [balanceRuble, setBalanceRuble] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet) {
        setBalanceTon(0);
        setBalanceRuble(0);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch TON balance
        const address = Address.parse(wallet.account.address);
        const tonBalance = await client.getBalance(address);
        setBalanceTon(Number(fromNano(tonBalance)));

        // Fetch Jetton (RUBLE) balance
        const minterAddress = Address.parse(JETTON_MINTER_ADDRESS);
        
        // 1. Get user's Jetton wallet address from the minter
        const result = await client.runMethod(minterAddress, 'get_wallet_address', [
          { type: 'slice', cell: new Address(address.workChain, address.hash).toCell() },
        ]);
        const jettonWalletAddress = result.stack.readAddress();

        // 2. Get Jetton data from the user's Jetton wallet
        const jettonData = await client.runMethod(
          jettonWalletAddress,
          'get_jetton_data'
        );
        
        const jettonBalance = jettonData.stack.readBigNumber();
        // Assuming the Jetton has 9 decimals, like TON
        setBalanceRuble(Number(fromNano(jettonBalance)));

      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setBalanceTon(0);
        setBalanceRuble(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [wallet]);

  return { balanceTon, balanceRuble, isLoading };
};
