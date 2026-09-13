import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDefaultHomeSections } from 'apps/dashboard/features/homescreen/api/useDefaultHomeSections';
import { useUpdateDefaultHomeSections } from 'apps/dashboard/features/homescreen/api/useUpdateDefaultHomeSections';
import HomeSectionGenres from 'apps/dashboard/features/homescreen/components/HomeSectionGenres';
import HomeSectionListItem from 'apps/dashboard/features/homescreen/components/HomeSectionListItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { HomeSectionKey } from 'constants/homeSectionKey';
import { getHomeSectionItemKinds, useHomeSectionItems } from 'hooks/api/useHomeSectionItems';
import { useHomeSectionProviders } from 'hooks/api/useHomeSectionProviders';
import globalize from 'lib/globalize';
import type { HomeSectionConfigDto, HomeSectionProviderDto } from 'types/homeSections';

/** A section being edited, with an id that survives reordering. */
interface EditableHomeSection extends HomeSectionConfigDto {
    EditorId: string;
}

export const Component = () => {
    const { data: defaultSections, isPending, isError } = useDefaultHomeSections();
    const { data: providers } = useHomeSectionProviders();
    const { data: sectionItems } = useHomeSectionItems({ kinds: getHomeSectionItemKinds(providers) });
    const updateDefaultHomeSections = useUpdateDefaultHomeSections();

    const nextId = useRef(0);
    const [ sections, setSections ] = useState<EditableHomeSection[]>([]);
    const [ newKey, setNewKey ] = useState('');
    const [ newItemId, setNewItemId ] = useState('');

    const createEditorId = useCallback(() => {
        nextId.current += 1;
        return `home-section-${nextId.current}`;
    }, []);

    useEffect(() => {
        if (!defaultSections) return;

        setSections(defaultSections.map(section => ({
            ...section,
            EditorId: createEditorId()
        })));
    }, [ createEditorId, defaultSections ]);

    const getProvider = useCallback((key: string) => (
        providers?.find(provider => provider.Key === key)
    ), [ providers ]);

    const genreKind = getProvider(HomeSectionKey.Genre)?.ItemKind;

    // What the server can build, less the genres, which are ticked below, and less anything bound
    // to a kind of item this server has none of.
    const availableProviders = useMemo(() => (providers ?? []).filter(provider => (
        provider.Key !== HomeSectionKey.Genre
            && (!provider.ItemKind || sectionItems?.[provider.ItemKind]?.length)
    )), [ providers, sectionItems ]);

    useEffect(() => {
        if (!newKey && availableProviders.length) {
            setNewKey(availableProviders[0].Key);
        }
    }, [ availableProviders, newKey ]);

    const genres = useMemo(() => (genreKind && sectionItems?.[genreKind]) || [], [ genreKind, sectionItems ]);

    const pinnedGenreIds = useMemo(() => new Set(
        sections
            .filter(section => section.Key === HomeSectionKey.Genre && section.ItemId)
            .map(section => section.ItemId as string)
    ), [ sections ]);

    const newProvider = getProvider(newKey);
    const newProviderItems = useMemo(() => (
        (newProvider?.ItemKind && sectionItems?.[newProvider.ItemKind]) || []
    ), [ newProvider, sectionItems ]);

    useEffect(() => {
        setNewItemId(newProviderItems[0]?.Id ?? '');
    }, [ newProviderItems ]);

    const getSectionItemName = useCallback((section: HomeSectionConfigDto) => {
        const kind = getProvider(section.Key)?.ItemKind;
        return (kind && sectionItems?.[kind]?.find(item => item.Id === section.ItemId)?.Name) ?? undefined;
    }, [ getProvider, sectionItems ]);

    const onMove = useCallback((index: number, offset: number) => {
        setSections(current => {
            const target = index + offset;
            if (target < 0 || target >= current.length) return current;

            const moved = [ ...current ];
            [ moved[index], moved[target] ] = [ moved[target], moved[index] ];
            return moved;
        });
    }, []);

    const onRemove = useCallback((index: number) => {
        setSections(current => current.filter((_, i) => i !== index));
    }, []);

    const onToggleActive = useCallback((index: number) => {
        setSections(current => current.map((section, i) => (
            i === index ? { ...section, Active: !section.Active } : section
        )));
    }, []);

    const onMaxItemsChange = useCallback((index: number, maxItems: number | null) => {
        setSections(current => current.map((section, i) => (
            i === index ? { ...section, MaxItems: maxItems } : section
        )));
    }, []);

    const onToggleGenre = useCallback((genreId: string, isPinned: boolean) => {
        setSections(current => {
            if (!isPinned) {
                return current.filter(section => (
                    section.Key !== HomeSectionKey.Genre || section.ItemId !== genreId
                ));
            }

            return [
                ...current,
                {
                    EditorId: createEditorId(),
                    Key: HomeSectionKey.Genre,
                    ItemId: genreId,
                    MaxItems: null,
                    Active: true
                }
            ];
        });
    }, [ createEditorId ]);

    const onNewKeyChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setNewKey(event.target.value);
    }, []);

    const onNewItemChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setNewItemId(event.target.value);
    }, []);

    const onAdd = useCallback(() => {
        setSections(current => [
            ...current,
            {
                EditorId: createEditorId(),
                Key: newKey,
                ItemId: newProvider?.ItemKind ? newItemId : null,
                MaxItems: null,
                Active: true
            }
        ]);
    }, [ createEditorId, newItemId, newKey, newProvider ]);

    const onSave = useCallback(() => {
        updateDefaultHomeSections.mutate(sections.map(section => ({
            Key: section.Key,
            ItemId: section.ItemId,
            MaxItems: section.MaxItems,
            Active: section.Active
        })));
    }, [ sections, updateDefaultHomeSections ]);

    if (isPending) {
        return <Loading />;
    }

    return (
        <Page
            id='homeScreenConfigurationPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('HeaderHomeScreen')}
        >
            <Box className='content-primary'>
                <Stack spacing={3}>
                    <Typography variant='h1'>
                        {globalize.translate('HeaderHomeScreen')}
                    </Typography>

                    {isError ? (
                        <Alert severity='error'>{globalize.translate('ErrorDefault')}</Alert>
                    ) : (
                        <>
                            <Typography>
                                {globalize.translate('DefaultHomeScreenHelp')}
                            </Typography>

                            {updateDefaultHomeSections.isSuccess && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            {updateDefaultHomeSections.isError && (
                                <Alert severity='error'>
                                    {globalize.translate('ErrorDefault')}
                                </Alert>
                            )}

                            <HomeSectionGenres
                                genres={genres}
                                pinnedIds={pinnedGenreIds}
                                onToggle={onToggleGenre}
                            />

                            <Stack direction='row' spacing={2} alignItems='center'>
                                <TextField
                                    select
                                    label={globalize.translate('LabelAddHomeScreenSection')}
                                    value={newKey}
                                    onChange={onNewKeyChange}
                                    sx={{ minWidth: '16em' }}
                                >
                                    {availableProviders.map(provider => (
                                        <MenuItem key={provider.Key} value={provider.Key}>
                                            {provider.Name}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {newProvider?.ItemKind && (
                                    <TextField
                                        select
                                        label={newProvider.Name}
                                        value={newItemId}
                                        onChange={onNewItemChange}
                                        sx={{ minWidth: '16em' }}
                                    >
                                        {newProviderItems.map(item => (
                                            <MenuItem key={item.Id} value={item.Id}>
                                                {item.Name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                <Button
                                    onClick={onAdd}
                                    disabled={!newKey || (!!newProvider?.ItemKind && !newItemId)}
                                >
                                    {globalize.translate('Add')}
                                </Button>
                            </Stack>

                            <List disablePadding>
                                {sections.map((section, index) => (
                                    <HomeSectionListItem
                                        key={section.EditorId}
                                        section={section}
                                        index={index}
                                        name={getProviderName(getProvider(section.Key), section.Key)}
                                        itemName={getSectionItemName(section)}
                                        isFirst={index === 0}
                                        isLast={index === sections.length - 1}
                                        onMove={onMove}
                                        onRemove={onRemove}
                                        onToggleActive={onToggleActive}
                                        onMaxItemsChange={onMaxItemsChange}
                                    />
                                ))}
                            </List>

                            <Button
                                onClick={onSave}
                                disabled={updateDefaultHomeSections.isPending}
                            >
                                {globalize.translate('Save')}
                            </Button>
                        </>
                    )}
                </Stack>
            </Box>
        </Page>
    );
};

/** A row from a plugin that has since been removed still has to be shown as something. */
function getProviderName(provider: HomeSectionProviderDto | undefined, key: string) {
    return provider?.Name || key;
}

Component.displayName = 'HomeScreenPage';
