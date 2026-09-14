import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import type { HomeSectionConfigDto, HomeSectionProviderDto } from 'types/homeSections';

/**
 * The television genres the server folds into a film genre, and the genres that cover them.
 *
 * Films and shows are tagged from different vocabularies, so the server pulls the television
 * genre into the row bound to its film equivalent. Offering both would put a near duplicate row
 * next to the one that already holds those shows.
 */
const COVERED_GENRES: Record<string, string[]> = {
    'Action & Adventure': [ 'Action', 'Adventure' ],
    'Sci-Fi & Fantasy': [ 'Science Fiction', 'Fantasy' ],
    'War & Politics': [ 'War' ],
    Kids: [ 'Family' ]
};

/**
 * Drops the genres that another genre in the list already covers.
 *
 * A covered genre is only dropped when the genre covering it is present, so a library of nothing
 * but shows keeps its own rows.
 *
 * @param genres The genres the library has.
 * @returns The genres worth offering as rows.
 */
export function withoutCoveredGenres(genres: BaseItemDto[]) {
    const names = new Set(genres.map(genre => genre.Name));

    return genres.filter(genre => (
        !COVERED_GENRES[genre.Name ?? '']?.some(covering => names.has(covering))
    ));
}

/** The list section an item of this kind is pinned to, if the server offers one. */
export function getPinProvider(providers: HomeSectionProviderDto[], item: BaseItemDto) {
    return providers.find(provider => (
        !!provider.ItemKind && !!provider.AllowsMultipleItems && provider.ItemKind === item.Type
    ));
}

/** Whether a layout shows the item as a row: in an active list section of its kind. */
export function isPinnedToHome(sections: HomeSectionConfigDto[], key: string, itemId: string) {
    return sections.some(section => (
        section.Key === key && section.Active && section.ItemIds.includes(itemId)
    ));
}

/**
 * Adds an item as the last row of its list section, unhiding the section, or adds that
 * section at the end of the layout when there is none.
 */
export function withItemPinned(sections: HomeSectionConfigDto[], key: string, itemId: string): HomeSectionConfigDto[] {
    if (!sections.some(section => section.Key === key)) {
        return [ ...sections, { Key: key, ItemIds: [ itemId ], MaxItems: null, Active: true } ];
    }

    return sections.map(section => {
        if (section.Key !== key) return section;

        const itemIds = section.ItemIds.filter(id => id !== itemId);
        return { ...section, ItemIds: [ ...itemIds, itemId ], Active: true };
    });
}

/** Takes an item's row away, and the section with it once nothing is left in it. */
export function withItemUnpinned(sections: HomeSectionConfigDto[], key: string, itemId: string): HomeSectionConfigDto[] {
    return sections
        .map(section => (
            section.Key === key ? { ...section, ItemIds: section.ItemIds.filter(id => id !== itemId) } : section
        ))
        .filter(section => section.Key !== key || section.ItemIds.length > 0);
}
