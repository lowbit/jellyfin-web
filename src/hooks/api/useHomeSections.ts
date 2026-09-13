import type { Api } from '@jellyfin/sdk/lib/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import {
    getHomeSectionsApi,
    type HomeSectionsApiGetHomeSectionsRequest
} from 'utils/sdk/home-sections-api';

export const QUERY_KEY = 'HomeSections';

const fetchHomeSections = async (
    api: Api,
    params?: HomeSectionsApiGetHomeSectionsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getHomeSectionsApi(api)
        .getHomeSections(params, options);
    return response.data;
};

export const getHomeSectionsQuery = (
    api?: Api,
    params?: HomeSectionsApiGetHomeSectionsRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, QUERY_KEY, params ],
    queryFn: ({ signal }) => fetchHomeSections(api!, params, { signal }),
    enabled: !!api
});

export const useHomeSections = (
    params?: HomeSectionsApiGetHomeSectionsRequest
) => {
    const { api, user } = useApi();
    return useQuery(getHomeSectionsQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
