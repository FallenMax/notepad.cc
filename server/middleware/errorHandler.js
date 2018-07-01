"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env = process.env.NODE_ENV || 'dev';
const isDev = /dev/.test(env);
function error() {
    return async function (ctx, next) {
        try {
            await next();
        }
        catch (e) {
            console.error(e);
            ctx.response.body = isDev
                ? (e && e.message) || JSON.stringify(e)
                : 'error';
            ctx.response.status = 500;
        }
    };
}
exports.error = error;
//# sourceMappingURL=errorHandler.js.map