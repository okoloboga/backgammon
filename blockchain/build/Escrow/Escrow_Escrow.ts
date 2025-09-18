import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type Game = {
    $$type: 'Game';
    id: bigint;
    creator: Address;
    joiner: Address | null;
    jettonMaster: Address | null;
    amount: bigint;
    state: bigint;
    createdAt: bigint;
    joinedAt: bigint | null;
    winner: Address | null;
    claimed: boolean;
}

export function storeGame(src: Game) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.id, 64);
        b_0.storeAddress(src.creator);
        b_0.storeAddress(src.joiner);
        b_0.storeAddress(src.jettonMaster);
        b_0.storeCoins(src.amount);
        const b_1 = new Builder();
        b_1.storeInt(src.state, 257);
        b_1.storeUint(src.createdAt, 32);
        if (src.joinedAt !== null && src.joinedAt !== undefined) { b_1.storeBit(true).storeInt(src.joinedAt, 257); } else { b_1.storeBit(false); }
        b_1.storeAddress(src.winner);
        b_1.storeBit(src.claimed);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadGame(slice: Slice) {
    const sc_0 = slice;
    const _id = sc_0.loadUintBig(64);
    const _creator = sc_0.loadAddress();
    const _joiner = sc_0.loadMaybeAddress();
    const _jettonMaster = sc_0.loadMaybeAddress();
    const _amount = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _state = sc_1.loadIntBig(257);
    const _createdAt = sc_1.loadUintBig(32);
    const _joinedAt = sc_1.loadBit() ? sc_1.loadIntBig(257) : null;
    const _winner = sc_1.loadMaybeAddress();
    const _claimed = sc_1.loadBit();
    return { $$type: 'Game' as const, id: _id, creator: _creator, joiner: _joiner, jettonMaster: _jettonMaster, amount: _amount, state: _state, createdAt: _createdAt, joinedAt: _joinedAt, winner: _winner, claimed: _claimed };
}

export function loadTupleGame(source: TupleReader) {
    const _id = source.readBigNumber();
    const _creator = source.readAddress();
    const _joiner = source.readAddressOpt();
    const _jettonMaster = source.readAddressOpt();
    const _amount = source.readBigNumber();
    const _state = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _joinedAt = source.readBigNumberOpt();
    const _winner = source.readAddressOpt();
    const _claimed = source.readBoolean();
    return { $$type: 'Game' as const, id: _id, creator: _creator, joiner: _joiner, jettonMaster: _jettonMaster, amount: _amount, state: _state, createdAt: _createdAt, joinedAt: _joinedAt, winner: _winner, claimed: _claimed };
}

export function loadGetterTupleGame(source: TupleReader) {
    const _id = source.readBigNumber();
    const _creator = source.readAddress();
    const _joiner = source.readAddressOpt();
    const _jettonMaster = source.readAddressOpt();
    const _amount = source.readBigNumber();
    const _state = source.readBigNumber();
    const _createdAt = source.readBigNumber();
    const _joinedAt = source.readBigNumberOpt();
    const _winner = source.readAddressOpt();
    const _claimed = source.readBoolean();
    return { $$type: 'Game' as const, id: _id, creator: _creator, joiner: _joiner, jettonMaster: _jettonMaster, amount: _amount, state: _state, createdAt: _createdAt, joinedAt: _joinedAt, winner: _winner, claimed: _claimed };
}

export function storeTupleGame(source: Game) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.id);
    builder.writeAddress(source.creator);
    builder.writeAddress(source.joiner);
    builder.writeAddress(source.jettonMaster);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.state);
    builder.writeNumber(source.createdAt);
    builder.writeNumber(source.joinedAt);
    builder.writeAddress(source.winner);
    builder.writeBoolean(source.claimed);
    return builder.build();
}

export function dictValueParserGame(): DictionaryValue<Game> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeGame(src)).endCell());
        },
        parse: (src) => {
            return loadGame(src.loadRef().beginParse());
        }
    }
}

