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
      // Не показываем loading при обновлении, чтобы избежать мигания
      setBalances(prev => ({ ...prev, error: null }));

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

    // Получение баланса Jetton через новый API v3
    const fetchJettonBalance = async (address, jettonMaster) => {
      try {
        console.log('Fetching Jetton balance for:', address, 'Jetton Master:', jettonMaster);
        
        // Используем новый API v3 для получения jetton wallets
        const response = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${address}&jetton_address=${jettonMaster}`);
        
        if (!response.ok) {
          console.log('API response not ok:', response.status, response.statusText);
          return 0;
        }

        const data = await response.json();
        console.log('Jetton wallets response:', data);

        if (!data.jetton_wallets || data.jetton_wallets.length === 0) {
          console.log('No jetton wallets found for this address');
          return 0;
        }

        // Находим нужный jetton wallet
        const jettonWallet = data.jetton_wallets.find(wallet => 
          wallet.jetton === jettonMaster || 
          wallet.jetton === data.address_book[jettonMaster]?.user_friendly
        );

        if (!jettonWallet) {
          console.log('No matching jetton wallet found');
          return 0;
        }

        console.log('Found jetton wallet:', jettonWallet);
        
        // Конвертируем баланс в число (баланс в наименьших единицах)
        const balanceNumber = parseInt(jettonWallet.balance, 10);
        console.log('Raw balance:', balanceNumber);
        
        // Конвертируем из наименьших единиц (9 знаков после запятой)
        // 2867067708489971521 / 1000000000 = 2867067708.489971521
        const convertedBalance = balanceNumber / 1000000000;
        console.log('Converted balance:', convertedBalance);
        
        return convertedBalance;
      } catch (error) {
        console.error('Error fetching jetton balance:', error);
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