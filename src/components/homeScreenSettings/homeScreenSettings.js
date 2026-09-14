
import escapeHtml from 'escape-html';

import { getHomeSectionConfigQuery } from 'hooks/api/useHomeSectionConfig';
import { getHomeSectionItemKinds, getHomeSectionItemsQuery } from 'hooks/api/useHomeSectionItems';
import { getHomeSectionProvidersQuery } from 'hooks/api/useHomeSectionProviders';
import { getUserViewsQuery } from 'hooks/api/useUserViews';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getHomeSectionsApi } from 'utils/sdk/home-sections-api';
import { queryClient } from 'utils/query/queryClient';

import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import globalize from '../../lib/globalize';
import loading from '../loading/loading';
import Events from '../../utils/events.ts';
import confirm from '../confirm/confirm';
import dom from '../../utils/dom';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input.scss';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-checkbox/emby-checkbox';
import toast from '../toast/toast';
import template from './homeScreenSettings.template.html';
import { LibraryTab } from '../../types/libraryTab.ts';
import './homeScreenSettings.scss';

function renderViews(page, user, result) {
    let folderHtml = '';

    folderHtml += '<div class="checkboxList">';
    folderHtml += result.map(i => {
        let currentHtml = '';

        const id = `chkGroupFolder${i.Id}`;

        const isChecked = user.Configuration.GroupedFolders.includes(i.Id);

        const checkedHtml = isChecked ? ' checked="checked"' : '';

        currentHtml += '<label>';
        currentHtml += `<input type="checkbox" is="emby-checkbox" class="chkGroupFolder" data-folderid="${i.Id}" id="${id}"${checkedHtml}/>`;
        currentHtml += `<span>${escapeHtml(i.Name)}</span>`;
        currentHtml += '</label>';

        return currentHtml;
    }).join('');

    folderHtml += '</div>';

    page.querySelector('.folderGroupList').innerHTML = folderHtml;
}

function getLandingScreenOptions(type) {
    const list = [];

    if (type === 'movies') {
        list.push(
            {
                name: globalize.translate('Movies'),
                value: LibraryTab.Movies,
                isDefault: true
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('Favorites'),
                value: LibraryTab.Favorites
            },
            {
                name: globalize.translate('Collections'),
                value: LibraryTab.Collections
            },
            {
                name: globalize.translate('Genres'),
                value: LibraryTab.Genres
            },
            {
                name: globalize.translate('Studios'),
                value: LibraryTab.Studios
            },
            {
                name: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            }
        );
    } else if (type === 'tvshows') {
        list.push(
            {
                name: globalize.translate('Shows'),
                value: LibraryTab.Series,
                isDefault: true
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('TabUpcoming'),
                value: LibraryTab.Upcoming
            },
            {
                name: globalize.translate('Genres'),
                value: LibraryTab.Genres
            },
            {
                name: globalize.translate('Studios'),
                value: LibraryTab.Studios
            },
            {
                name: globalize.translate('Episodes'),
                value: LibraryTab.Episodes
            },
            {
                name: globalize.translate('Collections'),
                value: LibraryTab.Collections
            },
            {
                name: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            }
        );
    } else if (type === 'music') {
        list.push(
            {
                name: globalize.translate('Albums'),
                value: LibraryTab.Albums,
                isDefault: true
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('HeaderAlbumArtists'),
                value: LibraryTab.AlbumArtists
            },
            {
                name: globalize.translate('Artists'),
                value: LibraryTab.Artists
            },
            {
                name: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            },
            {
                name: globalize.translate('Songs'),
                value: LibraryTab.Songs
            },
            {
                name: globalize.translate('Genres'),
                value: LibraryTab.Genres
            },
            {
                name: globalize.translate('Collections'),
                value: LibraryTab.Collections
            }
        );
    } else if (type === 'livetv') {
        list.push(
            {
                name: globalize.translate('Programs'),
                value: LibraryTab.Programs,
                isDefault: true
            },
            {
                name: globalize.translate('Guide'),
                value: LibraryTab.Guide
            },
            {
                name: globalize.translate('Channels'),
                value: LibraryTab.Channels
            },
            {
                name: globalize.translate('Recordings'),
                value: LibraryTab.Recordings
            },
            {
                name: globalize.translate('Schedule'),
                value: LibraryTab.Schedule
            },
            {
                name: globalize.translate('Series'),
                value: LibraryTab.SeriesTimers
            }
        );
    } else if (type === 'homevideos') {
        list.push(
            {
                name: globalize.translate('Folders'),
                value: LibraryTab.Folders,
                isDefault: true
            },
            {
                name: globalize.translate('Photos'),
                value: LibraryTab.Photos
            },
            {
                name: globalize.translate('HeaderPhotoAlbums'),
                value: LibraryTab.PhotoAlbums
            },
            {
                name: globalize.translate('HeaderVideos'),
                value: LibraryTab.Videos
            }
        );
    } else if (type === 'musicvideos') {
        list.push(
            {
                name: globalize.translate('Folders'),
                value: LibraryTab.Folders,
                isDefault: true
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('HeaderVideos'),
                value: LibraryTab.MusicVideos
            },
            {
                name: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            }
        );
    } else if (type === 'mixed') {
        list.push(
            {
                name: globalize.translate('Folders'),
                value: LibraryTab.Folders,
                isDefault: true
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('HeaderMedia'),
                value: LibraryTab.Mixed
            },
            {
                name: globalize.translate('Collections'),
                value: LibraryTab.Collections
            },
            {
                name: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            }
        );
    } else if (type === 'books') {
        list.push(
            {
                name: globalize.translate('Folders'),
                value: LibraryTab.Folders,
                isDefault: true
            },
            {
                name: globalize.translate('Books'),
                value: LibraryTab.Books
            },
            {
                name: globalize.translate('Authors'),
                value: LibraryTab.Authors
            },
            {
                name: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                name: globalize.translate('Genres'),
                value: LibraryTab.Genres
            },
            {
                name: globalize.translate('Collections'),
                value: LibraryTab.Collections
            },
            {
                name: globalize.translate('Favorites'),
                value: LibraryTab.Favorites
            }
        );
    }

    return list;
}

