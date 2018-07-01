"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const koa_1 = __importDefault(require("koa"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_compress_1 = __importDefault(require("koa-compress"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const koa_static_1 = __importDefault(require("koa-static"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const router_1 = require("./router");
const websocket_1 = require("./websocket");
const app = new koa_1.default();
app.use(errorHandler_1.error());
app.use(koa_logger_1.default());
app.use(koa_compress_1.default());
app.use(koa_static_1.default('public', {
    index: 'disable',
}));
app.use(koa_bodyparser_1.default());
app.use(router_1.routes);
const httpServer = new http_1.default.Server(app.callback());
websocket_1.wsServer.listen(httpServer);
function start() {
    const port = config_1.config.port || 3000;
    httpServer.listen(port);
    console.info('Listening on', port);
}
start();
//# sourceMappingURL=index.js.map