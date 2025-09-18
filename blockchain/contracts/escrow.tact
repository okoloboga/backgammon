// contracts/Escrow.tact
import "@stdlib/deploy";

struct Game {
  id: Int as uint64;
  creator: Address;
  joiner: Address?;
  jettonMaster: Address?;    // null => TON, Address => Jetton
  amount: Int as coins;
  state: Int;       // 0=Waiting,1=InProgress,2=Finished,3=Cancelled
  createdAt: Int as uint32;
  joinedAt: Int?;
  winner: Address?;
  claimed: Bool;    // для Jetton
}

struct JettonPayload {
  action: Int as uint8;   // 0 = create, 1 = join
  gameId: Int as uint64;
}

message(0x01) CreateGameTon {
  amount: Int as coins;
  joinTimeout: Int as uint32 = 3600;
}

message(0x02) JoinGameTon {
  gameId: Int as uint64;
}

message(0x03) CancelGame {
  gameId: Int as uint64;
}

message(0x04) ReportWinner {
  gameId: Int as uint64;
  winner: Address;
}

message(0x05) WithdrawUnclaimed {}

message(0x10) OnJettonTransfer {
  sender: Address;
  amount: Int as coins;
  payload: JettonPayload;
  jettonMaster: Address;
}

message(0x11) ClaimJetton {
  gameId: Int as uint64;
}

const STATE_WAITING: Int = 0;
const STATE_INPROGRESS: Int = 1;
const STATE_FINISHED: Int = 2;
const STATE_CANCELLED: Int = 3;

