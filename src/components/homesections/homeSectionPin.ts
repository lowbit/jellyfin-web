import type { Api } from '@jellyfin/sdk/lib/api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import { getHomeSectionConfigQuery } from 'hooks/api/useHomeSectionConfig';
import { getHomeSectionProvidersQuery } from 'hooks/api/useHomeSectionProviders';
import { getPinProvider, isPinnedToHome, withItemPinned, withItemUnpinned } from 'utils/homeSections';
import { queryClient } from 'utils/query/queryClient';
import { getHomeSectionsApi } from 'utils/sdk/home-sections-api';

/** The providers change with the plugins, not between two menu openings. */
const PROVIDERS_STALE_TIME = 5 * 60 * 1000;

/**
 * Whether an item can be pinned to the home screen and whether it is: `undefined` when no list
 * section takes its kind (so no menu entry), otherwise true when the layout shows it as a row.
 */
export async function getHomePinState(api: Api, userId: string, item: BaseItemDto) {
    const providers = await queryClient.fetchQuery({
        ...getHomeSectionProvidersQuery(api),
        staleTime: PROVIDERS_STALE_TIME
    });
    const provider = getPinProvider(providers, item);
    if (!provider || !item.Id) return undefined;

    const sections = await queryClient.fetchQuery(getHomeSectionConfigQuery(api, { userId }));
    return isPinnedToHome(sections, provider.Key, item.Id);
}

/**
 * Pins the item as the last row of its list section, or takes it off the home screen when it
 * is there already. Returns whether it is pinned afterwards.
 */
export async function toggleHomePin(api: Api, userId: string, item: BaseItemDto) {
    const providers = await queryClient.fetchQuery({
        ...getHomeSectionProvidersQuery(api),
        staleTime: PROVIDERS_STALE_TIME
    });
    const provider = getPinProvider(providers, item);
    if (!provider || !item.Id) throw new Error(`Nothing on the home screen takes a ${item.Type}`);

    const sections = await queryClient.fetchQuery(getHomeSectionConfigQuery(api, { userId }));
    const isPinned = isPinnedToHome(sections, provider.Key, item.Id);
    const layout = isPinned ?
        withItemUnpinned(sections, provider.Key, item.Id) :
        withItemPinned(sections, provider.Key, item.Id);

    await getHomeSectionsApi(api).updateHomeSectionConfig(layout, { userId });
    await queryClient.invalidateQueries({ queryKey: [ 'User', userId ] });

    return !isPinned;
}
