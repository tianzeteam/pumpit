import { HttpsProxyAgent } from 'https-proxy-agent';

declare global {
    namespace NodeJS {
        interface Global {
            proxyAgent: HttpsProxyAgent;
        }
    }

    var proxyAgent: HttpsProxyAgent;
}

export {};