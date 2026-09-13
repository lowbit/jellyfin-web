import type { Api } from '@jellyfin/sdk/lib/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { getHomeSectionsApi } from 'utils/sdk/home-sections-api';

export const QUERY_KEY = 'DefaultHomeSections';

const fetchDefaultHomeSections = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getHomeSectionsApi(api)
        .getDefaultHomeSections(options);
    return response.data;
};

export const getDefaultHomeSectionsQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QUERY_KEY ],
    queryFn: ({ signal }) => fetchDefaultHomeSections(api!, { signal }),
    enabled: !!api
});

export const useDefaultHomeSections = () => {
    const { api } = useApi();
    return useQuery(getDefaultHomeSectionsQuery(api));
};
