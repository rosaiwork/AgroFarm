import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';

export const useTonConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  // Отримання балансу гаманця
  const getBalance = useCallback(async () => {
    if (!wallet) return;
    
    try {
      setIsLoading(true);
      // Тут можна додати запит до TON API для отримання балансу
      // Поки що використовуємо заглушку
      setBalance('0');
    } catch (error) {
      console.error('Помилка отримання балансу:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // Підключення гаманця
  const connectWallet = useCallback(async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Помилка підключення гаманця:', error);
      throw error;
    }
  }, [tonConnectUI]);

  // Відключення гаманця
  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Помилка відключення гаманця:', error);
      throw error;
    }
  }, [tonConnectUI]);

  // Відправка транзакції
  const sendTransaction = useCallback(async (
    to: string,
    amount: string,
    message?: string
  ) => {
    if (!wallet) {
      throw new Error('Гаманець не підключено');
    }

    try {
      setIsLoading(true);
      
      // Конвертуємо TON в nano TON (1 TON = 10^9 nano TON)
      const nanoAmount = Math.floor(parseFloat(amount) * 1_000_000_000).toString();
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд
        messages: [
          {
            address: to,
            amount: nanoAmount,
            payload: message || ''
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Помилка відправки транзакції:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, tonConnectUI]);

  // Скорочення адреси для відображення
  const shortenAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Конвертація з nano TON
  const fromNanoTon = useCallback((amount: string | number) => {
    try {
      const nanoAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return (nanoAmount / 1_000_000_000).toString();
    } catch (error) {
      return '0';
    }
  }, []);

  // Конвертація в nano TON
  const toNanoTon = useCallback((amount: string | number) => {
    try {
      const tonAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return Math.floor(tonAmount * 1_000_000_000);
    } catch (error) {
      return 0;
    }
  }, []);

  useEffect(() => {
    if (wallet) {
      getBalance();
    }
  }, [wallet, getBalance]);

  return {
    // Стан
    wallet,
    balance,
    isLoading,
    isConnected: !!wallet,
    
    // Методи
    connectWallet,
    disconnectWallet,
    sendTransaction,
    getBalance,
    
    // Утиліти
    shortenAddress,
    fromNanoTon,
    toNanoTon,
    
    // Адреса гаманця
    address: wallet?.account?.address || '',
    shortAddress: wallet?.account?.address ? shortenAddress(wallet.account.address) : ''
  };
}; 