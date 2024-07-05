"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const web3_js_1 = require("@solana/web3.js");
const dist_1 = require("pumpdotfun-sdk/dist");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const anchor_1 = require("@coral-xyz/anchor");
const redis_1 = require("redis");
const grammy_1 = require("grammy");
require("./initializeGlobals");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const async_mutex_1 = require("async-mutex");
// 插件扩展
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
// 创建 Bot 实例，传入代理设置
const bot = new grammy_1.Bot('6874581207:AAF0RpWkGEQBEBGFDEFklhGpP1_wDX-9Oqo', {
    client: {
        baseFetchConfig: {
            agent: global.proxyAgent,
        },
    },
});
const chatId = 1495543428;
// 启动 bot
bot.start();
const client = (0, redis_1.createClient)({
    url: 'redis://localhost:6379',
    password: 'openapi@4321'
});
client.on('error', (err) => {
    console.error('Redis Client Error', err);
});
const minLamports = Math.pow(10, 9);
const launchTokenSet = new Set();
const trackTokenTrades = new Map();
const tradeRemoveDuplicateSet = new Set();
const mutex = new async_mutex_1.Mutex();
function realTimeTradeSignal(mintAddress, minBuyTotal, smartWalletList) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const tradeList = (_a = trackTokenTrades.get(mintAddress)) !== null && _a !== void 0 ? _a : [];
        //console.log("tradeList ", tradeList);
        if (tradeList.length < 6) {
            return;
        }
        else {
            const totalAmount = tradeList.reduce((total, minimalTradeData) => total + minimalTradeData.solAmount, BigInt(0));
            //console.log("totalAmount ", totalAmount);
            if (totalAmount > minBuyTotal * BigInt(10 ** 9)) {
                // let smartWalletList = tradeList.filter(minimalTradeData =>minimalTradeData.user.toString() in ["G1nhNi1sT2xqS1heCmeGvZmhpU9mfnx6epUk7Zv2fPBM"] )??[]
                let smartWalletFilter = (_b = tradeList.filter(minimalTradeData => smartWalletList.includes(minimalTradeData.user.toString()))) !== null && _b !== void 0 ? _b : [];
                let WhaleListFilter = (_c = tradeList.filter(minimalTradeData => minimalTradeData.solAmount > minLamports)) !== null && _c !== void 0 ? _c : [];
                //console.log("filterList ", filterList);
                if (WhaleListFilter.length > 2 && smartWalletFilter.length > 0) {
                    let latestTradeTime = WhaleListFilter[WhaleListFilter.length - 1].ts;
                    let firstTradeTime = WhaleListFilter[0].ts;
                    let crossTime = latestTradeTime - firstTradeTime;
                    if (crossTime < 20) {
                        trackTokenTrades.delete(mintAddress);
                        let pumpUrl = 'https://pump.fun/' + mintAddress;
                        bot.api.sendMessage(chatId, pumpUrl)
                            .then(response => {
                            console.log('Message sent successfully:', response.date);
                        })
                            .catch(err => {
                            console.error('Error sending message:', err);
                        });
                        /*                    await fetchData(mintAddress).then(data => {
                                                console.log('Data:', data);
                                                const created_time = data.created_timestamp
                                                const completed =data.complete
                                                const pastTime = Date.now()-created_time
                                                if(pastTime < 120*1000 && !completed){
                                                    let pumpUrl = 'https://pump.fun/' + mintAddress
                                                    bot.api.sendMessage(chatId, pumpUrl)
                                                        .then(response => {
                                                            console.log('Message sent successfully:', response.date);
                                                        })
                                                        .catch(err => {
                                                            console.error('Error sending message:', err);
                                                        });
                                                }
                                            }).catch(error => {
                                                    console.error('Error:', error);
                                                });*/
                    }
                }
            }
        }
    });
}
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    //fetchData("HPsgYSLqKjKLoX9k7hHmTBzwoQhjNPqLLSwqvKRhpump")
    dotenv_1.default.config();
    yield client.connect();
    const setWalletsKey = process.env.DEV_WALLETS_KEY || "";
    const smartWalletList = ['G1nhNi1sT2xqS1heCmeGvZmhpU9mfnx6epUk7Zv2fPBM'];
    console.log("devWalletskey %s", setWalletsKey);
    if (!process.env.HELIUS_RPC_URL) {
        console.error("Please set HELIUS_RPC_URL in .env file");
        console.error("Example: HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<your api key>");
        console.error("Get one at: https://www.helius.dev");
        return;
    }
    let connection = new web3_js_1.Connection(process.env.HELIUS_RPC_URL);
    let wallet = new nodewallet_1.default(new web3_js_1.Keypair()); //note this is not used
    const provider = new anchor_1.AnchorProvider(connection, wallet, {
        commitment: "finalized",
    });
    let sdk = new dist_1.PumpFunSDK(provider);
    let createEvent = sdk.addEventListener("createEvent", (event) => __awaiter(void 0, void 0, void 0, function* () {
        let devWallet = event.user.toString();
        //  console.log("devWallet---->",devWallet)
        let nowTime = (0, dayjs_1.default)().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
        const isMember = yield client.sIsMember(setWalletsKey, devWallet);
        console.log('devWallet Is  %s: %s', devWallet, nowTime, isMember);
        if (isMember) {
            console.log("createEvent", event);
            let mintAddress = event.mint.toString();
            launchTokenSet.add(mintAddress);
            /*
                       let pumpUrl = 'https://pump.fun/' + mintAddress
                       bot.api.sendMessage(chatId, pumpUrl)
                           .then(response => {
                               console.log('Message sent successfully:', response.date);
                           })
                           .catch(err => {
                               console.error('Error sending message:', err);
                           });*/
        }
    }));
    console.log("createEvent", createEvent);
    let tradeEvent = sdk.addEventListener("tradeEvent", (event) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        //console.log("tradeEvent", event);
        const mint = event.mint.toString();
        const buyBool = event.isBuy.valueOf();
        const user = event.user.toString();
        const ts = event.timestamp.valueOf();
        const existing = launchTokenSet.has(mint);
        if (buyBool && existing) {
            const release = yield mutex.acquire();
            try {
                const duplicateTradeBN = mint + '_' + user + 'BUY';
                if (tradeRemoveDuplicateSet.has(duplicateTradeBN)) {
                    return;
                }
                tradeRemoveDuplicateSet.add(duplicateTradeBN);
            }
            finally {
                release();
            }
            const minTradeData = {
                mint: event.mint,
                user: event.user,
                ts: ts,
                solAmount: event.solAmount
            };
            const tradeList = (_a = trackTokenTrades.get(event.mint.toString())) !== null && _a !== void 0 ? _a : [];
            tradeList.push(minTradeData);
            trackTokenTrades.set(event.mint.toString(), tradeList);
            yield realTimeTradeSignal(event.mint.toString(), BigInt(!process.env.MIN_BUY_TOTAL), smartWalletList);
        }
    }));
    console.log("tradeEvent", tradeEvent);
    /*
    let completeEvent = sdk.addEventListener("completeEvent", (event) => {
        console.log("completeEvent", event);
    });
    console.log("completeEvent", completeEvent);*/
});
main();
