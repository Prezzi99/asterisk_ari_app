export function testRegExp(pairs) {
    for (let item of pairs) {
        const regex = item[0];
        const values = item[1];

        for (let item of values) {
            if (!regex.test(item)) return false;
        }
    }

    return true
}