export type JettonPayload = {
    $$type: 'JettonPayload';
    action: bigint;
    gameId: bigint;
}

export function storeJettonPayload(src: JettonPayload) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.action, 8);
        b_0.storeUint(src.gameId, 64);
    };
}

export function loadJettonPayload(slice: Slice) {
    const sc_0 = slice;
    const _action = sc_0.loadUintBig(8);
    const _gameId = sc_0.loadUintBig(64);
    return { $$type: 'JettonPayload' as const, action: _action, gameId: _gameId };
}

export function loadTupleJettonPayload(source: TupleReader) {
    const _action = source.readBigNumber();
    const _gameId = source.readBigNumber();
    return { $$type: 'JettonPayload' as const, action: _action, gameId: _gameId };
}

export function loadGetterTupleJettonPayload(source: TupleReader) {
    const _action = source.readBigNumber();
    const _gameId = source.readBigNumber();
    return { $$type: 'JettonPayload' as const, action: _action, gameId: _gameId };
}

export function storeTupleJettonPayload(source: JettonPayload) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.action);
    builder.writeNumber(source.gameId);
    return builder.build();
}

export function dictValueParserJettonPayload(): DictionaryValue<JettonPayload> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonPayload(src)).endCell());
        },
        parse: (src) => {
            return loadJettonPayload(src.loadRef().beginParse());
        }
    }
}

export type CreateGameTon = {
    $$type: 'CreateGameTon';
    amount: bigint;
    joinTimeout: bigint;
}

export function storeCreateGameTon(src: CreateGameTon) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1, 32);
        b_0.storeCoins(src.amount);
        b_0.storeUint(src.joinTimeout, 32);
    };
}

export function loadCreateGameTon(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1) { throw Error('Invalid prefix'); }
    const _amount = sc_0.loadCoins();
    const _joinTimeout = sc_0.loadUintBig(32);
    return { $$type: 'CreateGameTon' as const, amount: _amount, joinTimeout: _joinTimeout };
}

export function loadTupleCreateGameTon(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _joinTimeout = source.readBigNumber();
    return { $$type: 'CreateGameTon' as const, amount: _amount, joinTimeout: _joinTimeout };
}

export function loadGetterTupleCreateGameTon(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _joinTimeout = source.readBigNumber();
    return { $$type: 'CreateGameTon' as const, amount: _amount, joinTimeout: _joinTimeout };
}

export function storeTupleCreateGameTon(source: CreateGameTon) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    builder.writeNumber(source.joinTimeout);
    return builder.build();
}

export function dictValueParserCreateGameTon(): DictionaryValue<CreateGameTon> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateGameTon(src)).endCell());
        },
        parse: (src) => {
            return loadCreateGameTon(src.loadRef().beginParse());
        }
    }
}

export type JoinGameTon = {
    $$type: 'JoinGameTon';
    gameId: bigint;
}

export function storeJoinGameTon(src: JoinGameTon) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2, 32);
        b_0.storeUint(src.gameId, 64);
    };
}

export function loadJoinGameTon(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2) { throw Error('Invalid prefix'); }
    const _gameId = sc_0.loadUintBig(64);
    return { $$type: 'JoinGameTon' as const, gameId: _gameId };
}

export function loadTupleJoinGameTon(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'JoinGameTon' as const, gameId: _gameId };
}

export function loadGetterTupleJoinGameTon(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'JoinGameTon' as const, gameId: _gameId };
}

export function storeTupleJoinGameTon(source: JoinGameTon) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.gameId);
    return builder.build();
}

export function dictValueParserJoinGameTon(): DictionaryValue<JoinGameTon> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJoinGameTon(src)).endCell());
        },
        parse: (src) => {
            return loadJoinGameTon(src.loadRef().beginParse());
        }
    }
}

export type CancelGame = {
    $$type: 'CancelGame';
    gameId: bigint;
}

