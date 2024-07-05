"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterIn = exports.add = void 0;
/**
 * Adds two numbers and returns the result.
 * @param a - The first number.
 * @param b - The second number.
 * @returns The sum of the two numbers.
 */
function add(a, b) {
    return a + b;
}
exports.add = add;
function filterIn(sourceArray, targetArray) {
    return sourceArray.filter(item => targetArray.includes(item));
}
exports.filterIn = filterIn;
