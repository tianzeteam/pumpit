"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// initializeGlobals.ts
const https_proxy_agent_1 = require("https-proxy-agent");
// 初始化全局变量
global.proxyAgent = new https_proxy_agent_1.HttpsProxyAgent('http://127.0.0.1:7890');