export function storeCancelGame(src: CancelGame) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3, 32);
        b_0.storeUint(src.gameId, 64);
    };
}

export function loadCancelGame(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3) { throw Error('Invalid prefix'); }
    const _gameId = sc_0.loadUintBig(64);
    return { $$type: 'CancelGame' as const, gameId: _gameId };
}

export function loadTupleCancelGame(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'CancelGame' as const, gameId: _gameId };
}

export function loadGetterTupleCancelGame(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'CancelGame' as const, gameId: _gameId };
}

export function storeTupleCancelGame(source: CancelGame) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.gameId);
    return builder.build();
}

export function dictValueParserCancelGame(): DictionaryValue<CancelGame> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCancelGame(src)).endCell());
        },
        parse: (src) => {
            return loadCancelGame(src.loadRef().beginParse());
        }
    }
}

export type ReportWinner = {
    $$type: 'ReportWinner';
    gameId: bigint;
    winner: Address;
}

export function storeReportWinner(src: ReportWinner) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4, 32);
        b_0.storeUint(src.gameId, 64);
        b_0.storeAddress(src.winner);
    };
}

export function loadReportWinner(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4) { throw Error('Invalid prefix'); }
    const _gameId = sc_0.loadUintBig(64);
    const _winner = sc_0.loadAddress();
    return { $$type: 'ReportWinner' as const, gameId: _gameId, winner: _winner };
}

export function loadTupleReportWinner(source: TupleReader) {
    const _gameId = source.readBigNumber();
    const _winner = source.readAddress();
    return { $$type: 'ReportWinner' as const, gameId: _gameId, winner: _winner };
}

export function loadGetterTupleReportWinner(source: TupleReader) {
    const _gameId = source.readBigNumber();
    const _winner = source.readAddress();
    return { $$type: 'ReportWinner' as const, gameId: _gameId, winner: _winner };
}

export function storeTupleReportWinner(source: ReportWinner) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.gameId);
    builder.writeAddress(source.winner);
    return builder.build();
}

export function dictValueParserReportWinner(): DictionaryValue<ReportWinner> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeReportWinner(src)).endCell());
        },
        parse: (src) => {
            return loadReportWinner(src.loadRef().beginParse());
        }
    }
}

export type WithdrawUnclaimed = {
    $$type: 'WithdrawUnclaimed';
}

export function storeWithdrawUnclaimed(src: WithdrawUnclaimed) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(5, 32);
    };
}

export function loadWithdrawUnclaimed(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 5) { throw Error('Invalid prefix'); }
    return { $$type: 'WithdrawUnclaimed' as const };
}

export function loadTupleWithdrawUnclaimed(source: TupleReader) {
    return { $$type: 'WithdrawUnclaimed' as const };
}

export function loadGetterTupleWithdrawUnclaimed(source: TupleReader) {
    return { $$type: 'WithdrawUnclaimed' as const };
}

export function storeTupleWithdrawUnclaimed(source: WithdrawUnclaimed) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserWithdrawUnclaimed(): DictionaryValue<WithdrawUnclaimed> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdrawUnclaimed(src)).endCell());
        },
        parse: (src) => {
            return loadWithdrawUnclaimed(src.loadRef().beginParse());
        }
    }
}

export type OnJettonTransfer = {
    $$type: 'OnJettonTransfer';
    sender: Address;
    amount: bigint;
    payload: JettonPayload;
    jettonMaster: Address;
}

export function storeOnJettonTransfer(src: OnJettonTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(16, 32);
        b_0.storeAddress(src.sender);
        b_0.storeCoins(src.amount);
        b_0.store(storeJettonPayload(src.payload));
        b_0.storeAddress(src.jettonMaster);
    };
}

export function loadOnJettonTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 16) { throw Error('Invalid prefix'); }
    const _sender = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _payload = loadJettonPayload(sc_0);
    const _jettonMaster = sc_0.loadAddress();
    return { $$type: 'OnJettonTransfer' as const, sender: _sender, amount: _amount, payload: _payload, jettonMaster: _jettonMaster };
}