function getLandingScreenOptionsHtml(type, userValue) {
    return getLandingScreenOptions(type).map(o => {
        const selected = userValue === o.value || (o.isDefault && !userValue);
        const selectedHtml = selected ? ' selected' : '';
        const optionValue = o.isDefault ? '' : o.value;

        return `<option value="${optionValue}"${selectedHtml}>${escapeHtml(o.name)}</option>`;
    }).join('');
}

function renderViewOrder(context, user, result) {
    let html = '';

    html += result.Items.map((view) => {
        let currentHtml = '';

        currentHtml += `<div class="listItem viewItem" data-viewid="${view.Id}">`;

        currentHtml += '<span class="material-icons listItemIcon folder_open" aria-hidden="true"></span>';

        currentHtml += '<div class="listItemBody">';

        currentHtml += '<div>';
        currentHtml += escapeHtml(view.Name);
        currentHtml += '</div>';

        currentHtml += '</div>';

        currentHtml += `<button type="button" is="paper-icon-button-light" class="btnViewItemUp btnViewItemMove autoSize" title="${globalize.translate('Up')}"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
        currentHtml += `<button type="button" is="paper-icon-button-light" class="btnViewItemDown btnViewItemMove autoSize" title="${globalize.translate('Down')}"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;

        currentHtml += '</div>';

        return currentHtml;
    }).join('');

    context.querySelector('.viewOrderList').innerHTML = html;
}

function getProvider(context, key) {
    return context.homeSectionProviders?.find(provider => provider.Key === key);
}

function getProviderName(context, key) {
    // A row from a plugin that has since been removed still has to be shown as something.
    return getProvider(context, key)?.Name || key;
}

/** Whether a section of this kind is bound to one item, picked when it is added. */
function usesItemSelect(context, key) {
    const provider = getProvider(context, key);
    return !!provider?.ItemKind && !provider.AllowsMultipleItems;
}

/** Whether a section of this kind takes any number of items, each getting a row. */
function takesSeveralItems(context, key) {
    const provider = getProvider(context, key);
    return !!provider?.ItemKind && !!provider.AllowsMultipleItems;
}

function getSectionItemIds(item) {
    const value = item.getAttribute('data-itemids');
    return value ? value.split(',') : [];
}

/** How many bound items a row names before it switches to a count. */
const MAX_CAPTION_NAMES = 3;

