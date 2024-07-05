import dotenv from "dotenv";
import WebSocket from 'ws';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Connection, Keypair, PublicKey,LAMPORTS_PER_SOL} from '@solana/web3.js';
import bs58 from 'bs58';

import {GlobalAccount, PumpFunSDK,BondingCurveAccount,DEFAULT_DECIMALS} from "pumpdotfun-sdk/dist";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {AnchorProvider} from "@coral-xyz/anchor";

import {
    getOrCreateKeypair,
    getSPLBalance,
    printSOLBalance,
    printSPLBalance,
} from "./utils";
// 插件扩展
dayjs.extend(utc);
dayjs.extend(timezone);
dotenv.config()

const Lamports_Sol:number =LAMPORTS_PER_SOL;
const Lamports_Token:number =10**DEFAULT_DECIMALS;
const Total_Supply:number=1000000000;
// trade params
const BASIC_POINTS_SLIPPAGE =BigInt(10000);
const BUY_AMOUNT:number=0.00001

const RPC_ENDPOINT = process.env.HELIUS_RPC_URL || "";
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed')
let wallet = new NodeWallet(new Keypair()); //note this is not used
const provider = new AnchorProvider(web3Connection, wallet, {
    commitment: "confirmed",
});

let sdk = new PumpFunSDK(provider);
const globalAccount =  sdk.getGlobalAccount("finalized");

interface JsonRpcRequest {
    method: string;
    keys: string[];
}
interface TradeMetaResponse {
    // 根据你期望的 API 响应结构定义接口
    signature:string;
    mint: string;
    traderPublicKey:string;
    marketCapSol: number;
    txType: string;
    message:string;
    vTokensInBondingCurve:number;
    vSolInBondingCurve:number;

}

// 创建 WebSocket 连接
const ws = new WebSocket('wss://pumpportal.fun/api/data');
// 发送请求函数
function sendSubscribeRequest(ws: WebSocket): void {
    const request: JsonRpcRequest = {
        method: "subscribeAccountTrade",
        keys: ['HLgTkzhsi8iVFWWPAMti5UHNdFVrmaucvHNMD9nCWobM','CnurRmCkuG3JWrKNAazDba3QZ7d5ESkAEkvDmZcnAqaN','onixWLeJwRXvJ1iSwReWnyPtT97jxxGtdxeG9eGL9WH']
    };
    ws.send(JSON.stringify(request));
}

// 定义 WebSocket 事件处理程序
ws.on('open', function open() {
    console.log('WebSocket is open');
    sendSubscribeRequest(ws); // 一旦 WebSocket 打开，发送请求
});

async function  processBuy(mintAddr:string,globalAccount:GlobalAccount,bondingCurveAccount:BondingCurveAccount){
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(process.env.TRADE_PRIVATE_KEY || ""));
    const  mint = new PublicKey(mintAddr);
    let buyResults = await sdk.buy(
        globalAccount,
        bondingCurveAccount,
        signerKeyPair,
        mint,
        BigInt(BUY_AMOUNT * LAMPORTS_PER_SOL),
        BASIC_POINTS_SLIPPAGE,
        {
            unitLimit: 150000,
            unitPrice: 150000,
        },
    );
    console.log("buyResults: ",buyResults)
    if (buyResults.success) {
        await printSPLBalance(web3Connection, mint, signerKeyPair.publicKey);
        console.log("Bonding curve after buy", await sdk.getBondingCurveAccount(mint));
    }
}

ws.on('message', async function incoming(data: WebSocket.Data) {
    const messageStr = data.toString();
    try {
        const tradeMeta: TradeMetaResponse = JSON.parse(messageStr);
        console.log('Received:', tradeMeta);
        if (tradeMeta.message == undefined || tradeMeta.message == null) {
            const mintAddr = tradeMeta.mint;
            const txType = tradeMeta.txType;
            const signature = tradeMeta.signature;
            const virtualSolReserves = tradeMeta.vSolInBondingCurve;
            const virtualTokenReserves = tradeMeta.vTokensInBondingCurve;
            console.log('virtualSolReserves:', virtualSolReserves);
            console.log('virtualTokenReserves:', virtualTokenReserves);
            let virtualTokenReserves_bigint = BigInt(Math.trunc(virtualTokenReserves*Lamports_Token));
            let virtualSolReserves_bigint = BigInt(Math.trunc(virtualSolReserves*Lamports_Sol));
            let realTokenReserves_bigint = BigInt(virtualTokenReserves_bigint)-BigInt(279900000000000);
            let realSolReserves_bigint = virtualSolReserves_bigint -BigInt(30*Lamports_Sol)

            let bondingCurveAccount = new BondingCurveAccount(BigInt(0),virtualTokenReserves_bigint,virtualSolReserves_bigint,realTokenReserves_bigint,
                realSolReserves_bigint,BigInt(Total_Supply*Lamports_Token),false);
            if ('buy' === txType) {
                console.log('signature:', signature);
                let nowTime = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
                console.log('time ', nowTime);
                processBuy(mintAddr,  await globalAccount,bondingCurveAccount).then(() => {
                    console.log('send tx success ');
                })

            }

        }

    } catch (e) {
        console.error('Failed to parse JSON:', e);
    }
});

ws.on('error', function error(err: Error) {
    console.error('WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('WebSocket is closed');
});
