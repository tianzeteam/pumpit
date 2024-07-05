import WebSocket from 'ws';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 插件扩展
dayjs.extend(utc);
dayjs.extend(timezone);
interface JsonRpcRequest {
    jsonrpc: string;
    id: number;
    method: string;
    params: [string, { encoding: string; commitment: string }];
}
interface AccountNotification {
    jsonrpc: string;
    method: string;
    params: {
        subscription: number;
        result: {
            context: {
                slot: number;
            };
            value: any;
        };
    };
}
// 创建 WebSocket 连接
const ws = new WebSocket('wss://atlas-mainnet.helius-rpc.com?api-key=e3600cf9-2f0f-4093-841e-8e9863267831');

// 发送请求函数
function sendRequest(ws: WebSocket): void {
    const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 420,
        method: "accountSubscribe",
        params: [
            "5ndLnEYqSFiA5yUFHo6LVZ1eWc6Rhh11K5CfJNkoHEPs", // 你要订阅的账户的pubkey
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

ws.on('message', function incoming(data: WebSocket.Data) {
    const messageStr = data.toString('utf8');;
    try {
        const messageObj = JSON.parse(messageStr);
        console.log('Received:', messageObj);
        if (messageObj.method === 'accountNotification') {
            const params = messageObj.params;
            const result = params.result;
            const context = result.context;
            const value = result.value;
            const data =value.data
            console.log(`Context: ${JSON.stringify(context, null, 2)}`);
            console.log(`Value: ${JSON.stringify(value, null, 2)}`);
            console.log("Data:" ,data);
        }
        let nowTime = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
        console.log('time ',nowTime)
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
