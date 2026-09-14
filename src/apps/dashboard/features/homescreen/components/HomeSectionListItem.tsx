import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Delete from '@mui/icons-material/Delete';
import Tune from '@mui/icons-material/Tune';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type ChangeEvent, type FC, useCallback, useState } from 'react';

import globalize from 'lib/globalize';
import type { HomeSectionConfigDto } from 'types/homeSections';

import HomeSectionItems from './HomeSectionItems';

interface HomeSectionListItemProps {
    section: HomeSectionConfigDto;
    index: number;
    name: string;
    itemName?: string;
    /** What the section can be bound to, for one that takes several items. */
    pickerItems?: BaseItemDto[];
    isFirst: boolean;
    isLast: boolean;
    onMove: (index: number, offset: number) => void;
    onRemove: (index: number) => void;
    onToggleActive: (index: number) => void;
    onMaxItemsChange: (index: number, maxItems: number | null) => void;
    onToggleItem: (index: number, itemId: string, isChosen: boolean) => void;
    onToggleAllItems: (index: number, chooseAll: boolean) => void;
    onMoveItem: (index: number, itemId: string, offset: number) => void;
}

const HomeSectionListItem: FC<HomeSectionListItemProps> = ({
    section,
    index,
    name,
    itemName,
    pickerItems,
    isFirst,
    isLast,
    onMove,
    onRemove,
    onToggleActive,
    onMaxItemsChange,
    onToggleItem,
    onToggleAllItems,
    onMoveItem
}) => {
    const [ isPickerOpen, setIsPickerOpen ] = useState(false);

    const onMoveUp = useCallback(() => onMove(index, -1), [ index, onMove ]);
    const onMoveDown = useCallback(() => onMove(index, 1), [ index, onMove ]);
    const onRemoveClick = useCallback(() => onRemove(index), [ index, onRemove ]);
    const onVisibilityClick = useCallback(() => onToggleActive(index), [ index, onToggleActive ]);
    const onPickerClick = useCallback(() => setIsPickerOpen(isOpen => !isOpen), []);

    const onMaxItemsInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        onMaxItemsChange(index, Number.isNaN(value) ? null : value);
    }, [ index, onMaxItemsChange ]);

    const onToggle = useCallback((itemId: string, isChosen: boolean) => {
        onToggleItem(index, itemId, isChosen);
    }, [ index, onToggleItem ]);

    const onToggleAll = useCallback((chooseAll: boolean) => {
        onToggleAllItems(index, chooseAll);
    }, [ index, onToggleAllItems ]);

    const onMovePickerItem = useCallback((itemId: string, offset: number) => {
        onMoveItem(index, itemId, offset);
    }, [ index, onMoveItem ]);

    return (
        <>
            <ListItem divider={!pickerItems} disableGutters>
                <ListItemText
                    primary={name}
                    secondary={itemName}
                    sx={{ opacity: section.Active ? 1 : 0.5 }}
                />
                <Stack direction='row' spacing={1} alignItems='center'>
                    <TextField
                        size='small'
                        type='number'
                        inputMode='numeric'
                        label={globalize.translate('LabelMaxItems')}
                        placeholder={globalize.translate('Default')}
                        value={section.MaxItems ?? ''}
                        onChange={onMaxItemsInput}
                        sx={{ width: '10em' }}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max: 100
                            }
                        }}
                    />
                    {pickerItems && (
                        <IconButton
                            title={globalize.translate('ChooseWhatToShow')}
                            color={isPickerOpen ? 'primary' : 'default'}
                            onClick={onPickerClick}
                        >
                            <Tune />
                        </IconButton>
                    )}
                    <IconButton
                        title={globalize.translate(section.Active ? 'Hide' : 'Show')}
                        onClick={onVisibilityClick}
                    >
                        {section.Active ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                    <IconButton
                        title={globalize.translate('Up')}
                        disabled={isFirst}
                        onClick={onMoveUp}
                    >
                        <ArrowUpward />
                    </IconButton>
                    <IconButton
                        title={globalize.translate('Down')}
                        disabled={isLast}
                        onClick={onMoveDown}
                    >
                        <ArrowDownward />
                    </IconButton>
                    <IconButton
                        title={globalize.translate('ButtonRemove')}
                        onClick={onRemoveClick}
                    >
                        <Delete />
                    </IconButton>
                </Stack>
            </ListItem>
            {pickerItems && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Collapse in={isPickerOpen} unmountOnExit>
                        <Box sx={{ paddingLeft: 4, paddingBottom: 2 }}>
                            <HomeSectionItems
                                items={pickerItems}
                                chosenIds={section.ItemIds}
                                onToggle={onToggle}
                                onToggleAll={onToggleAll}
                                onMove={onMovePickerItem}
                            />
                        </Box>
                    </Collapse>
                </Box>
            )}
        </>
    );
};

export default HomeSectionListItem;