export function loadTupleOnJettonTransfer(source: TupleReader) {
    const _sender = source.readAddress();
    const _amount = source.readBigNumber();
    const _payload = loadTupleJettonPayload(source);
    const _jettonMaster = source.readAddress();
    return { $$type: 'OnJettonTransfer' as const, sender: _sender, amount: _amount, payload: _payload, jettonMaster: _jettonMaster };
}

export function loadGetterTupleOnJettonTransfer(source: TupleReader) {
    const _sender = source.readAddress();
    const _amount = source.readBigNumber();
    const _payload = loadGetterTupleJettonPayload(source);
    const _jettonMaster = source.readAddress();
    return { $$type: 'OnJettonTransfer' as const, sender: _sender, amount: _amount, payload: _payload, jettonMaster: _jettonMaster };
}

export function storeTupleOnJettonTransfer(source: OnJettonTransfer) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.sender);
    builder.writeNumber(source.amount);
    builder.writeTuple(storeTupleJettonPayload(source.payload));
    builder.writeAddress(source.jettonMaster);
    return builder.build();
}

export function dictValueParserOnJettonTransfer(): DictionaryValue<OnJettonTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOnJettonTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadOnJettonTransfer(src.loadRef().beginParse());
        }
    }
}

export type ClaimJetton = {
    $$type: 'ClaimJetton';
    gameId: bigint;
}

export function storeClaimJetton(src: ClaimJetton) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(17, 32);
        b_0.storeUint(src.gameId, 64);
    };
}

export function loadClaimJetton(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 17) { throw Error('Invalid prefix'); }
    const _gameId = sc_0.loadUintBig(64);
    return { $$type: 'ClaimJetton' as const, gameId: _gameId };
}

export function loadTupleClaimJetton(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'ClaimJetton' as const, gameId: _gameId };
}

export function loadGetterTupleClaimJetton(source: TupleReader) {
    const _gameId = source.readBigNumber();
    return { $$type: 'ClaimJetton' as const, gameId: _gameId };
}

export function storeTupleClaimJetton(source: ClaimJetton) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.gameId);
    return builder.build();
}

export function dictValueParserClaimJetton(): DictionaryValue<ClaimJetton> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimJetton(src)).endCell());
        },
        parse: (src) => {
            return loadClaimJetton(src.loadRef().beginParse());
        }
    }
}

export type Escrow$Data = {
    $$type: 'Escrow$Data';
    nextGameId: bigint;
    admin: Address;
    feeWallet: Address;
    minTon: bigint;
    games: Dictionary<bigint, Game>;
}

export function storeEscrow$Data(src: Escrow$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(src.nextGameId, 64);
        b_0.storeAddress(src.admin);
        b_0.storeAddress(src.feeWallet);
        b_0.storeCoins(src.minTon);
        b_0.storeDict(src.games, Dictionary.Keys.BigUint(64), dictValueParserGame());
    };
}

export function loadEscrow$Data(slice: Slice) {
    const sc_0 = slice;
    const _nextGameId = sc_0.loadUintBig(64);
    const _admin = sc_0.loadAddress();
    const _feeWallet = sc_0.loadAddress();
    const _minTon = sc_0.loadCoins();
    const _games = Dictionary.load(Dictionary.Keys.BigUint(64), dictValueParserGame(), sc_0);
    return { $$type: 'Escrow$Data' as const, nextGameId: _nextGameId, admin: _admin, feeWallet: _feeWallet, minTon: _minTon, games: _games };
}

export function loadTupleEscrow$Data(source: TupleReader) {
    const _nextGameId = source.readBigNumber();
    const _admin = source.readAddress();
    const _feeWallet = source.readAddress();
    const _minTon = source.readBigNumber();
    const _games = Dictionary.loadDirect(Dictionary.Keys.BigUint(64), dictValueParserGame(), source.readCellOpt());
    return { $$type: 'Escrow$Data' as const, nextGameId: _nextGameId, admin: _admin, feeWallet: _feeWallet, minTon: _minTon, games: _games };
}

