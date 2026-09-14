import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { describe, expect, it } from 'vitest';

import { getPinProvider, isPinnedToHome, withItemPinned, withItemUnpinned, withoutCoveredGenres } from './homeSections';

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

const section = (key: string, itemIds: string[] = [], active = true) => ({ Key: key, ItemIds: itemIds, MaxItems: null, Active: active });

describe('pinning an item to the home screen', () => {
    const providers = [
        { Key: 'resume', Name: 'Continue Watching' },
        { Key: 'pinnedcollection', Name: 'Collections', ItemKind: 'BoxSet' as const, AllowsMultipleItems: true },
        { Key: 'plugin.person', Name: 'Person', ItemKind: 'Person' as const, AllowsMultipleItems: false }
    ];

    it('Should find the list section for the kind of item, and nothing for the rest', () => {
        expect(getPinProvider(providers, { Type: 'BoxSet' })?.Key).toBe('pinnedcollection');
        // A section that takes exactly one item is not a list to pin to.
        expect(getPinProvider(providers, { Type: 'Person' })).toBeUndefined();
        expect(getPinProvider(providers, { Type: 'Movie' })).toBeUndefined();
    });

    it('Should count an item as pinned only in an active section', () => {
        expect(isPinnedToHome([ section('pinnedcollection', [ 'a' ]) ], 'pinnedcollection', 'a')).toBe(true);
        expect(isPinnedToHome([ section('pinnedcollection', [ 'a' ], false) ], 'pinnedcollection', 'a')).toBe(false);
        expect(isPinnedToHome([ section('pinnedcollection', [ 'b' ]) ], 'pinnedcollection', 'a')).toBe(false);
    });

    it('Should pin as the last row of the section, unhiding it', () => {
        const layout = [ section('resume'), section('pinnedcollection', [ 'a', 'b' ], false), section('nextup') ];

        expect(withItemPinned(layout, 'pinnedcollection', 'c')).toEqual([
            section('resume'),
            section('pinnedcollection', [ 'a', 'b', 'c' ]),
            section('nextup')
        ]);
    });

    it('Should add the section at the end when the layout has none', () => {
        expect(withItemPinned([ section('resume') ], 'pinnedcollection', 'c')).toEqual([
            section('resume'),
            section('pinnedcollection', [ 'c' ])
        ]);
    });

    it('Should unpin, and drop the section once it is empty', () => {
        const layout = [ section('resume'), section('pinnedcollection', [ 'a', 'b' ]) ];

        expect(withItemUnpinned(layout, 'pinnedcollection', 'a')).toEqual([ section('resume'), section('pinnedcollection', [ 'b' ]) ]);
        expect(withItemUnpinned(withItemUnpinned(layout, 'pinnedcollection', 'a'), 'pinnedcollection', 'b')).toEqual([ section('resume') ]);
    });
});
