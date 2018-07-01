"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nedb_1 = __importDefault(require("nedb"));
const path_1 = __importDefault(require("path"));
const promisify_1 = require("./promisify");
const cache = {};
function Database(name) {
    cache[name] =
        cache[name] ||
            promisify_1.promisifyAll(new nedb_1.default({
                filename: path_1.default.resolve(__dirname, '../../data/', name),
                timestampData: true,
                autoload: true,
            }));
    const db = cache[name];
    db.persistence.setAutocompactionInterval(1000 * 60 * 60);
    return {
        name,
        add: item => db.insertAsync(item),
        find: query => db.findAsync(query),
        findOne: query => db.findOneAsync(query),
        findAll: () => db.findAsync({}),
        remove: query => db.removeAsync(query),
        removeMulti: query => db.removeAsync(query, { multi: true }),
        update: (query, item) => db.updateAsync(query, item),
        upsert: (query, item) => db.updateAsync(query, item, { upsert: true }),
        setIndex(field) {
            db.ensureIndex({
                filename: field,
                unique: true,
            });
        },
    };
}
exports.Database = Database;
//# sourceMappingURL=database.js.map