/** The items of a kind this user can pick from. */
function getOfferedItems(context, key) {
    const kind = getProvider(context, key)?.ItemKind;
    return context.homeSectionItems?.[kind] || [];
}

function hasEveryOfferedItem(context, key, itemIds) {
    const offered = getOfferedItems(context, key);
    return offered.length > 0 && offered.every(item => itemIds.includes(item.Id));
}

function getSectionItemNames(context, key, itemIds) {
    if (takesSeveralItems(context, key)) {
        if (!itemIds.length) return globalize.translate('None');
        if (hasEveryOfferedItem(context, key, itemIds)) return globalize.translate('All');
    }

    const names = itemIds
        .map(itemId => getOfferedItems(context, key).find(item => item.Id === itemId)?.Name)
        .filter(Boolean);

    const rest = names.length - MAX_CAPTION_NAMES;
    return rest > 0 ? `${names.slice(0, MAX_CAPTION_NAMES).join(', ')}, +${rest}` : names.join(', ');
}

function getHomeSectionHtml(context, section) {
    const isActive = section.Active !== false;
    const itemIds = section.ItemIds || [];
    const itemName = getSectionItemNames(context, section.Key, itemIds);
    const hasPicker = takesSeveralItems(context, section.Key);

    let html = '';

    // The row and, for a section that takes several items, the picker that narrows it sit in one
    // entry so that moving the section moves both.
    html += '<div class="homeSectionEntry">';
    html += `<div class="listItem listItem-border homeSectionItem" data-key="${escapeHtml(section.Key)}" data-itemids="${escapeHtml(itemIds.join(','))}" data-active="${isActive}">`;

    html += '<span class="material-icons listItemIcon dashboard" aria-hidden="true"></span>';

    html += '<div class="listItemBody">';
    html += `<div class="listItemBodyText">${escapeHtml(getProviderName(context, section.Key))}</div>`;
    if (itemName) {
        html += `<div class="listItemBodyText secondary">${escapeHtml(itemName)}</div>`;
    }
    html += '</div>';

    html += `<input type="number" class="emby-input homeSectionMaxItems" min="1" max="100" step="1" value="${section.MaxItems ?? ''}" placeholder="${globalize.translate('Default')}" title="${globalize.translate('LabelMaxItems')}" />`;

    if (hasPicker) {
        html += `<button type="button" is="paper-icon-button-light" class="btnSectionItems autoSize" title="${globalize.translate('ChooseWhatToShow')}"><span class="material-icons tune" aria-hidden="true"></span></button>`;
    }
    html += `<button type="button" is="paper-icon-button-light" class="btnSectionVisibility autoSize" title="${globalize.translate(isActive ? 'Hide' : 'Show')}"><span class="material-icons ${isActive ? 'visibility' : 'visibility_off'}" aria-hidden="true"></span></button>`;
    html += `<button type="button" is="paper-icon-button-light" class="btnSectionUp btnSectionMove autoSize" title="${globalize.translate('Up')}"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
    html += `<button type="button" is="paper-icon-button-light" class="btnSectionDown btnSectionMove autoSize" title="${globalize.translate('Down')}"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;
    html += `<button type="button" is="paper-icon-button-light" class="btnSectionRemove autoSize" title="${globalize.translate('ButtonRemove')}"><span class="material-icons delete" aria-hidden="true"></span></button>`;

    html += '</div>';

    if (hasPicker) {
        html += `<div class="homeSectionPicker hide">${getPickerHtml(context, section.Key, itemIds)}</div>`;
    }

    html += '</div>';

    return html;
}

/**
 * The picker of a section that takes several items: what is ticked gets a row, listed first in
 * row order with arrows to change it, then everything else on offer.
 */
