import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { describe, expect, it } from 'vitest';

import { withoutCoveredGenres } from './homeSections';

const genres = (...names: string[]): BaseItemDto[] => names.map(name => ({ Id: name, Name: name }));
const names = (items: BaseItemDto[]) => items.map(item => item.Name);

describe('withoutCoveredGenres', () => {
    it('Should hide a television genre when the film genre covering it exists', () => {
        const result = withoutCoveredGenres(genres('Action', 'Action & Adventure', 'Drama'));

        expect(names(result)).toEqual([ 'Action', 'Drama' ]);
    });

    it('Should keep a television genre when nothing covers it', () => {
        // A library of nothing but shows has no film genre to fold these into.
        const result = withoutCoveredGenres(genres('Action & Adventure', 'Sci-Fi & Fantasy', 'Kids'));

        expect(names(result)).toEqual([ 'Action & Adventure', 'Sci-Fi & Fantasy', 'Kids' ]);
    });

    it('Should hide each compound genre that has a cover, and keep the rest', () => {
        const result = withoutCoveredGenres(genres(
            'Fantasy',
            'Sci-Fi & Fantasy',
            'War & Politics',
            'Family',
            'Kids'
        ));

        // Sci-Fi & Fantasy is covered by Fantasy and Kids by Family, but nothing covers
        // War & Politics without a War genre.
        expect(names(result)).toEqual([ 'Fantasy', 'War & Politics', 'Family' ]);
    });

    it('Should leave a list without compound genres untouched', () => {
        const result = withoutCoveredGenres(genres('Comedy', 'Horror', 'Western'));

        expect(names(result)).toEqual([ 'Comedy', 'Horror', 'Western' ]);
    });

    it('Should tolerate a genre with no name', () => {
        const result = withoutCoveredGenres([ { Id: 'a' }, ...genres('Action') ]);

        expect(result).toHaveLength(2);
    });
});
