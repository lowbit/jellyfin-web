import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import { HomeSectionKey } from 'constants/homeSectionKey';
import type { UserSettings } from 'scripts/settings/userSettings';
import { type HomeSectionDto, HomeSectionViewType } from 'types/homeSections';

import type { SectionContainerElement, SectionOptions } from './section';

/** The item types the parameterised sections are bound to, so their heading can link somewhere. */
const PARENT_ITEM_TYPES: Record<string, string> = {
    [HomeSectionKey.PinnedCollection]: 'BoxSet',
    [HomeSectionKey.Genre]: 'Genre',
    // Whatever was watched, which the details page handles for any kind of item.
    [HomeSectionKey.BecauseYouWatched]: 'Movie'
};

function getShape(viewType: HomeSectionViewType, enableOverflow: boolean) {
    switch (viewType) {
        case HomeSectionViewType.Landscape:
            return getBackdropShape(enableOverflow);
        case HomeSectionViewType.Square:
            return getSquareShape(enableOverflow);
        default:
            return getPortraitShape(enableOverflow);
    }
}

function getSectionUrl(section: HomeSectionDto, serverId: string) {
    if (section.Key === HomeSectionKey.NextUp) {
        return appRouter.getRouteUrl('nextup', { serverId });
    }

    const itemType = PARENT_ITEM_TYPES[section.Key];
    if (section.ParentId && itemType) {
        return appRouter.getRouteUrl({
            Id: section.ParentId,
            Type: itemType,
            ServerId: serverId
        });
    }

    return null;
}

function getSectionTitleHtml(section: HomeSectionDto, serverId: string) {
    const title = escapeHtml(section.DisplayText);
    const url = layoutManager.tv ? null : getSectionUrl(section, serverId);

    let html = '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

    if (url) {
        html += `<a is="emby-linkbutton" href="${url}" class="more button-flat button-flat-mini sectionTitleTextButton">`;
        html += `<h2 class="sectionTitle sectionTitle-cards">${title}</h2>`;
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    } else {
        html += `<h2 class="sectionTitle sectionTitle-cards">${title}</h2>`;
    }

    html += '</div>';

    return html;
}

function getItemsHtmlFn(
    section: HomeSectionDto,
    userSettings: UserSettings,
    { enableOverflow }: SectionOptions
) {
    const isLandscape = section.ViewType === HomeSectionViewType.Landscape;
    // Episode rows can show the episode image or the one inherited from the series, which is a
    // user preference rather than something the server decides.
    const inheritThumb = isLandscape && !userSettings.useEpisodeImagesInNextUpAndResume();

    return function (items: BaseItemDto[]) {
        return cardBuilder.getCardsHtml({
            items: items,
            shape: getShape(section.ViewType, enableOverflow),
            preferThumb: isLandscape,
            inheritThumb: inheritThumb,
            showTitle: true,
            showParentTitle: true,
            showYear: !isLandscape,
            overlayText: false,
            overlayPlayButton: true,
            showDetailsMenu: true,
            centerText: true,
            allowBottomPadding: !enableOverflow,
            cardLayout: false,
            context: 'home',
            lazy: true,
            lines: 2
        });
    };
}

/**
 * Renders a section built by the server.
 *
 * The items arrive with the section, so the row is drawn immediately and only refetched when the
 * server says it went stale.
 *
 * @param elem The element to render the section into.
 * @param section The section to render.
 * @param serverId The server the section belongs to.
 * @param fetchItems Fetches the current items of this section.
 * @param userSettings The settings of the user the section belongs to.
 * @param options The section options.
 */
export function loadServerSection(
    elem: HTMLElement,
    section: HomeSectionDto,
    serverId: string,
    fetchItems: () => Promise<BaseItemDto[]>,
    userSettings: UserSettings,
    options: SectionOptions
) {
    const getSectionItemsHtml = getItemsHtmlFn(section, userSettings, options);

    let html = getSectionTitleHtml(section, serverId);

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += `<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    } else {
        html += `<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    }

    html += getSectionItemsHtml(section.Items);

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = fetchItems;
    itemsContainer.getItemsHtml = getSectionItemsHtml;
    itemsContainer.parentContainer = elem;

    imageLoader.lazyChildren(elem);
}
