import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Bookmarks API contract (frontend wiring)', () => {
    const apiFile = path.resolve(__dirname, '../src/lib/api.ts');
    const source = fs.readFileSync(apiFile, 'utf8');

    it('uses canonical list endpoint', () => {
        expect(source).toContain("return apiRequest('/api/bookmarks');");
    });

    it('uses canonical add endpoint payload', () => {
        expect(source).toContain("return apiRequest('/api/bookmarks', {");
        expect(source).toContain("body: JSON.stringify({ itemId, type })");
    });

    it('uses canonical remove-by-item endpoint', () => {
        expect(source).toContain('`/api/bookmarks/item/${itemId}`');
    });
});
