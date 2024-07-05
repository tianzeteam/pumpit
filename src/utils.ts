import fetch, {RequestInit} from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    Keypair,
    PublicKey,
    Connection,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { sha256 } from "js-sha256";
import fs from "fs";


const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');
interface CoinMetaResponse {
    // 根据你期望的 API 响应结构定义接口
    mint: string;
    created_timestamp: number;
    symbol: string;
    complete: boolean;
}

async function fetchData(mintAddress: string): Promise<CoinMetaResponse> {
    const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        agent:proxyAgent
    };
    let fetchCoinUrl ='https://frontend-api.pump.fun/coins/' + mintAddress
    console.log("fetchCoinUrl  "  ,fetchCoinUrl)
    const response = await fetch(fetchCoinUrl,requestOptions);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: CoinMetaResponse = await response.json();
    //console.log("fetchData  "  ,data)
    return data;
}

export function getOrCreateKeypair(dir: string, keyName: string): Keypair {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const authorityKey = dir + "/" + keyName + ".json";
    if (fs.existsSync(authorityKey)) {
        const data: {
            secretKey: string;
            publicKey: string;
        } = JSON.parse(fs.readFileSync(authorityKey, "utf-8"));
        return Keypair.fromSecretKey(bs58.decode(data.secretKey));
    } else {
        const keypair = Keypair.generate();
        keypair.secretKey;
        fs.writeFileSync(
            authorityKey,
            JSON.stringify({
                secretKey: bs58.encode(keypair.secretKey),
                publicKey: keypair.publicKey.toBase58(),
            })
        );
        return keypair;
    }
}

export const printSOLBalance = async (
    connection: Connection,
    pubKey: PublicKey,
    info: string = ""
) => {
    const balance = await connection.getBalance(pubKey);
    console.log(
        `${info ? info + " " : ""}${pubKey.toBase58()}:`,
        balance / LAMPORTS_PER_SOL,
        `SOL`
    );
};

export const getSPLBalance = async (
    connection: Connection,
    mintAddress: PublicKey,
    pubKey: PublicKey,
    allowOffCurve: boolean = false
) => {
    try {
        let ata = getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
        const balance = await connection.getTokenAccountBalance(ata, "processed");
        return balance.value.uiAmount;
    } catch (e) {}
    return null;
};

export const printSPLBalance = async (
    connection: Connection,
    mintAddress: PublicKey,
    user: PublicKey,
    info: string = ""
) => {
    const balance = await getSPLBalance(connection, mintAddress, user);
    if (balance === null) {
        console.log(
            `${info ? info + " " : ""}${user.toBase58()}:`,
            "No Account Found"
        );
    } else {
        console.log(`${info ? info + " " : ""}${user.toBase58()}:`, balance);
    }
};

export const baseToValue = (base: number, decimals: number): number => {
    return base * Math.pow(10, decimals);
};

export const valueToBase = (value: number, decimals: number): number => {
    return value / Math.pow(10, decimals);
};

//i.e. account:BondingCurve
export function getDiscriminator(name: string) {
    return sha256.digest(name).slice(0, 8);
}