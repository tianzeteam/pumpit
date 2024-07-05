"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
// 插件扩展
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
// 创建 WebSocket 连接
const ws = new ws_1.default('wss://atlas-mainnet.helius-rpc.com?api-key=e3600cf9-2f0f-4093-841e-8e9863267831');
// 发送请求函数
function sendRequest(ws) {
    const request = {
        jsonrpc: "2.0",
        id: 420,
        method: "accountSubscribe",
        params: [
            "5ndLnEYqSFiA5yUFHo6LVZ1eWc6Rhh11K5CfJNkoHEPs", // 你要订阅的账户的 pubkey
            {
                encoding: "jsonParsed", // base58, base64, base65+zstd, jsonParsed
                commitment: "confirmed", // 默认是 finalized，如果没有设置
            }
        ]
    };
    ws.send(JSON.stringify(request));
}
// 定义 WebSocket 事件处理程序
ws.on('open', function open() {
    console.log('WebSocket is open');
    sendRequest(ws); // 一旦 WebSocket 打开，发送请求
});
ws.on('message', function incoming(data) {
    const messageStr = data.toString();
    try {
        const messageObj = JSON.parse(messageStr);
        console.log('Received:', messageObj);
        if (messageObj.method === 'accountNotification') {
            const params = messageObj.params;
            const result = params.result;
            const context = result.context;
            const value = result.value;
            const data = value.data;
            console.log(`Context: ${JSON.stringify(context, null, 2)}`);
            console.log(`Value: ${JSON.stringify(value, null, 2)}`);
            console.log("Data:", data);
        }
        let nowTime = (0, dayjs_1.default)().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
        console.log('time ', nowTime);
    }
    catch (e) {
        console.error('Failed to parse JSON:', e);
    }
});
ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});
ws.on('close', function close() {
    console.log('WebSocket is closed');
});