function getPickerHtml(context, key, itemIds) {
    const offered = getOfferedItems(context, key);
    const chosen = itemIds.map(id => offered.find(item => item.Id === id)).filter(Boolean);
    const rest = offered.filter(item => !itemIds.includes(item.Id));

    const getRowHtml = (item, index) => {
        const isChosen = index >= 0;
        let html = `<div class="listItem homeSectionPickerItem" data-itemid="${item.Id}">`;
        html += `<label class="checkboxContainer homeSectionPickerCheck"><input type="checkbox" is="emby-checkbox" class="chkHomeSectionPickerItem"${isChosen ? ' checked="checked"' : ''}/><span>${escapeHtml(item.Name)}</span></label>`;
        if (isChosen) {
            html += `<button type="button" is="paper-icon-button-light" class="btnPickerUp autoSize" title="${globalize.translate('Up')}"${index === 0 ? ' disabled' : ''}><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
            html += `<button type="button" is="paper-icon-button-light" class="btnPickerDown autoSize" title="${globalize.translate('Down')}"${index === chosen.length - 1 ? ' disabled' : ''}><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;
        }
        html += '</div>';
        return html;
    };

    let html = '';
    html += `<label class="checkboxContainer homeSectionPickerAll"><input type="checkbox" is="emby-checkbox" class="chkHomeSectionPickerAll"${hasEveryOfferedItem(context, key, itemIds) ? ' checked="checked"' : ''}/><span>${globalize.translate('SelectAll')}</span></label>`;
    html += chosen.map(getRowHtml).join('');
    html += rest.map(item => getRowHtml(item, -1)).join('');
    html += `<div class="fieldDescription checkboxFieldDescription">${globalize.translate('HomeScreenSectionItemsHelp')}</div>`;
    return html;
}

/** Writes a section's items back to its row and redraws the caption and the picker. */
function setSectionItemIds(context, item, itemIds) {
    const key = item.getAttribute('data-key');

    item.setAttribute('data-itemids', itemIds.join(','));
    item.querySelector('.listItemBodyText.secondary')?.remove();

    const name = getSectionItemNames(context, key, itemIds);
    if (name) {
        item.querySelector('.listItemBody')
            .insertAdjacentHTML('beforeend', `<div class="listItemBodyText secondary">${escapeHtml(name)}</div>`);
    }

    const picker = item.parentNode.querySelector('.homeSectionPicker');
    if (picker) {
        picker.innerHTML = getPickerHtml(context, key, itemIds);
    }
}

/** Adds or removes one item of a section that takes several; an added one goes last. */
function togglePickerItem(context, item, itemId, isChosen) {
    const itemIds = getSectionItemIds(item).filter(id => id !== itemId);

    if (isChosen) {
        itemIds.push(itemId);
    }

    setSectionItemIds(context, item, itemIds);
}

/** Moves one of a section's items a step up or down its rows. */
function movePickerItem(context, item, itemId, offset) {
    const itemIds = getSectionItemIds(item);
    const index = itemIds.indexOf(itemId);
    const target = index + offset;

    if (index < 0 || target < 0 || target >= itemIds.length) {
        return;
    }

    itemIds.splice(index, 1);
    itemIds.splice(target, 0, itemId);
    setSectionItemIds(context, item, itemIds);
}

function renderHomeSections(context, sections) {
    context.querySelector('.homeSectionList').innerHTML = sections
        .map(section => getHomeSectionHtml(context, section))
        .join('');
}

function renderSectionTypeOptions(context) {
    // What the server can build, less anything bound to a kind of item this user has none of.
    const providers = context.homeSectionProviders.filter(provider => (
        !provider.ItemKind || context.homeSectionItems[provider.ItemKind]?.length
    ));

    context.querySelector('.selectHomeSectionType').innerHTML = providers
        .map(provider => `<option value="${escapeHtml(provider.Key)}">${escapeHtml(provider.Name)}</option>`)
        .join('');
}

function updateSectionItemSelect(context) {
    const key = context.querySelector('.selectHomeSectionType').value;
    const provider = getProvider(context, key);
    const select = context.querySelector('.selectHomeSectionItem');
    const hasItem = usesItemSelect(context, key);

    context.querySelector('.selectHomeSectionItemContainer').classList.toggle('hide', !hasItem);

    if (!hasItem) {
        return;
    }

    select.setLabel(provider.Name);
    select.innerHTML = (context.homeSectionItems[provider.ItemKind] || [])
        .map(item => `<option value="${item.Id}">${escapeHtml(item.Name)}</option>`)
        .join('');
}

function renderHomeSectionSettings(context, sections, providers, sectionItems) {
    context.homeSectionProviders = providers;
    context.homeSectionItems = sectionItems;

    context.querySelector('.homeSectionsEditor').classList.remove('hide');
    renderSectionTypeOptions(context);
    renderHomeSections(context, sections);
    updateSectionItemSelect(context);
}

