import type { Api } from '@jellyfin/sdk/lib/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import {
    getHomeSectionsApi,
    type HomeSectionsApiHomeSectionConfigRequest
} from 'utils/sdk/home-sections-api';

export const QUERY_KEY = 'HomeSectionConfig';

const fetchHomeSectionConfig = async (
    api: Api,
    params?: HomeSectionsApiHomeSectionConfigRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getHomeSectionsApi(api)
        .getHomeSectionConfig(params, options);
    return response.data;
};

export const getHomeSectionConfigQuery = (
    api?: Api,
    params?: HomeSectionsApiHomeSectionConfigRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, QUERY_KEY, params ],
    queryFn: ({ signal }) => fetchHomeSectionConfig(api!, params, { signal }),
    enabled: !!api
});

export const useHomeSectionConfig = (
    params?: HomeSectionsApiHomeSectionConfigRequest
) => {
    const { api, user } = useApi();
    return useQuery(getHomeSectionConfigQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
