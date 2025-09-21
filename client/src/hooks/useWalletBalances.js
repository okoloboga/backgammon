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
        console.log('Fetching Jetton balance for:', address, 'Jetton Master:', jettonMaster);
        
        // Шаг 1: Получаем адрес Jetton Wallet через runGetMethod
        const walletResponse = await fetch('https://toncenter.com/api/v2/jsonRPC', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'runGetMethod',
            params: {
              address: jettonMaster,
              method: 'get_wallet_address',
              stack: [
                ['tvm.Slice', address]
              ]
            }
          })
        });

        const walletData = await walletResponse.json();
        console.log('Wallet response:', walletData);
        
        if (!walletData.result || !walletData.result.stack || walletData.result.stack.length === 0) {
          console.log('No Jetton wallet found for this user');
          return 0;
        }
        
        const jettonWalletAddress = walletData.result.stack[0][1];
        console.log('Jetton wallet address:', jettonWalletAddress);
        
        // Шаг 2: Получаем баланс Jetton Wallet через runGetMethod
        const balanceResponse = await fetch('https://toncenter.com/api/v2/jsonRPC', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'runGetMethod',
            params: {
              address: jettonWalletAddress,
              method: 'get_wallet_data',
              stack: []
            }
          })
        });

        const balanceData = await balanceResponse.json();
        console.log('Balance response:', balanceData);
        
        if (balanceData.result && balanceData.result.stack && balanceData.result.stack.length >= 4) {
          // get_wallet_data возвращает: (balance, owner_address, jetton_master_address, jetton_wallet_code)
          const balance = balanceData.result.stack[0][1];
          console.log('Raw balance:', balance);
          // Конвертируем из наименьших единиц (9 знаков после запятой)
          const convertedBalance = parseFloat(balance) / 1000000000;
          console.log('Converted balance:', convertedBalance);
          return convertedBalance;
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