export function loadGetterTupleEscrow$Data(source: TupleReader) {
    const _nextGameId = source.readBigNumber();
    const _admin = source.readAddress();
    const _feeWallet = source.readAddress();
    const _minTon = source.readBigNumber();
    const _games = Dictionary.loadDirect(Dictionary.Keys.BigUint(64), dictValueParserGame(), source.readCellOpt());
    return { $$type: 'Escrow$Data' as const, nextGameId: _nextGameId, admin: _admin, feeWallet: _feeWallet, minTon: _minTon, games: _games };
}

export function storeTupleEscrow$Data(source: Escrow$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.nextGameId);
    builder.writeAddress(source.admin);
    builder.writeAddress(source.feeWallet);
    builder.writeNumber(source.minTon);
    builder.writeCell(source.games.size > 0 ? beginCell().storeDictDirect(source.games, Dictionary.Keys.BigUint(64), dictValueParserGame()).endCell() : null);
    return builder.build();
}

export function dictValueParserEscrow$Data(): DictionaryValue<Escrow$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeEscrow$Data(src)).endCell());
        },
        parse: (src) => {
            return loadEscrow$Data(src.loadRef().beginParse());
        }
    }
}

 type Escrow_init_args = {
    $$type: 'Escrow_init_args';
    adminAddr: Address;
    feeWalletAddr: Address;
}

function initEscrow_init_args(src: Escrow_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.adminAddr);
        b_0.storeAddress(src.feeWalletAddr);
    };
}