function getHomeSectionsConfig(context) {
    return Array.prototype.map.call(context.querySelectorAll('.homeSectionItem'), item => {
        const maxItems = parseInt(item.querySelector('.homeSectionMaxItems').value, 10);

        return {
            Key: item.getAttribute('data-key'),
            ItemIds: getSectionItemIds(item),
            MaxItems: Number.isNaN(maxItems) ? null : maxItems,
            Active: item.getAttribute('data-active') === 'true'
        };
    });
}

function getPerLibrarySettingsHtml(item, user, userSettings) {
    const collectionType = (item.Type === 'CollectionFolder' && item.CollectionType == null) ? 'mixed' : item.CollectionType;

    let html = '';

    let isChecked;

    if (item.Type === 'Channel' || collectionType === 'boxsets' || collectionType === 'playlists') {
        isChecked = !(user.Configuration.MyMediaExcludes || []).includes(item.Id);
        html += '<div>';
        html += '<label>';
        html += `<input type="checkbox" is="emby-checkbox" class="chkIncludeInMyMedia" data-folderid="${item.Id}"${isChecked ? ' checked="checked"' : ''}/>`;
        html += `<span>${globalize.translate('DisplayInMyMedia')}</span>`;
        html += '</label>';
        html += '</div>';
    }

    const excludeFromLatest = ['playlists', 'livetv', 'boxsets', 'channels'];
    if (!excludeFromLatest.includes(collectionType || '')) {
        isChecked = !user.Configuration.LatestItemsExcludes.includes(item.Id);
        html += '<label class="fldIncludeInLatest">';
        html += `<input type="checkbox" is="emby-checkbox" class="chkIncludeInLatest" data-folderid="${item.Id}"${isChecked ? ' checked="checked"' : ''}/>`;
        html += `<span>${globalize.translate('DisplayInOtherHomeScreenSections')}</span>`;
        html += '</label>';
    }

    if (html) {
        html = `<div class="checkboxListContainer">${html}</div>`;
    }

    const landingScreenTypes = ['movies', 'tvshows', 'music', 'livetv', 'homevideos', 'musicvideos', 'mixed', 'books'];
    if (landingScreenTypes.includes(collectionType)) {
        const idForLanding = collectionType === 'livetv' ? collectionType : item.Id;
        html += '<div class="selectContainer">';
        html += `<select is="emby-select" class="selectLanding" data-folderid="${idForLanding}" label="${globalize.translate('LabelDefaultScreen')}">`;

        const userValue = userSettings.get(`landing-${idForLanding}`);

        html += getLandingScreenOptionsHtml(collectionType, userValue);

        html += '</select>';
        html += '</div>';
    }

    if (html) {
        let prefix = '';
        prefix += '<div class="verticalSection">';

        prefix += '<h2 class="sectionTitle">';
        prefix += escapeHtml(item.Name);
        prefix += '</h2>';

        html = prefix + html;
        html += '</div>';
    }

    return html;
}

function renderPerLibrarySettings(context, user, userViews, userSettings) {
    const elem = context.querySelector('.perLibrarySettings');
    let html = '';

    for (let i = 0, length = userViews.length; i < length; i++) {
        html += getPerLibrarySettingsHtml(userViews[i], user, userSettings);
    }

    elem.innerHTML = html;
}

