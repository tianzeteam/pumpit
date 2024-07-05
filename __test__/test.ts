import {add, filterIn} from "../src/math";



describe("Math functions", () => {

    it("should add 5 by 3", () => {
        const result = add(5, 3);
        expect(result).toEqual(8);
    });
});

describe('filterIn', () => {
    it('should filter out elements from the source array that are not in the target array', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['banana', 'date', 'fig', 'grape'];

        const result = filterIn(sourceArray, targetArray);

        expect(result).toEqual(['banana', 'date']);
    });

    it('should return an empty array if no elements match', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['fig', 'grape', 'kiwi'];

        const result = filterIn(sourceArray, targetArray);

        expect(result).toEqual([]);
    });

    it('should return the source array if all elements match', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray = ['apple', 'banana', 'cherry', 'date'];

        const result = filterIn(sourceArray, targetArray);

        expect(result).toEqual(['apple', 'banana', 'cherry', 'date']);
    });

    it('should return an empty array if the source array is empty', () => {
        const sourceArray: string[] = [];
        const targetArray = ['banana', 'date', 'fig', 'grape'];

        const result = filterIn(sourceArray, targetArray);

        expect(result).toEqual([]);
    });

    it('should return an empty array if the target array is empty', () => {
        const sourceArray = ['apple', 'banana', 'cherry', 'date'];
        const targetArray: string[] = [];

        const result = filterIn(sourceArray, targetArray);

        expect(result).toEqual([]);
    });
});