async function Escrow_init(adminAddr: Address, feeWalletAddr: Address) {
    const __code = Cell.fromHex('b5ee9c7241021b01000940000114ff00208e8130e1f2c80b0104bc01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019ed33ffa40fa40fa00f40455406c158e11fa40fa405902d101715982103b9aca006de206925f06e004d70d1ff2e08221c001e30221c002e30221c003e30221c0040204080c017831fa0030f8416f24135f03814cb35312bef2f48117195326bef2f424a4f8426d6d70f8236d6d2c070605514a44347009080706050443138040502ac80302e65590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc910394170206e953059f45b30944133f417e25066a120c2009130e30d4034071101fe31d33f302580402259f40f6fa192306ddf206e92306d8e50d0d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201fa00d401d0810101d700d31fd2000195810101d700926d01e2d72c01916d93fa4001e201d20030105a10591058105710566c1a6f0ae28200c52f216eb3f2f4206ef2d0806f2a5f033481666a05018201c000f2f48200d001f8425250c705b3f2f4f8416f24135f038200a2125312bef2f4f84271f82310682410681035104850996d7009080706050443138040502ac80602e45590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc910394140206e953059f45b30944133f417e206a120c2009130e30d40340711003ef84201726d40037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb0001fe31d33f302580402259f40f6fa192306ddf206e92306d8e50d0d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201fa00d401d0810101d700d31fd2000195810101d700926d01e2d72c01916d93fa4001e201d20030105a10591058105710566c1a6f0ae28200c52f216eb3f2f4206ef2d0806f2a8200f143f8420901702ac705f2f4814a2405c00015f2f4810e1081156ef8235253a012bcf2f410587328516a1069541454503a1409080706050443138040502ac80a02e05590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc9103a4150206e953059f45b30944133f417e2016e923630e30d40340b11003c5066726d40037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb000468e30221c0108f2931fa40fa00d307d33f5902fa403001e30f4430c87f01ca0055405045cb3f12cece01fa02f400c9ed54e021c0110d12141601fc31d33ffa40308165acf84225c705f2f42680402359f40f6fa192306ddf206e92306d8e50d0d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201fa00d401d0810101d700d31fd2000195810101d700926d01e2d72c01916d93fa4001e201d20030105a10591058105710566c1a6f0ae28200c52f216eb3f2f40e0188206ef2d0806f2a318200db6504c00114f2f481292d5397c705917f9b5396206e925b7092c705e2e2f2f410575e337227514944145423b409080706050443138040502ac80f02e05590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc9103a4150206e953059f45b30944133f417e2026e923035e30d40341011009e06aa0020a7058064a90466a117726d40037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb0025c2008e1e5216726d40037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb009135e2002cc87f01ca0055405045cb3f12cece01fa02f400c9ed5401fc30312680402259f40f6fa192306ddf206e92306d8e50d0d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201fa00d401d0810101d700d31fd2000195810101d700926d01e2d72c01916d93fa4001e201d20030105a10591058105710566c1a6f0ae28200c52f216eb3f2f4206ef2d0806f2a5f033481666a011301f0c000f2f471f823106710561058103441306d7009080706050443138040502ac85590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc91037121501f23125a46d70f8232906105710341037596d6d7009080706050443138040502ac85590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc91037415015001c206e953059f45b30944133f417e201cce30230c0058e5981557df84223c705f2f4f8276f10f8416f24135f03a182089896805cbc8e1fa15210726d40037fc8cf8580ca00cf8440ce01fa02806acf40f400c901fb00915be24034c87f01ca0055405045cb3f12cece01fa02f400c9ed54e05f05f2c0821701fc31d33f302580402259f40f6fa192306ddf206e92306d8e50d0d33ffa40d72c01916d93fa4001e201d72c01916d93fa4001e201fa00d401d0810101d700d31fd2000195810101d700926d01e2d72c01916d93fa4001e201d20030105a10591058105710566c1a6f0ae28200c52f216eb3f2f4206ef2d0806f2a8200c38125180174c002f2f48200cedf276eb3f2f4811917f84223206e925b7092c705e2f2f48200adaf01b3f2f41048103710267f804027514b5140104c103b0cc81901fe5590509acb3f17ce5005206e9430cf84809201cee25003206e9430cf84809201cee201fa0201c8810101cf0012cb1f226eb39a7f01ca0012810101cf0095327058ca00e258206e9430cf84809201cee212ca00cdc9103a15206e953059f45b30944133f417e202206ef2d08001aa00820afaf0807fc8c97fc882100f8a7ea51a00b201cb1f2c206ef2d080cf165005fa0270fa020b206ef2d0801bcf1613ca0019ccc9102310287050444313c8cf8580ca00cf8440ce01fa02806acf40f400c901fb004034c87f01ca0055405045cb3f12cece01fa02f400c9ed5431ccd4d2');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initEscrow_init_args({ $$type: 'Escrow_init_args', adminAddr, feeWalletAddr })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const Escrow_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    5486: { message: "join timeout not passed" },
    5913: { message: "amount below minimum" },
    6423: { message: "only winner can claim" },
    10541: { message: "winner must be player" },
    18980: { message: "only waiting games can be cancelled" },
    19635: { message: "attach declared amount" },
    21885: { message: "only admin" },
    26028: { message: "only admin can report" },
    26218: { message: "game not waiting" },
    41490: { message: "attach exact stake" },
    44463: { message: "already claimed" },
    50049: { message: "game not finished" },
    50479: { message: "game not found" },
    52959: { message: "not a jetton game" },
    53249: { message: "creator can't join own game" },
    56165: { message: "game not in progress" },
    61763: { message: "only creator can cancel" },
} as const

export const Escrow_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "join timeout not passed": 5486,
    "amount below minimum": 5913,
    "only winner can claim": 6423,
    "winner must be player": 10541,
    "only waiting games can be cancelled": 18980,
    "attach declared amount": 19635,
    "only admin": 21885,
    "only admin can report": 26028,
    "game not waiting": 26218,
    "attach exact stake": 41490,
    "already claimed": 44463,
    "game not finished": 50049,
    "game not found": 50479,
    "not a jetton game": 52959,
    "creator can't join own game": 53249,
    "game not in progress": 56165,
    "only creator can cancel": 61763,
} as const

