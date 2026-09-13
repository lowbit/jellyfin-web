import type { Api } from '@jellyfin/sdk/lib/api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';
import { getStudioApi } from '@jellyfin/sdk/lib/utils/api/studio-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import type { HomeSectionProviderDto } from 'types/homeSections';
import { withoutCoveredGenres } from 'utils/homeSections';

export const QUERY_KEY = 'HomeSectionItems';

/** The items a section can be bound to, by the kind of item its provider asks for. */
export type HomeSectionItems = Partial<Record<BaseItemKind, BaseItemDto[]>>;

interface HomeSectionItemsRequest {
    userId?: string;
    /** The kinds the providers ask for. Read from the providers rather than a fixed list. */
    kinds?: BaseItemKind[];
}

/** The kinds of item a section can be bound to, given what the server offers. */
export const getHomeSectionItemKinds = (providers?: HomeSectionProviderDto[]) => (
    [ ...new Set(
        (providers ?? [])
            .map(provider => provider.ItemKind)
            .filter((kind): kind is BaseItemKind => !!kind)
    ) ]
);

const fetchItemsOfKind = async (
    api: Api,
    kind: BaseItemKind,
    userId?: string,
    options?: AxiosRequestConfig
): Promise<BaseItemDto[]> => {
    const params = {
        userId,
        sortBy: [ ItemSortBy.SortName ],
        enableTotalRecordCount: false
    };

    // The kinds that are not items in their own right have their own endpoints.
    switch (kind) {
        case BaseItemKind.Genre: {
            // Only the genres the server builds a section from.
            const genres = await getGenreApi(api).getGenres({
                ...params,
                includeItemTypes: [ BaseItemKind.Movie, BaseItemKind.Series ]
            }, options);
            return withoutCoveredGenres(genres.data.Items || []);
        }
        case BaseItemKind.Studio: {
            const studios = await getStudioApi(api).getStudios({ userId, enableTotalRecordCount: false }, options);
            return studios.data.Items || [];
        }
        case BaseItemKind.Person: {
            const persons = await getPersonApi(api).getPersons({ userId }, options);
            return persons.data.Items || [];
        }
        default: {
            const items = await getLibraryApi(api).getItems({
                ...params,
                includeItemTypes: [ kind ],
                recursive: true
            }, options);
            return items.data.Items || [];
        }
    }
};

const fetchHomeSectionItems = async (
    api: Api,
    params?: HomeSectionItemsRequest,
    options?: AxiosRequestConfig
): Promise<HomeSectionItems> => {
    const kinds = params?.kinds ?? [];
    const lists = await Promise.all(kinds.map(kind => fetchItemsOfKind(api, kind, params?.userId, options)));

    return Object.fromEntries(kinds.map((kind, index) => [ kind, lists[index] ]));
};

export const getHomeSectionItemsQuery = (
    api?: Api,
    params?: HomeSectionItemsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, QUERY_KEY, params?.kinds ],
    queryFn: ({ signal }) => fetchHomeSectionItems(api!, params, { signal }),
    enabled: !!api && !!params?.kinds
});

export const useHomeSectionItems = (
    params?: HomeSectionItemsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getHomeSectionItemsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
