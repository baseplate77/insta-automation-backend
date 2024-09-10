"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const delay = (delayInms) => {
    return new Promise((resolve) => setTimeout(resolve, delayInms));
};
exports.default = delay;