function loadForm(context, user, userSettings, apiClient) {
    context.querySelector('.chkHidePlayedFromLatest').checked = user.Configuration.HidePlayedInLatest || false;
    context.querySelector('.selectTVHomeScreen').value = userSettings.get('tvhome') || '';

    const api = ServerConnections.getApi(apiClient.serverId());

    const promise1 = queryClient
        .fetchQuery(getUserViewsQuery(
            api,
            {
                userId: user.Id,
                includeHidden: true
            }
        ));
    const promise2 = apiClient.getJSON(apiClient.getUrl(`Users/${user.Id}/GroupingOptions`));

    Promise.all([promise1, promise2])
        .then(responses => {
            renderViewOrder(context, user, responses[0]);

            renderPerLibrarySettings(context, user, responses[0].Items, userSettings);

            renderViews(context, user, responses[1]);
        })
        .catch(err => {
            console.error('[homeScreenSettings] failed to load the form', err);
            toast(globalize.translate('ErrorDefault'));
        })
        .finally(() => {
            loading.hide();
        });

    // The section editor stays hidden until its own data is there, so a request that fails cannot
    // leave the page loading or save an empty layout over the one it could not read. The providers
    // come first because they say which kinds of item there are to pick from.
    queryClient.fetchQuery(getHomeSectionProvidersQuery(api))
        .then(providers => Promise.all([
            providers,
            queryClient.fetchQuery(getHomeSectionConfigQuery(api, { userId: user.Id })),
            queryClient.fetchQuery(getHomeSectionItemsQuery(api, { userId: user.Id, kinds: getHomeSectionItemKinds(providers) }))
        ]))
        .then(([ providers, sections, sectionItems ]) => {
            renderHomeSectionSettings(context, sections, providers, sectionItems);
        })
        .catch(err => {
            console.error('[homeScreenSettings] home sections are unavailable', err);
        });
}

function onSectionOrderListClick(e) {
    const target = dom.parentWithClass(e.target, 'btnViewItemMove');

    if (target) {
        const viewItem = dom.parentWithClass(target, 'viewItem');

        if (viewItem) {
            if (target.classList.contains('btnViewItemDown')) {
                const next = viewItem.nextSibling;

                if (next) {
                    viewItem.parentNode.removeChild(viewItem);
                    next.parentNode.insertBefore(viewItem, next.nextSibling);
                    focusManager.focus(e.target);
                }
            } else {
                const prev = viewItem.previousSibling;

                if (prev) {
                    viewItem.parentNode.removeChild(viewItem);
                    prev.parentNode.insertBefore(viewItem, prev);
                    focusManager.focus(e.target);
                }
            }
        }
    }
}

function moveHomeSection(item, isDown) {
    const sibling = isDown ? item.nextSibling : item.previousSibling;

    if (!sibling) {
        return;
    }

    item.parentNode.removeChild(item);

    if (isDown) {
        sibling.parentNode.insertBefore(item, sibling.nextSibling);
    } else {
        sibling.parentNode.insertBefore(item, sibling);
    }
}

function toggleHomeSectionVisibility(item, button) {
    const isActive = item.getAttribute('data-active') !== 'true';

    item.setAttribute('data-active', isActive);
    button.setAttribute('title', globalize.translate(isActive ? 'Hide' : 'Show'));
    button.querySelector('.material-icons').className = `material-icons ${isActive ? 'visibility' : 'visibility_off'}`;
}

function onHomeSectionListClick(e) {
    const context = this.options.element;
    const pickerButton = dom.parentWithClass(e.target, ['btnPickerUp', 'btnPickerDown']);

    if (pickerButton) {
        const pickerItem = dom.parentWithClass(pickerButton, 'homeSectionPickerItem');
        const item = dom.parentWithClass(pickerButton, 'homeSectionEntry').querySelector('.homeSectionItem');
        movePickerItem(context, item, pickerItem.getAttribute('data-itemid'), pickerButton.classList.contains('btnPickerDown') ? 1 : -1);
        return;
    }

    const button = dom.parentWithClass(e.target, ['btnSectionMove', 'btnSectionRemove', 'btnSectionVisibility', 'btnSectionItems']);

    if (!button) {
        return;
    }

    const item = dom.parentWithClass(button, 'homeSectionItem');

    if (!item) {
        return;
    }

    if (button.classList.contains('btnSectionRemove')) {
        item.parentNode.remove();
        return;
    }

    if (button.classList.contains('btnSectionVisibility')) {
        toggleHomeSectionVisibility(item, button);
        return;
    }

    if (button.classList.contains('btnSectionItems')) {
        item.parentNode.querySelector('.homeSectionPicker').classList.toggle('hide');
        return;
    }

    moveHomeSection(item.parentNode, button.classList.contains('btnSectionDown'));
    focusManager.focus(e.target);
}

function onSectionTypeChange() {
    updateSectionItemSelect(this.options.element);
}

