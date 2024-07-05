"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("../src/math");
describe("Math functions", () => {
    it("should add 5 by 3", () => {
        const result = (0, math_1.add)(5, 3);
        expect(result).toEqual(8);
    });
});
describe('filterIn', () => {
    it('should filter out elements from the source array that are not in the target array', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['banana', 'date', 'fig', 'grape'];
        const result = (0, math_1.filterIn)(sourceArray, targetArray);
        expect(result).toEqual(['banana', 'date']);
    });
    it('should return an empty array if no elements match', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['fig', 'grape', 'kiwi'];
        const result = (0, math_1.filterIn)(sourceArray, targetArray);
        expect(result).toEqual([]);
    });
    it('should return the source array if all elements match', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['apple', 'banana', 'cherry', 'date'];
        const result = (0, math_1.filterIn)(sourceArray, targetArray);
        expect(result).toEqual(['apple', 'banana', 'cherry', 'date']);
    });
    it('should return an empty array if the source array is empty', () => {
        const sourceArray = [];
        const targetArray = ['banana', 'date', 'fig', 'grape'];
        const result = (0, math_1.filterIn)(sourceArray, targetArray);
        expect(result).toEqual([]);
    });
    it('should return an empty array if the target array is empty', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = [];
        const result = (0, math_1.filterIn)(sourceArray, targetArray);
        expect(result).toEqual([]);
    });
});
