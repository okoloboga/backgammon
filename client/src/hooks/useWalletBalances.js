import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';

// Jetton Master Contract для RUBLE
const RUBLE_JETTON_MASTER = 'EQA5QopV0455mb09Nz6iPL3JsX_guIGf77a6l-DtqSQh0aE-';

export const useWalletBalances = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [balances, setBalances] = useState({
    ton: 0,
    ruble: 0,
    loading: true,
    error: null
  });

  const fetchBalances = useCallback(async () => {
    if (!tonConnectUI.account) {
      setBalances({ ton: 0, ruble: 0, loading: false, error: null });
      return;
    }

    try {
      setBalances(prev => ({ ...prev, error: null }));

      const walletAddress = tonConnectUI.account.address;
      
      const tonBalance = await fetchTonBalance(walletAddress);
      const rubleBalance = await fetchJettonBalance(walletAddress, RUBLE_JETTON_MASTER);

      setBalances({
        ton: tonBalance,
        ruble: rubleBalance,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setBalances(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [tonConnectUI.account]);

  // Получение баланса TON
  const fetchTonBalance = async (address) => {
    try {
      const url = new URL('https://toncenter.com/api/v2/getAddressBalance');
      url.searchParams.append('address', address);
      
      const tonResponse = await fetch(url);
      const tonData = await tonResponse.json();
      
      if (tonData.ok) {
        return parseFloat(tonData.result) / 1000000000;
      }
      return 0;
    } catch (error) {
      console.error('Failed to fetch TON balance:', error);
      return 0;
    }
  };

  // Получение баланса Jetton через новый API v3
  const fetchJettonBalance = async (address, jettonMaster) => {
    try {
      const response = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${address}&jetton_address=${jettonMaster}`);
      if (!response.ok) return 0;

      const data = await response.json();
      if (!data.jetton_wallets || data.jetton_wallets.length === 0) return 0;

      const jettonWallet = data.jetton_wallets.find(wallet => wallet.jetton === jettonMaster || data.address_book[wallet.jetton]?.user_friendly === jettonMaster);
      if (!jettonWallet) return 0;

      const balanceNumber = parseInt(jettonWallet.balance, 10);
      return balanceNumber / 1000000000;
    } catch (error) {
      console.error('Error fetching jetton balance:', error);
      return 0;
    }
  };

  // Обновляем балансы при изменении кошелька
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Автоматическое обновление балансов каждые 30 секунд
  useEffect(() => {
    if (!tonConnectUI.account) return;

    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [tonConnectUI.account, fetchBalances]);

  return {
    ...balances,
    refetch: fetchBalances
  };
};
