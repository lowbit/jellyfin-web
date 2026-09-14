import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import React, { type ChangeEvent, type FC, useCallback, useMemo } from 'react';

import globalize from 'lib/globalize';

interface HomeSectionItemProps {
    item: BaseItemDto;
    /** Where the item sits among the chosen, or -1 when it is not chosen. */
    position: number;
    chosenCount: number;
    onToggle: (itemId: string, isChosen: boolean) => void;
    onMove: (itemId: string, offset: number) => void;
}

const HomeSectionItem: FC<HomeSectionItemProps> = ({ item, position, chosenCount, onToggle, onMove }) => {
    const isChosen = position >= 0;

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (item.Id) onToggle(item.Id, event.target.checked);
    }, [ item.Id, onToggle ]);

    const onMoveUp = useCallback(() => {
        if (item.Id) onMove(item.Id, -1);
    }, [ item.Id, onMove ]);

    const onMoveDown = useCallback(() => {
        if (item.Id) onMove(item.Id, 1);
    }, [ item.Id, onMove ]);

    return (
        <ListItem disableGutters disablePadding>
            <FormControlLabel
                control={<Checkbox checked={isChosen} onChange={onChange} />}
                label={item.Name}
                sx={{ flexGrow: 1 }}
            />
            {isChosen && (
                <>
                    <IconButton
                        title={globalize.translate('Up')}
                        disabled={position === 0}
                        onClick={onMoveUp}
                    >
                        <ArrowUpward />
                    </IconButton>
                    <IconButton
                        title={globalize.translate('Down')}
                        disabled={position === chosenCount - 1}
                        onClick={onMoveDown}
                    >
                        <ArrowDownward />
                    </IconButton>
                </>
            )}
        </ListItem>
    );
};

interface HomeSectionItemsProps {
    /** Everything the section can be bound to. */
    items: BaseItemDto[];
    /** What it is bound to, in row order. */
    chosenIds: string[];
    onToggle: (itemId: string, isChosen: boolean) => void;
    /** Every item on offer, or none. */
    onToggleAll: (chooseAll: boolean) => void;
    onMove: (itemId: string, offset: number) => void;
}

/**
 * The picker of a section that takes several items: what is ticked gets a row, listed first in
 * row order with arrows to change it, then everything else on offer.
 */
const HomeSectionItems: FC<HomeSectionItemsProps> = ({ items, chosenIds, onToggle, onToggleAll, onMove }) => {
    const ordered = useMemo(() => {
        const chosen = chosenIds
            .map(id => items.find(item => item.Id === id))
            .filter((item): item is BaseItemDto => !!item);
        const rest = items.filter(item => !item.Id || !chosenIds.includes(item.Id));
        return [ ...chosen, ...rest ];
    }, [ chosenIds, items ]);

    const chosenCount = items.filter(item => !!item.Id && chosenIds.includes(item.Id)).length;
    const allChosen = items.length > 0 && chosenCount === items.length;

    const onAllChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onToggleAll(event.target.checked);
    }, [ onToggleAll ]);

    if (!items.length) {
        return null;
    }

    return (
        <div>
            <FormControlLabel
                control={(
                    <Checkbox
                        checked={allChosen}
                        indeterminate={chosenCount > 0 && !allChosen}
                        onChange={onAllChange}
                    />
                )}
                label={globalize.translate('SelectAll')}
            />

            <List disablePadding>
                {ordered.map(item => (
                    <HomeSectionItem
                        key={item.Id}
                        item={item}
                        position={item.Id ? chosenIds.indexOf(item.Id) : -1}
                        chosenCount={chosenCount}
                        onToggle={onToggle}
                        onMove={onMove}
                    />
                ))}
            </List>

            <FormHelperText>{globalize.translate('HomeScreenSectionItemsHelp')}</FormHelperText>
        </div>
    );
};

export default HomeSectionItems;
