import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import type { HomeSectionDto } from 'types/homeSections';

import type { SectionContainerElement, SectionOptions } from './section';

function getLibraryTilesHtmlFn({ enableOverflow }: SectionOptions) {
    return function (items: BaseItemDto[]) {
        return cardBuilder.getCardsHtml({
            items: items,
            shape: getBackdropShape(enableOverflow),
            showTitle: true,
            centerText: true,
            overlayText: false,
            lazy: true,
            transition: false,
            allowBottomPadding: !enableOverflow
        });
    };
}

export function loadLibraryTiles(
    elem: HTMLElement,
    section: HomeSectionDto,
    fetchItems: () => Promise<BaseItemDto[]>,
    options: SectionOptions
) {
    const getItemsHtml = getLibraryTilesHtmlFn(options);

    let html = '';
    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + escapeHtml(section.DisplayText) + '</h2>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += `<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    } else {
        html += `<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right focuscontainer-x vertical-wrap" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    }

    html += getItemsHtml(section.Items);

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = fetchItems;
    itemsContainer.getItemsHtml = getItemsHtml;
    itemsContainer.parentContainer = elem;

    imageLoader.lazyChildren(elem);
}
