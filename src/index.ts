import dotenv from "dotenv";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {PumpFunSDK} from "pumpdotfun-sdk/dist";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {AnchorProvider} from "@coral-xyz/anchor";
import {createClient} from 'redis';
import {Bot} from 'grammy';
import {HttpsProxyAgent} from 'https-proxy-agent';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Mutex } from 'async-mutex';


export type MinimalTradeData = {
    mint: PublicKey;
    user: PublicKey;
    ts: number;
    solAmount: bigint;
};

// 插件扩展
dayjs.extend(utc);
dayjs.extend(timezone);
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');

// 创建 Bot 实例，传入代理设置
const bot = new Bot('6874581207:AAF0RpWkGEQBEBGFDEFklhGpP1_wDX-9Oqo', {
    client: {
        baseFetchConfig: {
            agent: proxyAgent,
        },
    },
});

const chatId = 1495543428;
// 启动 bot
bot.start();


const client = createClient({
    url: 'redis://localhost:6379',
    password: 'openapi@4321'
});

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

const minLamports =Math.pow(10, 9)
const launchTokenSet: Set<string> = new Set<string>();
const trackTokenTrades = new Map<string, Array<MinimalTradeData>>();
const tradeRemoveDuplicateSet = new Set<string>();
const mutex = new Mutex();


async function realTimeTradeSignal(mintAddress :string , minBuyTotal: bigint,smartWalletList:string[]){
    const tradeList = trackTokenTrades.get(mintAddress) ?? [];
    //console.log("tradeList ", tradeList);
    if(tradeList.length<6) {
        return
    }else{
        const totalAmount = tradeList.reduce((total, minimalTradeData) => total + minimalTradeData.solAmount, BigInt(0));
        //console.log("totalAmount ", totalAmount);
        if(totalAmount > minBuyTotal*BigInt(10**9)) {
            // let smartWalletList = tradeList.filter(minimalTradeData =>minimalTradeData.user.toString() in ["G1nhNi1sT2xqS1heCmeGvZmhpU9mfnx6epUk7Zv2fPBM"] )??[]
            let smartWalletFilter = tradeList.filter(minimalTradeData => smartWalletList.includes(minimalTradeData.user.toString()))??[]
            let WhaleListFilter = tradeList.filter(minimalTradeData =>minimalTradeData.solAmount > minLamports)??[]
            //console.log("filterList ", filterList);
            if(WhaleListFilter.length >2 && smartWalletFilter.length>0) {
                let latestTradeTime = WhaleListFilter[WhaleListFilter.length-1].ts
                let firstTradeTime = WhaleListFilter[0].ts
                let crossTime = latestTradeTime - firstTradeTime
                if(crossTime < 20){
                    trackTokenTrades.delete(mintAddress)
                    let pumpUrl = 'https://pump.fun/' + mintAddress
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
}
const main = async () => {
    //fetchData("HPsgYSLqKjKLoX9k7hHmTBzwoQhjNPqLLSwqvKRhpump")

    dotenv.config()
    await client.connect();

    const setWalletsKey = process.env.DEV_WALLETS_KEY || "";
    const smartWalletList = ['G1nhNi1sT2xqS1heCmeGvZmhpU9mfnx6epUk7Zv2fPBM']
    console.log("devWalletskey %s", setWalletsKey);
    if (!process.env.HELIUS_RPC_URL) {
        console.error("Please set HELIUS_RPC_URL in .env file");
        console.error(
            "Example: HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<your api key>"
        );
        console.error("Get one at: https://www.helius.dev");
        return;
    }
    let connection = new Connection(process.env.HELIUS_RPC_URL);
    let wallet = new NodeWallet(new Keypair()); //note this is not used
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
    });

    let sdk = new PumpFunSDK(provider);
    let createEvent = sdk.addEventListener("createEvent", async (event) => {

        let devWallet = event.user.toString()
        //  console.log("devWallet---->",devWallet)
        let nowTime = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
        const isMember = await client.sIsMember(setWalletsKey, devWallet);
        console.log('devWallet Is  %s: %s', devWallet, nowTime, isMember);
        if (isMember) {

          //  console.log("createEvent", event);
            let mintAddress = event.mint.toString()
            launchTokenSet.add(mintAddress)
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
    });
    console.log("createEvent", createEvent);

     let tradeEvent = sdk.addEventListener("tradeEvent", async (event) => {
         console.log("tradeEvent", event);
         const mint = event.mint.toString()
         const buyBool = event.isBuy.valueOf()
         const user = event.user.toString()
         const ts = event.timestamp.valueOf()
         const existing = launchTokenSet.has(mint);

         if (buyBool && existing) {
             const release = await mutex.acquire();
             try {
                 const duplicateTradeBN = mint + '_' + user + 'BUY'
                 if (tradeRemoveDuplicateSet.has(duplicateTradeBN)) {
                     return
                 }

                 tradeRemoveDuplicateSet.add(duplicateTradeBN)
             } finally {
                 release();
             }
             const minTradeData: MinimalTradeData = {
                 mint: event.mint,
                 user: event.user,
                 ts: ts,
                 solAmount: event.solAmount
             }
             const tradeList = trackTokenTrades.get(event.mint.toString()) ?? [];
             tradeList.push(minTradeData);
             trackTokenTrades.set(event.mint.toString(), tradeList);

             await realTimeTradeSignal(event.mint.toString(), BigInt(!process.env.MIN_BUY_TOTAL),smartWalletList)


         }
     });
      console.log("tradeEvent", tradeEvent);
      /*
      let completeEvent = sdk.addEventListener("completeEvent", (event) => {
          console.log("completeEvent", event);
      });
      console.log("completeEvent", completeEvent);*/
};

main();