function onAddHomeSection() {
    const context = this.options.element;
    const key = context.querySelector('.selectHomeSectionType').value;

    // A section that takes several items starts with all of them, so adding it needs no more,
    // and is on the layout once: adding it again opens what it has.
    let itemIds = [];
    if (usesItemSelect(context, key)) {
        itemIds = [ context.querySelector('.selectHomeSectionItem').value ];
    } else if (takesSeveralItems(context, key)) {
        const existing = context.querySelector(`.homeSectionItem[data-key="${key}"]`);
        if (existing) {
            existing.parentNode.querySelector('.homeSectionPicker').classList.remove('hide');
            focusManager.focus(existing.querySelector('.btnSectionItems'));
            return;
        }

        itemIds = getOfferedItems(context, key).map(item => item.Id);
    }

    const section = {
        Key: key,
        ItemIds: itemIds,
        MaxItems: null,
        Active: true
    };

    context.querySelector('.homeSectionList')
        .insertAdjacentHTML('beforeend', getHomeSectionHtml(context, section));
}

function resetHomeSections(instance) {
    const context = instance.options.element;
    const userId = instance.options.userId;
    const apiClient = ServerConnections.getApiClient(instance.options.serverId);
    const api = ServerConnections.getApi(apiClient.serverId());

    loading.show();

    getHomeSectionsApi(api).resetHomeSectionConfig({ userId })
        .then(() => queryClient.invalidateQueries({ queryKey: ['User', userId] }))
        .then(() => queryClient.fetchQuery(getHomeSectionConfigQuery(api, { userId })))
        .then(sections => {
            renderHomeSections(context, sections);
            toast(globalize.translate('SettingsSaved'));
        })
        .catch(err => {
            console.error('[homeScreenSettings] failed to reset the home screen', err);
        })
        .finally(() => {
            loading.hide();
        });
}

function onResetHomeSections() {
    const instance = this;

    confirm({
        title: globalize.translate('ResetHomeScreenLayout'),
        text: globalize.translate('ConfirmResetHomeScreenLayout'),
        confirmText: globalize.translate('Reset'),
        primary: 'delete'
    }).then(() => {
        resetHomeSections(instance);
    }).catch(() => {
        // The dialog was dismissed
    });
}

function getCheckboxItems(selector, context, isChecked) {
    const inputs = context.querySelectorAll(selector);
    const list = [];

    for (let i = 0, length = inputs.length; i < length; i++) {
        if (inputs[i].checked === isChecked) {
            list.push(inputs[i]);
        }
    }

    return list;
}

async function saveUser(context, user, userSettingsInstance, apiClient) {
    user.Configuration.HidePlayedInLatest = context.querySelector('.chkHidePlayedFromLatest').checked;

    user.Configuration.LatestItemsExcludes = getCheckboxItems('.chkIncludeInLatest', context, false).map(i => {
        return i.getAttribute('data-folderid');
    });

    user.Configuration.MyMediaExcludes = getCheckboxItems('.chkIncludeInMyMedia', context, false).map(i => {
        return i.getAttribute('data-folderid');
    });

    user.Configuration.GroupedFolders = getCheckboxItems('.chkGroupFolder', context, true).map(i => {
        return i.getAttribute('data-folderid');
    });

    const viewItems = context.querySelectorAll('.viewItem');
    const orderedViews = [];
    let i;
    let length;
    for (i = 0, length = viewItems.length; i < length; i++) {
        orderedViews.push(viewItems[i].getAttribute('data-viewid'));
    }

    user.Configuration.OrderedViews = orderedViews;

    userSettingsInstance.set('tvhome', context.querySelector('.selectTVHomeScreen').value);

    const selectLandings = context.querySelectorAll('.selectLanding');
    for (i = 0, length = selectLandings.length; i < length; i++) {
        const selectLanding = selectLandings[i];
        userSettingsInstance.set(`landing-${selectLanding.getAttribute('data-folderid')}`, selectLanding.value);
    }

    // Display preferences are written first because saving them rewrites the home sections from
    // the legacy layout they still carry, which would undo the layout saved here.
    await userSettingsInstance.flushServerPreferences();

    if (!context.querySelector('.homeSectionsEditor').classList.contains('hide')) {
        await getHomeSectionsApi(ServerConnections.getApi(apiClient.serverId()))
            .updateHomeSectionConfig(getHomeSectionsConfig(context), { userId: user.Id });
    }

    await apiClient.updateUserConfiguration(user.Id, user.Configuration);
    // Invalidate all user queries
    void queryClient.invalidateQueries({
        queryKey: ['User', user.Id]
    });
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();

    apiClient.getUser(userId).then(user => {
        saveUser(context, user, userSettings, apiClient).then(() => {
            loading.hide();
            if (enableSaveConfirmation) {
                toast(globalize.translate('SettingsSaved'));
            }

            Events.trigger(instance, 'saved');
        }, err => {
            loading.hide();
            console.error('[homeScreenSettings] failed to save', err);
            toast(globalize.translate('ErrorDefault'));
        });
    });
}

