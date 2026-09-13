import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { HomeSectionConfigDto } from 'types/homeSections';
import { queryClient } from 'utils/query/queryClient';
import { getHomeSectionsApi } from 'utils/sdk/home-sections-api';

import { QUERY_KEY } from './useDefaultHomeSections';

export const useUpdateDefaultHomeSections = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (sections: HomeSectionConfigDto[]) => (
            getHomeSectionsApi(api!)
                .updateDefaultHomeSections(sections)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
