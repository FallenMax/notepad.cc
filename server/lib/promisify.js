"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function promisify(object, method) {
    object[method + 'Async'] = (...args) => new Promise((resolve, reject) => {
        object[method](...args.concat((err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        }));
    });
}
exports.promisify = promisify;
function promisifyAll(object) {
    for (var key in object) {
        if (!(key in {}) && typeof object[key] === 'function') {
            promisify(object, key);
        }
    }
    return object;
}
exports.promisifyAll = promisifyAll;
//# sourceMappingURL=promisify.js.map