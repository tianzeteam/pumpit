// initializeGlobals.ts
import { HttpsProxyAgent } from 'https-proxy-agent';


globalThis.proxyAgent= new HttpsProxyAgent('http://127.0.0.1:7890');