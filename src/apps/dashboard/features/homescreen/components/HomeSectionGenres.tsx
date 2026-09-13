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
    isPinned: boolean;
    onToggle: (genreId: string, isPinned: boolean) => void;
}

const HomeSectionGenre: FC<HomeSectionGenreProps> = ({ genre, isPinned, onToggle }) => {
    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (genre.Id) onToggle(genre.Id, event.target.checked);
    }, [ genre.Id, onToggle ]);

    return (
        <FormControlLabel
            control={<Checkbox checked={isPinned} onChange={onChange} />}
            label={genre.Name}
            sx={{ width: '14em' }}
        />
    );
};

interface HomeSectionGenresProps {
    genres: BaseItemDto[];
    pinnedIds: Set<string>;
    onToggle: (genreId: string, isPinned: boolean) => void;
}

/** The genres that have a row, as a list rather than one dropdown choice at a time. */
const HomeSectionGenres: FC<HomeSectionGenresProps> = ({ genres, pinnedIds, onToggle }) => {
    if (!genres.length) {
        return null;
    }

    return (
        <div>
            <Typography variant='h2' sx={{ marginBottom: 1 }}>
                {globalize.translate('Genres')}
            </Typography>

            <FormGroup row>
                {genres.map(genre => (
                    <HomeSectionGenre
                        key={genre.Id}
                        genre={genre}
                        isPinned={!!genre.Id && pinnedIds.has(genre.Id)}
                        onToggle={onToggle}
                    />
                ))}
            </FormGroup>

            <FormHelperText>{globalize.translate('HomeScreenGenresHelp')}</FormHelperText>
        </div>
    );
};

export default HomeSectionGenres;
