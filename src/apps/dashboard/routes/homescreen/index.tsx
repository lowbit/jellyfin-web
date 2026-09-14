import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
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
import HomeSectionListItem from 'apps/dashboard/features/homescreen/components/HomeSectionListItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { getHomeSectionItemKinds, useHomeSectionItems } from 'hooks/api/useHomeSectionItems';
import { useHomeSectionProviders } from 'hooks/api/useHomeSectionProviders';
import globalize from 'lib/globalize';
import type { HomeSectionConfigDto, HomeSectionProviderDto } from 'types/homeSections';

/** How many bound items a row names before it switches to a count. */
const MAX_CAPTION_NAMES = 3;

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

    // What the server can build, less anything bound to a kind of item this server has none of.
    const availableProviders = useMemo(() => (providers ?? []).filter(provider => (
        !provider.ItemKind || sectionItems?.[provider.ItemKind]?.length
    )), [ providers, sectionItems ]);

    useEffect(() => {
        if (!newKey && availableProviders.length) {
            setNewKey(availableProviders[0].Key);
        }
    }, [ availableProviders, newKey ]);

    /** What a section that takes several items can be bound to; nothing for any other. */
    const getPickerItems = useCallback((key: string) => {
        const provider = getProvider(key);
        if (!provider?.ItemKind || !provider.AllowsMultipleItems) return undefined;
        return sectionItems?.[provider.ItemKind] ?? [];
    }, [ getProvider, sectionItems ]);

    const newProvider = getProvider(newKey);
    const newProviderItems = useMemo(() => (
        (newProvider?.ItemKind && sectionItems?.[newProvider.ItemKind]) || []
    ), [ newProvider, sectionItems ]);

    useEffect(() => {
        setNewItemId(newProviderItems[0]?.Id ?? '');
    }, [ newProviderItems ]);

    const getSectionItemName = useCallback((section: HomeSectionConfigDto) => {
        const provider = getProvider(section.Key);
        if (!provider?.ItemKind) return undefined;

        const items = sectionItems?.[provider.ItemKind] ?? [];

        if (provider.AllowsMultipleItems) {
            if (!section.ItemIds.length) return globalize.translate('None');
            if (items.length && items.every(item => !!item.Id && section.ItemIds.includes(item.Id))) {
                return globalize.translate('All');
            }
        }

        const names = section.ItemIds
            .map(itemId => items.find(item => item.Id === itemId)?.Name)
            .filter(Boolean);
        const rest = names.length - MAX_CAPTION_NAMES;

        return (rest > 0 ? `${names.slice(0, MAX_CAPTION_NAMES).join(', ')}, +${rest}` : names.join(', ')) || undefined;
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

    const updateSection = useCallback((index: number, update: (section: EditableHomeSection) => EditableHomeSection) => {
        setSections(current => current.map((section, i) => (i === index ? update(section) : section)));
    }, []);

    const onToggleItem = useCallback((index: number, itemId: string, isChosen: boolean) => {
        updateSection(index, section => withItemToggled(section, itemId, isChosen));
    }, [ updateSection ]);

    const onToggleAllItems = useCallback((index: number, chooseAll: boolean) => {
        updateSection(index, section => ({
            ...section,
            ItemIds: chooseAll ? getItemIds(getPickerItems(section.Key) ?? []) : []
        }));
    }, [ getPickerItems, updateSection ]);

    const onMoveItem = useCallback((index: number, itemId: string, offset: number) => {
        updateSection(index, section => withItemMoved(section, itemId, offset));
    }, [ updateSection ]);

    const onNewKeyChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setNewKey(event.target.value);
    }, []);

    const onNewItemChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setNewItemId(event.target.value);
    }, []);

    const onAdd = useCallback(() => {
        // A section that takes several items starts with all of them, so adding it needs no more,
        // and is on the layout once.
        let itemIds: string[] = [];
        if (newProvider?.ItemKind && newProvider.AllowsMultipleItems) {
            itemIds = getItemIds(newProviderItems);
        } else if (newProvider?.ItemKind) {
            itemIds = [ newItemId ];
        }

        setSections(current => {
            if (newProvider?.AllowsMultipleItems && current.some(section => section.Key === newKey)) return current;

            return [
                ...current,
                {
                    EditorId: createEditorId(),
                    Key: newKey,
                    ItemIds: itemIds,
                    MaxItems: null,
                    Active: true
                }
            ];
        });
    }, [ createEditorId, newItemId, newKey, newProvider, newProviderItems ]);

    const onSave = useCallback(() => {
        updateDefaultHomeSections.mutate(sections.map(section => ({
            Key: section.Key,
            ItemIds: section.ItemIds,
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

                                {newProvider?.ItemKind && !newProvider.AllowsMultipleItems && (
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
                                    disabled={!newKey || (!!newProvider?.ItemKind && !newProvider.AllowsMultipleItems && !newItemId)}
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
                                        pickerItems={getPickerItems(section.Key)}
                                        isFirst={index === 0}
                                        isLast={index === sections.length - 1}
                                        onMove={onMove}
                                        onRemove={onRemove}
                                        onToggleActive={onToggleActive}
                                        onMaxItemsChange={onMaxItemsChange}
                                        onToggleItem={onToggleItem}
                                        onToggleAllItems={onToggleAllItems}
                                        onMoveItem={onMoveItem}
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

function getItemIds(items: BaseItemDto[]) {
    return items.map(item => item.Id).filter((id): id is string => !!id);
}

/** Adds or removes one item of a section that takes several; an added one goes last. */
function withItemToggled(section: EditableHomeSection, itemId: string, isChosen: boolean) {
    const itemIds = section.ItemIds.filter(id => id !== itemId);
    return { ...section, ItemIds: isChosen ? [ ...itemIds, itemId ] : itemIds };
}

/** Moves one of a section's items a step up or down its rows. */
function withItemMoved(section: EditableHomeSection, itemId: string, offset: number) {
    const from = section.ItemIds.indexOf(itemId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= section.ItemIds.length) return section;

    const itemIds = [ ...section.ItemIds ];
    itemIds.splice(from, 1);
    itemIds.splice(to, 0, itemId);
    return { ...section, ItemIds: itemIds };
}

/** A row from a plugin that has since been removed still has to be shown as something. */
function getProviderName(provider: HomeSectionProviderDto | undefined, key: string) {
    return provider?.Name || key;
}

Component.displayName = 'HomeScreenPage';