function onSubmit(e) {
    const self = this;
    const apiClient = ServerConnections.getApiClient(self.options.serverId);
    const userId = self.options.userId;
    const userSettings = self.options.userSettings;

    userSettings.setUserInfo(userId, apiClient).then(() => {
        const enableSaveConfirmation = self.options.enableSaveConfirmation;
        save(self, self.options.element, userId, userSettings, apiClient, enableSaveConfirmation);
    });

    // Disable default form submission
    if (e) {
        e.preventDefault();
    }
    return false;
}

function onChange(e) {
    const context = this.options.element;

    const allCheckbox = dom.parentWithClass(e.target, 'chkHomeSectionPickerAll');
    if (allCheckbox) {
        const item = dom.parentWithClass(allCheckbox, 'homeSectionEntry').querySelector('.homeSectionItem');
        const itemIds = allCheckbox.checked ? getOfferedItems(context, item.getAttribute('data-key')).map(offered => offered.Id) : [];
        setSectionItemIds(context, item, itemIds);
        return;
    }

    const itemCheckbox = dom.parentWithClass(e.target, 'chkHomeSectionPickerItem');
    if (itemCheckbox) {
        const item = dom.parentWithClass(itemCheckbox, 'homeSectionEntry').querySelector('.homeSectionItem');
        const pickerItem = dom.parentWithClass(itemCheckbox, 'homeSectionPickerItem');
        togglePickerItem(context, item, pickerItem.getAttribute('data-itemid'), itemCheckbox.checked);
        return;
    }

    const chkIncludeInMyMedia = dom.parentWithClass(e.target, 'chkIncludeInMyMedia');
    if (!chkIncludeInMyMedia) {
        return;
    }

    const section = dom.parentWithClass(chkIncludeInMyMedia, 'verticalSection');
    const fldIncludeInLatest = section.querySelector('.fldIncludeInLatest');
    if (fldIncludeInLatest) {
        if (chkIncludeInMyMedia.checked) {
            fldIncludeInLatest.classList.remove('hide');
        } else {
            fldIncludeInLatest.classList.add('hide');
        }
    }
}

function embed(options, self) {
    options.element.innerHTML = globalize.translateHtml(template, 'core');

    options.element.querySelector('.viewOrderList').addEventListener('click', onSectionOrderListClick);
    options.element.querySelector('.homeSectionList').addEventListener('click', onHomeSectionListClick.bind(self));
    options.element.querySelector('.selectHomeSectionType').addEventListener('change', onSectionTypeChange.bind(self));
    options.element.querySelector('.btnAddHomeSection').addEventListener('click', onAddHomeSection.bind(self));
    options.element.querySelector('.btnResetHomeSections').addEventListener('click', onResetHomeSections.bind(self));
    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(self));
    options.element.addEventListener('change', onChange.bind(self));

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

    if (layoutManager.tv) {
        options.element.querySelector('.selectTVHomeScreenContainer').classList.remove('hide');
    } else {
        options.element.querySelector('.selectTVHomeScreenContainer').classList.add('hide');
    }

    self.loadData(options.autoFocus);
}

class HomeScreenSettings {
    constructor(options) {
        this.options = options;
        embed(options, this);
    }

    loadData(autoFocus) {
        const self = this;
        const context = self.options.element;

        loading.show();

        const userId = self.options.userId;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userSettings = self.options.userSettings;

        apiClient.getUser(userId).then(user => {
            userSettings.setUserInfo(userId, apiClient).then(() => {
                self.dataLoaded = true;

                loadForm(context, user, userSettings, apiClient);

                if (autoFocus) {
                    focusManager.autoFocus(context);
                }
            });
        });
    }

    submit() {
        onSubmit.call(this);
    }

    destroy() {
        this.options = null;
    }
}

export default HomeScreenSettings;
