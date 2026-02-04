import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';

export const useWalletBalances = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [balances, setBalances] = useState({
    ton: 0,
    loading: true,
    error: null
  });

  const fetchBalances = useCallback(async () => {
    if (!tonConnectUI.account) {
      setBalances({ ton: 0, loading: false, error: null });
      return;
    }

    try {
      setBalances(prev => ({ ...prev, error: null }));

      const walletAddress = tonConnectUI.account.address;

      const tonBalance = await fetchTonBalance(walletAddress);

      setBalances({
        ton: tonBalance,
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
