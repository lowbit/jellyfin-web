// FIXME: This file should be removed once the home sections endpoints are in the OpenAPI spec.
import type { Api } from '@jellyfin/sdk/lib/api';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import type { HomeSectionConfigDto, HomeSectionDto, HomeSectionProviderDto } from 'types/homeSections';

export interface HomeSectionsApiGetHomeSectionsRequest {
    userId?: string;
    client?: string;
    /** The number of items per section, for sections that set no limit of their own. */
    itemLimit?: number;
    /** Only the sections with these provider keys, such as the ones a change message named. */
    keys?: string[];
}

export interface HomeSectionsApiHomeSectionConfigRequest {
    userId?: string;
    client?: string;
}

function request<T>(api: Api, config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const { baseOptions } = api.configuration;

    return api.axiosInstance.request<T>({
        ...baseOptions,
        ...options,
        ...config,
        baseURL: api.basePath,
        headers: {
            ...baseOptions?.headers,
            ...options?.headers
        }
    });
}

export const getHomeSectionsApi = (api: Api) => ({
    /** Gets the sections to draw, with their items. */
    getHomeSections: (
        params?: HomeSectionsApiGetHomeSectionsRequest,
        options?: AxiosRequestConfig
    ) => request<HomeSectionDto[]>(api, {
        method: 'GET',
        url: '/HomeSections',
        // Axios would send keys[]=, the server reads a comma separated list
        params: { ...params, keys: params?.keys?.join(',') }
    }, options),

    /** Gets the kinds of section the server can build, including any from plugins. */
    getHomeSectionProviders: (
        options?: AxiosRequestConfig
    ) => request<HomeSectionProviderDto[]>(api, {
        method: 'GET',
        url: '/HomeSections/Providers'
    }, options),

    /** Gets a user's layout, including the sections they have hidden. */
    getHomeSectionConfig: (
        params?: HomeSectionsApiHomeSectionConfigRequest,
        options?: AxiosRequestConfig
    ) => request<HomeSectionConfigDto[]>(api, {
        method: 'GET',
        url: '/HomeSections/Config',
        params
    }, options),

    /** Replaces a user's layout. Display order is the list order. */
    updateHomeSectionConfig: (
        sections: HomeSectionConfigDto[],
        params?: HomeSectionsApiHomeSectionConfigRequest,
        options?: AxiosRequestConfig
    ) => request<void>(api, {
        method: 'POST',
        url: '/HomeSections/Config',
        params,
        data: sections
    }, options),

    /** Clears a user's layout so the defaults apply again. */
    resetHomeSectionConfig: (
        params?: HomeSectionsApiHomeSectionConfigRequest,
        options?: AxiosRequestConfig
    ) => request<void>(api, {
        method: 'DELETE',
        url: '/HomeSections/Config',
        params
    }, options),

    /** Gets the layout new users start with. Requires elevation. */
    getDefaultHomeSections: (
        options?: AxiosRequestConfig
    ) => request<HomeSectionConfigDto[]>(api, {
        method: 'GET',
        url: '/HomeSections/Defaults'
    }, options),

    /** Sets the layout new users start with. An empty list restores the built-in one. */
    updateDefaultHomeSections: (
        sections: HomeSectionConfigDto[],
        options?: AxiosRequestConfig
    ) => request<void>(api, {
        method: 'POST',
        url: '/HomeSections/Defaults',
        data: sections
    }, options)
});
