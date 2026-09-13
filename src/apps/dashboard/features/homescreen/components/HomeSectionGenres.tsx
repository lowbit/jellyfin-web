import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import React, { type ChangeEvent, type FC, useCallback } from 'react';

import globalize from 'lib/globalize';

interface HomeSectionGenreProps {
    genre: BaseItemDto;
    isChosen: boolean;
    onToggle: (genreId: string, isChosen: boolean) => void;
}

const HomeSectionGenre: FC<HomeSectionGenreProps> = ({ genre, isChosen, onToggle }) => {
    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (genre.Id) onToggle(genre.Id, event.target.checked);
    }, [ genre.Id, onToggle ]);

    return (
        <FormControlLabel
            control={<Checkbox checked={isChosen} onChange={onChange} />}
            label={genre.Name}
            sx={{ width: '14em' }}
        />
    );
};

interface HomeSectionGenresProps {
    genres: BaseItemDto[];
    chosenIds: Set<string>;
    onToggle: (genreId: string, isChosen: boolean) => void;
    /** Every genre on offer, or none. */
    onToggleAll: (chooseAll: boolean) => void;
}

/** Which genres get a row, each ticked one in its own. */
const HomeSectionGenres: FC<HomeSectionGenresProps> = ({ genres, chosenIds, onToggle, onToggleAll }) => {
    const chosenCount = genres.filter(genre => !!genre.Id && chosenIds.has(genre.Id)).length;
    const allChosen = genres.length > 0 && chosenCount === genres.length;

    const onAllChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onToggleAll(event.target.checked);
    }, [ onToggleAll ]);

    if (!genres.length) {
        return null;
    }

    return (
        <div>
            <Typography variant='h2' sx={{ marginBottom: 1 }}>
                {globalize.translate('Genres')}
            </Typography>

            <FormControlLabel
                control={(
                    <Checkbox
                        checked={allChosen}
                        indeterminate={chosenCount > 0 && !allChosen}
                        onChange={onAllChange}
                    />
                )}
                label={globalize.translate('SelectAll')}
                sx={{ marginBottom: 1 }}
            />

            <FormGroup row>
                {genres.map(genre => (
                    <HomeSectionGenre
                        key={genre.Id}
                        genre={genre}
                        isChosen={!!genre.Id && chosenIds.has(genre.Id)}
                        onToggle={onToggle}
                    />
                ))}
            </FormGroup>

            <FormHelperText>{globalize.translate('HomeScreenGenresHelp')}</FormHelperText>
        </div>
    );
};

export default HomeSectionGenres;
