import { useState, useEffect } from 'react';
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

  const fetchBalances = async () => {
    if (!tonConnectUI.account) {
      setBalances({ ton: 0, ruble: 0, loading: false, error: null });
      return;
    }

    try {
      setBalances(prev => ({ ...prev, loading: true, error: null }));

      const walletAddress = tonConnectUI.account.address;
      
      // Получаем баланс TON
      const tonBalance = await fetchTonBalance(walletAddress);
      
      // Получаем баланс RUBLE (Jetton)
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
  };

  // Получение баланса TON
  const fetchTonBalance = async (address) => {
    try {
      const url = new URL('https://toncenter.com/api/v2/getAddressBalance');
      url.searchParams.append('address', address);
      
      const tonResponse = await fetch(url);
      const tonData = await tonResponse.json();
      
      if (tonData.ok) {
        // Конвертируем из nanotons в TON (1 TON = 10^9 nanotons)
        return parseFloat(tonData.result) / 1000000000;
      }
      return 0;
    } catch (error) {
      console.error('Failed to fetch TON balance:', error);
      return 0;
    }
  };

  // Получение баланса Jetton
  const fetchJettonBalance = async (address, jettonMaster) => {
    try {
      // Сначала получаем адрес Jetton Wallet
      const walletUrl = new URL('https://toncenter.com/api/v2/getJettonWalletAddress');
      walletUrl.searchParams.append('owner_address', address);
      walletUrl.searchParams.append('jetton_master', jettonMaster);
      
      const walletResponse = await fetch(walletUrl);
      const walletData = await walletResponse.json();
      
      if (!walletData.ok || !walletData.result) {
        return 0;
      }
      
      const jettonWalletAddress = walletData.result;
      
      // Теперь получаем баланс Jetton Wallet
      const balanceUrl = new URL('https://toncenter.com/api/v2/getAddressBalance');
      balanceUrl.searchParams.append('address', jettonWalletAddress);
      
      const balanceResponse = await fetch(balanceUrl);
      const balanceData = await balanceResponse.json();
      
      if (balanceData.ok && balanceData.result) {
        // Конвертируем из jetton units в обычные единицы
        // RUBLE Jetton имеет 9 знаков после запятой
        return parseFloat(balanceData.result) / 1000000000;
      }
      return 0;
    } catch (error) {
      console.error('Failed to fetch Jetton balance:', error);
      return 0;
    }
  };

  // Обновляем балансы при изменении кошелька
  useEffect(() => {
    fetchBalances();
  }, [tonConnectUI.account?.address]);

  // Автоматическое обновление балансов каждые 30 секунд
  useEffect(() => {
    if (!tonConnectUI.account) return;

    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [tonConnectUI.account?.address]);

  return {
    ...balances,
    refetch: fetchBalances
  };
};