contract Escrow {
  nextGameId: Int as uint64;
  admin: Address;
  feeWallet: Address;
  minTon: Int as coins;
  games: map<Int as uint64, Game>;

  init(adminAddr: Address, feeWalletAddr: Address) {
    self.nextGameId = 1;
    self.admin = adminAddr;
    self.feeWallet = feeWalletAddr;
    self.minTon = ton("1");
    self.games = map<Int as uint64, Game> {};
  }

  // --- TON create
  receive(msg: CreateGameTon) {
    let incoming = context().value;
    require(incoming >= msg.amount, "attach declared amount");
    require(msg.amount >= self.minTon, "amount below minimum");

    let id = self.nextGameId;
    self.nextGameId += 1;

    let game = Game{
      id: id,
      creator: sender(),
      joiner: null,
      jettonMaster: null,
      amount: msg.amount,
      state: STATE_WAITING,
      createdAt: now(),
      joinedAt: null,
      winner: null,
      claimed: false
    };
    self.games.set(id, game);

    let excess = incoming - msg.amount;
    if (excess > 0) {
      message(MessageParameters{ to: sender(), value: excess, mode: SendIgnoreErrors });
    }
  }

  // --- TON join
  receive(msg: JoinGameTon) {
    let gOpt = self.games.get(msg.gameId); require(gOpt != null, "game not found");
    let g = gOpt!!;
    require(g.state == STATE_WAITING, "game not waiting");
    require(g.creator != sender(), "creator can't join own game");

    let incoming = context().value;
    require(incoming >= g.amount, "attach exact stake");

    let newG = Game{
      id: g.id,
      creator: g.creator,
      joiner: sender(),
      jettonMaster: g.jettonMaster,
      amount: g.amount,
      state: STATE_INPROGRESS,
      createdAt: g.createdAt,
      joinedAt: now(),
      winner: null,
      claimed: false
    };
    self.games.set(msg.gameId, newG);

    let excess = incoming - g.amount;
    if (excess > 0) {
      message(MessageParameters{ to: sender(), value: excess, mode: SendIgnoreErrors });
    }
  }

  // --- Cancel
  receive(msg: CancelGame) {
    let gOpt = self.games.get(msg.gameId); require(gOpt != null, "game not found");
    let g = gOpt!!;
    require(sender() == g.creator, "only creator can cancel");
    require(g.state == STATE_WAITING, "only waiting games can be cancelled");

    let joinTimeout: Int = 3600;
    require(now() > g.createdAt + joinTimeout, "join timeout not passed");

    let cancelled = Game{
        id: g.id,
        creator: g.creator,
        joiner: g.joiner,
        jettonMaster: g.jettonMaster,
        amount: g.amount,
        state: STATE_CANCELLED,
        createdAt: g.createdAt,
        joinedAt: g.joinedAt,
        winner: g.winner,
        claimed: g.claimed
    };
    self.games.set(msg.gameId, cancelled);

    // refund creator
    if (g.jettonMaster == null) {
      message(MessageParameters{ to: g.creator, value: g.amount, mode: SendIgnoreErrors });
    }
  }

  // --- Report winner (TON + Jetton)
  receive(msg: ReportWinner) {
    require(sender() == self.admin, "only admin can report");
    let gOpt = self.games.get(msg.gameId); require(gOpt != null, "game not found");
    let g = gOpt!!;
    require(g.state == STATE_INPROGRESS, "game not in progress");
    require(msg.winner == g.creator || msg.winner == g.joiner, "winner must be player");

    let finished = Game{
      id: g.id,
      creator: g.creator,
      joiner: g.joiner,
      jettonMaster: g.jettonMaster,
      amount: g.amount,
      state: STATE_FINISHED,
      createdAt: g.createdAt,
      joinedAt: g.joinedAt,
      winner: msg.winner,
      claimed: g.claimed
    };

    self.games.set(msg.gameId, finished);

    if (g.jettonMaster == null) {
      let total = g.amount * 2;
      let fee = (total * 5)/100;
      let winnerAmount = total - fee;

      message(MessageParameters{ to: msg.winner, value: winnerAmount, mode: SendIgnoreErrors });
      if (fee > 0) {
          message(MessageParameters{
          to: self.feeWallet,
          value: fee,
          mode: SendIgnoreErrors
        });
      }   
    }
  }

  // --- Jetton transfer
  receive(msg: OnJettonTransfer) {

    if msg.payload.action == 0 {
      let id = self.nextGameId;
      self.nextGameId += 1;
      let game = Game{
        id: id,
        creator: msg.sender,
        joiner: null,
        jettonMaster: msg.jettonMaster,
        amount: msg.amount,
        state: STATE_WAITING,
        createdAt: now(),
        joinedAt: null,
        winner: null,
        claimed: false
      };
      self.games.set(id, game);
    } else {
      let gOpt = self.games.get(msg.payload.gameId); require(gOpt != null, "game not found");
      let g = gOpt!!;
      require(g.state == STATE_WAITING, "game not waiting");
      let newG = Game{
        id: g.id,
        creator: g.creator,
        joiner: msg.sender,
        jettonMaster: g.jettonMaster,
        amount: g.amount,
        state: STATE_INPROGRESS,
        createdAt: g.createdAt,
        joinedAt: now(),
        winner: null,
        claimed: false
      };

      self.games.set(msg.payload.gameId, newG);
    }
  }

  receive(msg: ClaimJetton) {
    let gOpt = self.games.get(msg.gameId); require(gOpt != null, "game not found");
    let g = gOpt!!;
    require(g.state == STATE_FINISHED, "game not finished");
    require(g.jettonMaster != null, "not a jetton game");
    require(sender() == g.winner, "only winner can claim");
    require(!g.claimed, "already claimed");

    // помечаем как получено
    g.claimed = true;
    self.games.set(msg.gameId, g);

    // Jetton transfer
    let jettonMaster = g.jettonMaster!!;
    let amount: Int = g.amount * 2;

    // call jetton transfer
    message(MessageParameters{
      to: jettonMaster,
      value: ton("0.05"),
      bounce: true,
      body: beginCell()
        .storeUint(0xf8a7ea5, 32)   // selector transfer
        .storeAddress(g.winner!!)
        .storeCoins(amount)
        .storeCoins(0)              // deployWalletValue
        .storeAddress(g.winner!!)
        .storeBit(true)             // notify
        .storeRef(beginCell().endCell()) // payload
      .endCell()
    });
  }

  // --- Withdraw leftover TON
  receive(msg: WithdrawUnclaimed) {
    require(sender() == self.admin, "only admin");
    let bal = myBalance() - context().value;
    let reserve = ton("0.01");
    if (bal > reserve) {
      message(MessageParameters{ 
        to: self.feeWallet, 
        value: bal - reserve, 
        mode: SendIgnoreErrors 
      });
    }
  }
}
