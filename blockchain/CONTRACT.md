# Escrow Smart Contract (TON + Jetton)

## 1. Structures

### Game

Stores information about each game:

```text
struct Game {
  id: uint64;           // unique game ID
  creator: Address;     // creator's address
  joiner: Address?;     // address of the player who joined
  jettonMaster: Address?; // null = TON, otherwise Jetton token address
  amount: coins;        // stake (TON or token)
  state: Int;           // 0=Waiting, 1=InProgress, 2=Finished, 3=Cancelled
  createdAt: uint32;    // creation timestamp
  joinedAt: uint32?;    // timestamp when the second player joined
  winner: Address?;     // winner's address
  claimed: Bool;        // for Jetton pull-model
  joinTimeout: uint32;  // timeout in seconds for waiting for second player
}
```

### JettonPayload

Used for deserializing the payload in `OnJettonTransfer`:

```text
struct JettonPayload {
  action: uint8;        // 0 = create, 1 = join
  gameId: uint64;       // game ID (for join)
}
```

---

## 2. Messages

| Opcode     | Message           | Description                                                                                      |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| 0x01       | CreateGameTon     | Create a TON game. Parameters: `amount`, `joinTimeout`                                           |
| 0x02       | JoinGameTon       | Join an existing TON game. Parameter: `gameId`                                                   |
| 0x03       | CancelGame        | Cancel a waiting game after timeout. Parameter: `gameId`. Works for TON and Jetton games         |
| 0x04       | ReportWinner      | Admin reports the winner. Parameters: `gameId`, `winner`                                         |
| 0x05       | WithdrawUnclaimed | Admin withdraws remaining TON from the contract                                                  |
| 0x10       | OnJettonTransfer  | Callback for incoming Jetton payments. Parameters: `sender`, `amount`, `payload`, `jettonMaster` |
| 0x11       | ClaimJetton       | Pull-model claim for Jetton payout. Parameter: `gameId`                                          |
| 0x946a98b6 | Deploy            | Standard deploy message (from Deployable trait). Parameter: `queryId`                            |

---

## 3. Game State Constants

```text
STATE_WAITING: 0
STATE_INPROGRESS: 1
STATE_FINISHED: 2
STATE_CANCELLED: 3
```

---

## 4. Core Functions

### 4.1 CreateGameTon

* Creates a TON-based game.
* Checks `msg.value >= amount` and `amount >= minTon`.
* Generates `gameId` and stores the game in `games`.
* Returns excess funds to the sender.

### 4.2 JoinGameTon

* Joins an existing TON game.
* Checks that the game is in `Waiting` state and the sender is not the creator.
* Updates `state = InProgress` and `joinedAt = now()`.
* Returns excess funds to the sender.

### 4.3 CancelGame

* Creator can cancel a waiting game if no player has joined and the `joinTimeout` passed.
* Uses the `joinTimeout` value stored in the game (custom per game, default 3600s).
* Sets `state = Cancelled`.
* Refunds the creator:
  * **TON games**: sends TON back to creator.
  * **Jetton games**: sends Jetton transfer back to creator via `jettonMaster`.

### 4.4 ReportWinner

* Only admin can call.
* Checks `state = InProgress` and winner is one of the players.
* Sets `state = Finished`.
* TON payout: 5% fee to `feeWallet`, remaining to the winner.
* For Jetton games: marks `state = Finished` and `claimed = false` (pull-model).

### 4.5 OnJettonTransfer

* Handles incoming Jetton payments.
* `payload.action == 0` → create a Jetton game.
* `payload.action == 1` → join an existing game.
* Stores the game in `games`.
* `amount` is in tokens, `jettonMaster` is recorded.

### 4.6 ClaimJetton

* Pull-model payout for Jetton.
* Checks: `state = Finished`, `sender = winner`, `claimed = false`.
* Marks `claimed = true`.
* Calls transfer on the `jettonMaster` contract with proper selector and parameters:

  * `to = winner`
  * `amount = 2 * stake`
  * `remainingGasTo = winner`
  * `notify = true`
  * `payload = null`

### 4.7 WithdrawUnclaimed

* Admin withdraws leftover TON to `feeWallet`.
* Keeps a 0.01 TON reserve for safety.

---

## 5. Key Features

1. Pull-model for Jetton prevents DoS attacks on automatic payouts.
2. All amount checks are performed on-chain (no trust in frontend).
3. `games` is stored as `map<gameId, Game>` for efficiency.
4. Uses `message(MessageParameters{...})` instead of `send()`.
5. `claimed` is used only for Jetton to prevent double payouts.
6. TON excess funds are automatically returned.
7. Extensible: multi-signature admin, event emissions for frontend.

---

## 6. Backend Integration

* Backend stores game log: `gameId`, expected amount, currency.
* After the game finishes, backend calls `ReportWinner` with admin-key.
* For Jetton, frontend or backend calls `ClaimJetton` after finishing.
* Always log all transaction hashes for auditing.

---

## 7. Timeouts and Fees

| Currency | Fee | Join Timeout              |
| -------- | --- | ------------------------- |
| TON      | 5%  | Custom (default 3600s)    |
| Jetton   | 0%  | 3600s (fixed for Jetton)  |

* TON fee is deducted from total winnings (`2 * amount`).
* Jetton is fully paid to winner via pull-model.
* `joinTimeout` for TON games can be set in `CreateGameTon` message.

---

## 8. Deployment

Contract uses `Deployable` trait from `@stdlib/deploy`.

### Init Parameters

| Parameter       | Type    | Description                              |
| --------------- | ------- | ---------------------------------------- |
| `adminAddr`     | Address | Admin address (can call ReportWinner, WithdrawUnclaimed) |
| `feeWalletAddr` | Address | Address to receive 5% fees from TON games |

### Deploy Command

```bash
# Testnet
npx blueprint run deployEscrow --testnet

# Mainnet
npx blueprint run deployEscrow --mainnet
```

### Configuration

Edit `scripts/deployEscrow.ts` before deployment:

```typescript
const ADMIN_ADDRESS = 'UQ...';      // Backend wallet address
const FEE_WALLET_ADDRESS = 'UQ...'; // Fee collection address
```


