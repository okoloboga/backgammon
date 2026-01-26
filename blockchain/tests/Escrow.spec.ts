import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Escrow, JettonPayload } from '../build/Escrow/Escrow_Escrow';
import '@ton/test-utils';

describe('Escrow', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let escrow: SandboxContract<Escrow>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        escrow = blockchain.openContract(
            await Escrow.fromInit(deployer.address, deployer.address)
        );
    });

    it('should deploy contract', async () => {
        // Проверка сделана в beforeEach
    });

    // ---------------- TON tests ----------------
    it('should create a TON game', async () => {
        const user1 = await blockchain.treasury('user1');

        const createResult = await escrow.send(
            user1.getSender(),
            { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        expect(createResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: true,
        });
    });

    it('should allow another user to join TON game', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');

        await escrow.send(user1.getSender(), { value: toNano('2') }, 
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        const joinResult = await escrow.send(
            user2.getSender(),
            { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: user2.address,
            to: escrow.address,
            success: true,
        });
    });

    it('creator cannot cancel TON game before timeout', async () => {
        const user1 = await blockchain.treasury('user1');
    
        // Создаём игру
        await escrow.send(user1.getSender(), { value: toNano('2') }, 
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
    
        // Устанавливаем текущее время +30 минут
        const current = blockchain.now ?? Math.floor(Date.now() / 1000);
        blockchain.now = current + 1800;
    
        // Пытаемся отменить игру
        const cancelResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.01') },
            { $$type: 'CancelGame', gameId: 1n }
        );
    
        // Проверяем, что транзакция не была успешной
        expect(cancelResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: false,
        });
    });
    
    
    it('creator can cancel TON game after timeout', async () => {
        const user1 = await blockchain.treasury('user1');
    
        // Создаём игру
        await escrow.send(user1.getSender(), { value: toNano('2') }, 
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
    
        // Устанавливаем текущее время +2 часа
        const current = blockchain.now ?? Math.floor(Date.now() / 1000);
        blockchain.now = current + 7200;
    
        // Отменяем игру
        const cancelResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.01') },
            { $$type: 'CancelGame', gameId: 1n }
        );
    
        // Проверяем, что транзакция прошла успешно
        expect(cancelResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: true,
        });
    });
    
    

    it('admin can report winner and payout TON', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');
        const admin = deployer;

        await escrow.send(user1.getSender(), { value: toNano('2') }, 
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        await escrow.send(user2.getSender(), { value: toNano('1') }, 
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        const reportResult = await escrow.send(admin.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );

        expect(reportResult.transactions).toHaveTransaction({
            from: escrow.address,
            to: user2.address,
            success: true,
        });
    });

    // ---------------- Jetton tests ----------------
    it('should create a Jetton game', async () => {
        const user1 = await blockchain.treasury('user1');
        const jettonMaster = await blockchain.treasury('jettonMaster');

        const payload0: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };

        const jettonCreateResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') }, 
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload0, jettonMaster: jettonMaster.address }
        );

        expect(jettonCreateResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: true,
        });
    });

    it('another user can join Jetton game', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');
        const jettonMaster = await blockchain.treasury('jettonMaster');

        const payload1: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };
        await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') },
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload1, jettonMaster: jettonMaster.address }
        );

        const payload2: JettonPayload = { $$type: 'JettonPayload', action: 1n, gameId: 1n };
        const joinResult = await escrow.send(
            user2.getSender(),
            { value: toNano('0.1') },
            { $$type: 'OnJettonTransfer', sender: user2.address, amount: toNano('10'), payload: payload2, jettonMaster: jettonMaster.address }
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: user2.address,
            to: escrow.address,
            success: true,
        });
    });

    it('winner can claim Jetton', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');
        const jettonMaster = await blockchain.treasury('jettonMaster');
        const admin = deployer;
    
        // Создаём игру Jetton
        const payload1: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };
        await escrow.send(user1.getSender(), { value: toNano('0.1') }, 
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload1, jettonMaster: jettonMaster.address }
        );
    
        // Присоединяется второй игрок
        const payload2: JettonPayload = { $$type: 'JettonPayload', action: 1n, gameId: 1n };
        await escrow.send(user2.getSender(), { value: toNano('0.1') }, 
            { $$type: 'OnJettonTransfer', sender: user2.address, amount: toNano('10'), payload: payload2, jettonMaster: jettonMaster.address }
        );
    
        // Админ объявляет победителя
        await escrow.send(admin.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );
    
        // Победитель забирает Jetton
        const claimResult = await escrow.send(user2.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ClaimJetton', gameId: 1n }
        );
    
        // Проверяем, что исходящее сообщение дошло до Jetton контракта
        expect(claimResult.transactions).toHaveTransaction({
            from: escrow.address,
            to: jettonMaster.address,
            success: true,
        });
    });
    
    it('cannot claim Jetton twice', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');
        const jettonMaster = await blockchain.treasury('jettonMaster');
        const admin = deployer;
    
        // Create и join game
        const payload1: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };
        await escrow.send(user1.getSender(), { value: toNano('0.1') }, 
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload1, jettonMaster: jettonMaster.address }
        );
    
        const payload2: JettonPayload = { $$type: 'JettonPayload', action: 1n, gameId: 1n };
        await escrow.send(user2.getSender(), { value: toNano('0.1') }, 
            { $$type: 'OnJettonTransfer', sender: user2.address, amount: toNano('10'), payload: payload2, jettonMaster: jettonMaster.address }
        );
    
        // Admin reports winner
        await escrow.send(admin.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );
    
        // First claim
        await escrow.send(user2.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ClaimJetton', gameId: 1n }
        );
    
        // Second claim должна провалиться
        const secondClaim = await escrow.send(user2.getSender(), { value: toNano('0.01') }, 
            { $$type: 'ClaimJetton', gameId: 1n }
        );
    
        // Проверяем, что транзакция не прошла
        expect(secondClaim.transactions).toHaveTransaction({
            from: user2.address,
            to: escrow.address,
            success: false,
        });
    });
    // ---------------- Additional edge / admin / multi-game tests ----------------

    it('cannot join non-existent TON game', async () => {
        const user = await blockchain.treasury('attacker');

        const res = await escrow.send(
            user.getSender(),
            { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 999n } // нет такой игры
        );

        // транзакция должна провалиться (user -> escrow, success: false)
        expect(res.transactions).toHaveTransaction({
            from: user.address,
            to: escrow.address,
            success: false,
        });
    });

    it('creator cannot join own TON game', async () => {
        const user = await blockchain.treasury('host');

        // создаём игру
        await escrow.send(user.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        // тот же создатель пытается join
        const res = await escrow.send(
            user.getSender(),
            { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        expect(res.transactions).toHaveTransaction({
            from: user.address,
            to: escrow.address,
            success: false,
        });
    });

    it('non-admin cannot call ReportWinner', async () => {
        const user1 = await blockchain.treasury('user1');
        const user2 = await blockchain.treasury('user2');

        // подготовка: create + join
        await escrow.send(user1.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
        await escrow.send(user2.getSender(), { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        // обычный пользователь пытается объявить победителя
        const res = await escrow.send(
            user1.getSender(),
            { value: toNano('0.01') },
            { $$type: 'ReportWinner', gameId: 1n, winner: user1.address }
        );

        // должно провалиться (не admin)
        expect(res.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: false,
        });
    });

    it('admin cannot report winner twice for same game', async () => {
        const user1 = await blockchain.treasury('u1');
        const user2 = await blockchain.treasury('u2');
        const admin = deployer;

        // create + join
        await escrow.send(user1.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
        await escrow.send(user2.getSender(), { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        // first report -> ok
        const first = await escrow.send(admin.getSender(), { value: toNano('0.01') },
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );
        expect(first.transactions).toHaveTransaction({
            from: escrow.address,
            to: user2.address,
            success: true,
        });

        // second report -> should fail (already finished)
        const second = await escrow.send(admin.getSender(), { value: toNano('0.01') },
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );
        expect(second.transactions).toHaveTransaction({
            from: admin.address,
            to: escrow.address,
            success: false,
        });
    });

    it('TON payout sends fee to deployer (default feeWallet)', async () => {
        const user1 = await blockchain.treasury('u1');
        const user2 = await blockchain.treasury('u2');
        const admin = deployer;

        // Создаём игру
        await escrow.send(user1.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        // Второй игрок заходит
        await escrow.send(user2.getSender(), { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        // Админ репортит победителя
        const reportRes = await escrow.send(admin.getSender(), { value: toNano('0.05') },
            { $$type: 'ReportWinner', gameId: 1n, winner: user2.address }
        );

        // Проверяем выплату победителю
        expect(reportRes.transactions).toHaveTransaction({
            from: escrow.address,
            to: user2.address,
            success: true,
        });

        // Проверяем, что комиссия ушла на feeWallet (по умолчанию deployer)
        expect(reportRes.transactions).toHaveTransaction({
            from: escrow.address,
            to: deployer.address,
            success: true,
        });
    });


    it('supports multiple simultaneous games and keeps IDs isolated', async () => {
        const a1 = await blockchain.treasury('a1');
        const a2 = await blockchain.treasury('a2');
        const b1 = await blockchain.treasury('b1');
        const b2 = await blockchain.treasury('b2');
        const admin = deployer;

        // --- Игра A ---
        await escrow.send(a1.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
        await escrow.send(a2.getSender(), { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 1n }
        );

        // --- Игра B ---
        await escrow.send(b1.getSender(), { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );
        await escrow.send(b2.getSender(), { value: toNano('1') },
            { $$type: 'JoinGameTon', gameId: 2n }
        );

        // --- Репортим победителей ---
        const r1 = await escrow.send(admin.getSender(), { value: toNano('0.05') },
            { $$type: 'ReportWinner', gameId: 1n, winner: a2.address }
        );

        const r2 = await escrow.send(admin.getSender(), { value: toNano('0.05') },
            { $$type: 'ReportWinner', gameId: 2n, winner: b1.address }
        );

        // --- Проверяем выплаты ---
        expect(r1.transactions).toHaveTransaction({
            from: escrow.address,
            to: a2.address,
            success: true,
        });

        expect(r2.transactions).toHaveTransaction({
            from: escrow.address,
            to: b1.address,
            success: true,
        });
    });

    it('invalid Jetton payload action should be rejected', async () => {
        const user = await blockchain.treasury('jay');
        const jm = await blockchain.treasury('jm');

        // action 99 is invalid — контракт должен отклонить
        const badPayload: JettonPayload = { $$type: 'JettonPayload', action: 99n, gameId: 0n };

        const res = await escrow.send(user.getSender(), { value: toNano('0.05') },
            { $$type: 'OnJettonTransfer', sender: user.address, amount: toNano('10'), payload: badPayload, jettonMaster: jm.address }
        );

        expect(res.transactions).toHaveTransaction({
            from: user.address,
            to: escrow.address,
            success: false,
        });
    });
// ---------------- Jetton cancel and WithdrawUnclaimed tests ----------------

    it('creator can cancel Jetton game after timeout and get refund', async () => {
        const user1 = await blockchain.treasury('user1');
        const jettonMaster = await blockchain.treasury('jettonMaster');

        // Создаём Jetton игру
        const payload0: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };
        await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') },
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload0, jettonMaster: jettonMaster.address }
        );

        // Устанавливаем время +2 часа (timeout = 1 час)
        const current = blockchain.now ?? Math.floor(Date.now() / 1000);
        blockchain.now = current + 7200;

        // Отменяем игру
        const cancelResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') },
            { $$type: 'CancelGame', gameId: 1n }
        );

        // Проверяем что транзакция прошла успешно
        expect(cancelResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: true,
        });

        // Проверяем что отправлено сообщение на jettonMaster для возврата токенов
        expect(cancelResult.transactions).toHaveTransaction({
            from: escrow.address,
            to: jettonMaster.address,
            success: true,
        });
    });

    it('creator cannot cancel Jetton game before timeout', async () => {
        const user1 = await blockchain.treasury('user1');
        const jettonMaster = await blockchain.treasury('jettonMaster');

        // Создаём Jetton игру
        const payload0: JettonPayload = { $$type: 'JettonPayload', action: 0n, gameId: 0n };
        await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') },
            { $$type: 'OnJettonTransfer', sender: user1.address, amount: toNano('10'), payload: payload0, jettonMaster: jettonMaster.address }
        );

        // Устанавливаем время +30 минут (timeout = 1 час, ещё не прошёл)
        const current = blockchain.now ?? Math.floor(Date.now() / 1000);
        blockchain.now = current + 1800;

        // Пытаемся отменить игру
        const cancelResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.1') },
            { $$type: 'CancelGame', gameId: 1n }
        );

        // Должно провалиться
        expect(cancelResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: false,
        });
    });

    it('admin can withdraw unclaimed TON', async () => {
        const user1 = await blockchain.treasury('user1');
        const admin = deployer;

        // Создаём TON игру (депозит 1 TON)
        await escrow.send(
            user1.getSender(),
            { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        // Админ выводит unclaimed средства
        const withdrawResult = await escrow.send(
            admin.getSender(),
            { value: toNano('0.05') },
            { $$type: 'WithdrawUnclaimed' }
        );

        // Проверяем что транзакция прошла
        expect(withdrawResult.transactions).toHaveTransaction({
            from: admin.address,
            to: escrow.address,
            success: true,
        });

        // Проверяем что средства отправлены на feeWallet (deployer)
        expect(withdrawResult.transactions).toHaveTransaction({
            from: escrow.address,
            to: deployer.address,
            success: true,
        });
    });

    it('non-admin cannot withdraw unclaimed TON', async () => {
        const user1 = await blockchain.treasury('user1');

        // Создаём TON игру
        await escrow.send(
            user1.getSender(),
            { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 3600n }
        );

        // Обычный пользователь пытается вывести средства
        const withdrawResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.05') },
            { $$type: 'WithdrawUnclaimed' }
        );

        // Должно провалиться
        expect(withdrawResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: false,
        });
    });

    it('custom joinTimeout is respected for TON game', async () => {
        const user1 = await blockchain.treasury('user1');

        // Создаём игру с коротким timeout (600 сек = 10 минут)
        await escrow.send(
            user1.getSender(),
            { value: toNano('2') },
            { $$type: 'CreateGameTon', amount: toNano('1'), joinTimeout: 600n }
        );

        // Устанавливаем время +15 минут (больше 10 минут)
        const current = blockchain.now ?? Math.floor(Date.now() / 1000);
        blockchain.now = current + 900;

        // Отменяем игру - должно работать т.к. прошло больше 10 минут
        const cancelResult = await escrow.send(
            user1.getSender(),
            { value: toNano('0.01') },
            { $$type: 'CancelGame', gameId: 1n }
        );

        expect(cancelResult.transactions).toHaveTransaction({
            from: user1.address,
            to: escrow.address,
            success: true,
        });
    });

// ---------------- end of additional tests ----------------
});