const Escrow_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Game","header":null,"fields":[{"name":"id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"creator","type":{"kind":"simple","type":"address","optional":false}},{"name":"joiner","type":{"kind":"simple","type":"address","optional":true}},{"name":"jettonMaster","type":{"kind":"simple","type":"address","optional":true}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"state","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"createdAt","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"joinedAt","type":{"kind":"simple","type":"int","optional":true,"format":257}},{"name":"winner","type":{"kind":"simple","type":"address","optional":true}},{"name":"claimed","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"JettonPayload","header":null,"fields":[{"name":"action","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"gameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"CreateGameTon","header":1,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"joinTimeout","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"JoinGameTon","header":2,"fields":[{"name":"gameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"CancelGame","header":3,"fields":[{"name":"gameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"ReportWinner","header":4,"fields":[{"name":"gameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"winner","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"WithdrawUnclaimed","header":5,"fields":[]},
    {"name":"OnJettonTransfer","header":16,"fields":[{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"payload","type":{"kind":"simple","type":"JettonPayload","optional":false}},{"name":"jettonMaster","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ClaimJetton","header":17,"fields":[{"name":"gameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"Escrow$Data","header":null,"fields":[{"name":"nextGameId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"admin","type":{"kind":"simple","type":"address","optional":false}},{"name":"feeWallet","type":{"kind":"simple","type":"address","optional":false}},{"name":"minTon","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"games","type":{"kind":"dict","key":"uint","keyFormat":64,"value":"Game","valueFormat":"ref"}}]},
]

const Escrow_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "CreateGameTon": 1,
    "JoinGameTon": 2,
    "CancelGame": 3,
    "ReportWinner": 4,
    "WithdrawUnclaimed": 5,
    "OnJettonTransfer": 16,
    "ClaimJetton": 17,
}

const Escrow_getters: ABIGetter[] = [
]

export const Escrow_getterMapping: { [key: string]: string } = {
}

const Escrow_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"CreateGameTon"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JoinGameTon"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CancelGame"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ReportWinner"}},
    {"receiver":"internal","message":{"kind":"typed","type":"OnJettonTransfer"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimJetton"}},
    {"receiver":"internal","message":{"kind":"typed","type":"WithdrawUnclaimed"}},
]

export const STATE_WAITING = 0n;
export const STATE_INPROGRESS = 1n;
export const STATE_FINISHED = 2n;
export const STATE_CANCELLED = 3n;

export class Escrow implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = Escrow_errors_backward;
    public static readonly opcodes = Escrow_opcodes;
    
    static async init(adminAddr: Address, feeWalletAddr: Address) {
        return await Escrow_init(adminAddr, feeWalletAddr);
    }
    
    static async fromInit(adminAddr: Address, feeWalletAddr: Address) {
        const __gen_init = await Escrow_init(adminAddr, feeWalletAddr);
        const address = contractAddress(0, __gen_init);
        return new Escrow(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new Escrow(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  Escrow_types,
        getters: Escrow_getters,
        receivers: Escrow_receivers,
        errors: Escrow_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: CreateGameTon | JoinGameTon | CancelGame | ReportWinner | OnJettonTransfer | ClaimJetton | WithdrawUnclaimed) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CreateGameTon') {
            body = beginCell().store(storeCreateGameTon(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JoinGameTon') {
            body = beginCell().store(storeJoinGameTon(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CancelGame') {
            body = beginCell().store(storeCancelGame(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ReportWinner') {
            body = beginCell().store(storeReportWinner(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'OnJettonTransfer') {
            body = beginCell().store(storeOnJettonTransfer(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimJetton') {
            body = beginCell().store(storeClaimJetton(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'WithdrawUnclaimed') {
            body = beginCell().store(storeWithdrawUnclaimed(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
}