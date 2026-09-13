import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import escapeHtml from 'escape-html';

import imageLoader from 'components/images/imageLoader';
import { appRouter } from 'components/router/appRouter';
import type { HomeSectionDto } from 'types/homeSections';
import imageHelper from 'utils/image';

import type { SectionContainerElement } from './section';

function getLibraryButtonsHtml(items: BaseItemDto[]) {
    let html = '';

    // library card background images
    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];
        const icon = imageHelper.getLibraryIcon(item.CollectionType);
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item) + '" class="raised homeLibraryButton"><span class="material-icons homeLibraryIcon ' + icon + '" aria-hidden="true"></span><span class="homeLibraryText">' + escapeHtml(item.Name) + '</span></a>';
    }

    return html;
}

export function loadLibraryButtons(
    elem: HTMLElement,
    section: HomeSectionDto,
    fetchItems: () => Promise<BaseItemDto[]>
) {
    elem.classList.remove('verticalSection');

    let html = '';
    html += '<div class="verticalSection verticalSection-extrabottompadding">';
    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + escapeHtml(section.DisplayText) + '</h2>';
    html += `<div is="emby-itemscontainer" class="homeLibraryButtonContainer itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-multiselect="false" data-sectionid="${escapeHtml(section.Id)}" data-sectionkey="${escapeHtml(section.Key)}">`;
    html += getLibraryButtonsHtml(section.Items);
    html += '</div>';
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = fetchItems;
    itemsContainer.getItemsHtml = getLibraryButtonsHtml;
    itemsContainer.parentContainer = elem;

    imageLoader.lazyChildren(elem);
}
