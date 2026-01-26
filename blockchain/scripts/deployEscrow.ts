import { toNano, Address } from '@ton/core';
import { Escrow } from '../build/Escrow/Escrow_Escrow';
import { NetworkProvider } from '@ton/blueprint';

// ============================================================
// КОНФИГУРАЦИЯ ДЕПЛОЯ - ЗАПОЛНИ ПЕРЕД ЗАПУСКОМ
// ============================================================

// Адрес админа - может вызывать ReportWinner и WithdrawUnclaimed
// Обычно это адрес backend-сервера или multi-sig кошелька
const ADMIN_ADDRESS = 'UQC-c-cDcjH9bHsKGBtJjd_g5C-snSFYI8S4rHeaaKkdHI87';

// Адрес для получения комиссий (5% от TON игр)
// Может быть тот же что и админ, или отдельный кошелёк
const FEE_WALLET_ADDRESS = 'UQCoJsABD4mA6mG9fQNlo7TwZ0D9tgYKqE427He_kY4WGRaJ';

// ============================================================

export async function run(provider: NetworkProvider) {
    // Валидация адресов
    if (ADMIN_ADDRESS.startsWith('UQXX') || FEE_WALLET_ADDRESS.startsWith('UQXX')) {
        throw new Error('Заполни ADMIN_ADDRESS и FEE_WALLET_ADDRESS перед деплоем!');
    }

    const adminAddr = Address.parse(ADMIN_ADDRESS);
    const feeWalletAddr = Address.parse(FEE_WALLET_ADDRESS);

    console.log('Deploying Escrow contract...');
    console.log('Admin address:', adminAddr.toString());
    console.log('Fee wallet address:', feeWalletAddr.toString());

    const escrow = provider.open(await Escrow.fromInit(adminAddr, feeWalletAddr));

    await escrow.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        { $$type: 'Deploy', queryId: 0n },
    );

    await provider.waitForDeploy(escrow.address);

    console.log('Escrow deployed at:', escrow.address.toString());
}
