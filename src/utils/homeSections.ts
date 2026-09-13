import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

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
