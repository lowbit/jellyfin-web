import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import type { HomeSectionDto } from 'types/homeSections';

import type { SectionContainerElement, SectionOptions } from './section';

/** The parts of Live TV the row links to, in the order they are shown. */
const LINKS: Array<{ section: string, label: string }> = [
    { section: 'programs', label: 'Programs' },
    { section: 'guide', label: 'Guide' },
    { section: 'channels', label: 'Channels' },
    { section: 'recordings', label: 'Recordings' },
    { section: 'dvrschedule', label: 'Schedule' },
    { section: 'seriesrecording', label: 'Series' }
];

function getLinksHtml(serverId: string) {
    return LINKS.map(({ section, label }) => {
        const url = section === 'recordings' ?
            appRouter.getRouteUrl('recordedtv', { serverId }) :
            appRouter.getRouteUrl('livetv', { serverId, section });

        return `<a is="emby-linkbutton" href="${url}" class="raised"><span>${escapeHtml(globalize.translate(label))}</span></a>`;
    }).join('');
}

function getOnNowItemsHtmlFn({ enableOverflow }: SectionOptions) {
    return function (items: BaseItemDto[]) {
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: 'auto',
            inheritThumb: false,
            shape: enableOverflow ? 'autooverflow' : 'auto',
            showParentTitleOrTitle: true,
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            allowBottomPadding: !enableOverflow,
            showAirTime: true,
            showChannelName: false,
            showAirDateTime: false,
            showAirEndTime: true,
            defaultShape: getBackdropShape(enableOverflow),
            lines: 3,
            overlayPlayButton: true
        });
    };
}

/**
 * Renders the Live TV row: the shortcuts into Live TV, then what is airing now.
 *
 * The shortcuts are client side because they are navigation rather than items, but the row itself
 * only appears when the server returns one.
 *
 * @param elem The element to render the section into.
 * @param section The section to render.
 * @param serverId The server the section belongs to.
 * @param fetchItems Fetches the current items of this section.
 * @param options The section options.
 */
export function loadLiveTv(
    elem: HTMLElement,
    section: HomeSectionDto,
    serverId: string,
    fetchItems: () => Promise<BaseItemDto[]>,
    options: SectionOptions
) {
    const getItemsHtml = getOnNowItemsHtmlFn(options);

    elem.classList.remove('padded-left');
    elem.classList.remove('padded-right');
    elem.classList.remove('padded-bottom');
    elem.classList.remove('verticalSection');

    let html = '';

    html += '<div class="verticalSection">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    html += `<h2 class="sectionTitle sectionTitle-cards">${globalize.translate('LiveTV')}</h2>`;
    html += '</div>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true" data-scrollbuttons="false">';
        html += '<div class="padded-top padded-bottom scrollSlider focuscontainer-x">';
    } else {
        html += '<div class="padded-top padded-bottom focuscontainer-x">';
    }

    html += getLinksHtml(serverId);

    html += '</div>';
    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    html += '<div class="verticalSection">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

    if (layoutManager.tv) {
        html += `<h2 class="sectionTitle sectionTitle-cards">${escapeHtml(section.DisplayText)}</h2>`;
    } else {
        html += `<a is="emby-linkbutton" href="${appRouter.getRouteUrl('livetv', { serverId, section: 'onnow' })}" class="more button-flat button-flat-mini sectionTitleTextButton">`;
        html += `<h2 class="sectionTitle sectionTitle-cards">${escapeHtml(section.DisplayText)}</h2>`;
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    }

    html += '</div>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += `<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    } else {
        html += `<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    }

    html += getItemsHtml(section.Items);

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = fetchItems;
    itemsContainer.getItemsHtml = getItemsHtml;
    itemsContainer.parentContainer = elem;

    imageLoader.lazyChildren(elem);
}
