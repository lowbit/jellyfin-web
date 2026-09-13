import type { Api } from '@jellyfin/sdk/lib/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { getHomeSectionsApi } from 'utils/sdk/home-sections-api';

export const QUERY_KEY = 'HomeSectionProviders';

const fetchHomeSectionProviders = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getHomeSectionsApi(api)
        .getHomeSectionProviders(options);
    return response.data;
};

/** The kinds of section the server can build. Not per user, so the key carries no user id. */
export const getHomeSectionProvidersQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QUERY_KEY ],
    queryFn: ({ signal }) => fetchHomeSectionProviders(api!, { signal }),
    enabled: !!api
});

export const useHomeSectionProviders = () => {
    const { api } = useApi();
    return useQuery(getHomeSectionProvidersQuery(api));
};
