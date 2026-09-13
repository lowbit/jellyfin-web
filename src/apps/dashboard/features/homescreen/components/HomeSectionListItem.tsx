import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type ChangeEvent, type FC, useCallback } from 'react';

import globalize from 'lib/globalize';
import type { HomeSectionConfigDto } from 'types/homeSections';

interface HomeSectionListItemProps {
    section: HomeSectionConfigDto;
    index: number;
    name: string;
    itemName?: string;
    isFirst: boolean;
    isLast: boolean;
    onMove: (index: number, offset: number) => void;
    onRemove: (index: number) => void;
    onToggleActive: (index: number) => void;
    onMaxItemsChange: (index: number, maxItems: number | null) => void;
}

const HomeSectionListItem: FC<HomeSectionListItemProps> = ({
    section,
    index,
    name,
    itemName,
    isFirst,
    isLast,
    onMove,
    onRemove,
    onToggleActive,
    onMaxItemsChange
}) => {
    const onMoveUp = useCallback(() => onMove(index, -1), [ index, onMove ]);
    const onMoveDown = useCallback(() => onMove(index, 1), [ index, onMove ]);
    const onRemoveClick = useCallback(() => onRemove(index), [ index, onRemove ]);
    const onVisibilityClick = useCallback(() => onToggleActive(index), [ index, onToggleActive ]);

    const onMaxItemsInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        onMaxItemsChange(index, Number.isNaN(value) ? null : value);
    }, [ index, onMaxItemsChange ]);

    return (
        <ListItem divider disableGutters>
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
    );
};

export default HomeSectionListItem;
