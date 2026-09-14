import layoutManager from 'components/layoutManager';
import { HomeSectionKey } from 'constants/homeSectionKey';
import { getHomeSectionsQuery } from 'hooks/api/useHomeSections';
import { getUserViewsQuery } from 'hooks/api/useUserViews';
import globalize from 'lib/globalize';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';
import Dashboard from 'utils/dashboard';
import { queryClient } from 'utils/query/queryClient';

import { loadLibraryButtons } from './sections/libraryButtons';
import { loadLibraryTiles } from './sections/libraryTiles';
import { loadLiveTv } from './sections/liveTv';
import { loadServerSection } from './sections/serverSection';

import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-button/emby-button';

import './homesections.scss';

const LIBRARY_SECTION_KEYS = [
    HomeSectionKey.SmallLibraryTiles,
    HomeSectionKey.LibraryButtons
];

function enableScrollX() {
    return true;
}

function getSectionOptions() {
    return { enableOverflow: enableScrollX() };
}

function fetchUserViews(api, userId) {
    return queryClient
        .fetchQuery(getUserViewsQuery(api, { userId }))
        .then(result => result.Items || []);
}

function fetchSections(api, params) {
    // The cache is bypassed because sections are only fetched on load or after the server has said
    // they went stale. Rows refreshing together still share one request, since the query
    // deduplicates what is already in flight.
    return queryClient.fetchQuery({ ...getHomeSectionsQuery(api, params), staleTime: 0 });
}

function getSectionItemsFn(container, api, params, sectionId) {
    return function () {
        // During a refresh of some keys the rows read the response for those keys only
        return (container.pendingSections || fetchSections(api, params))
            .then(sections => sections.find(section => section.Id === sectionId)?.Items || []);
    };
}

function renderNoLibrariesMessage(elem, user) {
    let noLibDescription;
    if (user.Policy?.IsAdministrator) {
        noLibDescription = globalize.translate('NoCreatedLibraries', '<br><a id="button-createLibrary" class="button-link">', '</a>');
    } else {
        noLibDescription = globalize.translate('AskAdminToCreateLibrary');
    }

    let html = '';
    html += '<div class="centerMessage padded-left padded-right">';
    html += '<h2>' + globalize.translate('MessageNothingHere') + '</h2>';
    html += '<p>' + noLibDescription + '</p>';
    html += '</div>';
    elem.innerHTML = html;

    const createNowLink = elem.querySelector('#button-createLibrary');
    if (createNowLink) {
        createNowLink.addEventListener('click', function () {
            Dashboard.navigate('dashboard/libraries');
        });
    }
}

function renderSection(elem, serverId, section, fetchItems, userSettings, options) {
    switch (section.Key) {
        case HomeSectionKey.SmallLibraryTiles:
            loadLibraryTiles(elem, section, fetchItems, options);
            break;
        case HomeSectionKey.LibraryButtons:
            loadLibraryButtons(elem, section, fetchItems);
            break;
        case HomeSectionKey.LiveTv:
            loadLiveTv(elem, section, serverId, fetchItems, options);
            break;
        default:
            loadServerSection(elem, section, serverId, fetchItems, userSettings, options);
    }
}

function renderSections(elem, api, serverId, params, sections, userSettings) {
    const options = getSectionOptions();

    let html = '';
    for (let i = 0; i < sections.length; i++) {
        html += '<div class="verticalSection section' + i + '"></div>';
    }

    elem.innerHTML = html;
    elem.classList.add('homeSectionsContainer');
    // The rows that are on screen, so a change to the layout can be told apart from a change to
    // what the rows contain.
    elem.homeSectionIds = sections.map(section => section.Id);
    elem.homeSectionKeys = sections.map(section => section.Key);

    sections.forEach((section, index) => {
        const fetchItems = getSectionItemsFn(elem, api, params, section.Id);
        renderSection(elem.querySelector('.section' + index), serverId, section, fetchItems, userSettings, options);
    });
}

/**
 * Adds a library row to the sections of a TV layout that has none, so the libraries are always
 * reachable from the home screen.
 * @param {Object} api The api instance.
 * @param {string} userId The user the sections belong to.
 * @param {Array} sections The sections returned by the server.
 * @returns {Promise<Array>} The sections to render.
 */
function withLibrarySection(api, userId, sections) {
    if (!layoutManager.tv || sections.some(section => LIBRARY_SECTION_KEYS.includes(section.Key))) {
        return Promise.resolve(sections);
    }

    return fetchUserViews(api, userId).then(userViews => {
        if (!userViews.length) {
            return sections;
        }

        return [
            {
                Id: HomeSectionKey.SmallLibraryTiles,
                Key: HomeSectionKey.SmallLibraryTiles,
                DisplayText: globalize.translate('HeaderMyMedia'),
                Items: userViews
            },
            ...sections
        ];
    });
}

function getSectionParams(apiClient, user) {
    return { userId: user.Id || apiClient.getCurrentUserId() };
}

export function loadSections(elem, apiClient, user, userSettings) {
    const api = ServerConnections.getApi(apiClient.serverId());
    const params = getSectionParams(apiClient, user);

    return fetchSections(api, params)
        .then(sections => withLibrarySection(api, params.userId, sections))
        .then(sections => {
            if (!sections.length) {
                elem.homeSectionIds = [];
                elem.homeSectionKeys = [];

                // The server drops empty rows, so a user with no libraries gets nothing back.
                return fetchUserViews(api, params.userId).then(userViews => {
                    if (userViews.length) {
                        elem.innerHTML = '';
                    } else {
                        renderNoLibrariesMessage(elem, user);
                    }
                });
            }

            renderSections(elem, api, apiClient.serverId(), params, sections, userSettings);

            // Timeout for polyfilled CustomElements (webOS 1.2)
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
}

/**
 * Refetches rows in place.
 * @param {HTMLElement} elem The sections container.
 * @param {Array<string>|null} staleKeys The provider keys whose rows to refresh, or null for every row.
 * @returns {Promise} A promise that resolves when the rows have been refreshed.
 */
function refreshRows(elem, staleKeys) {
    const promises = Array.from(elem.querySelectorAll('.itemsContainer'))
        .filter(section => section.refreshItems && (!staleKeys || staleKeys.includes(section.getAttribute('data-sectionkey'))))
        .map(section => section.refreshItems());

    return Promise.all(promises);
}

/**
 * Refetches only the sections of the stale keys and refreshes their rows in place from that
 * response, instead of downloading the whole screen.
 * @param {HTMLElement} elem The sections container.
 * @param {Object} api The api instance.
 * @param {Object} params The section request parameters.
 * @param {Array<string>} staleKeys The provider keys that went stale.
 * @returns {Promise<boolean>} False when those keys now have other rows than the screen shows.
 */
function refreshStaleSections(elem, api, params, staleKeys) {
    const renderedIds = elem.homeSectionIds || [];
    const renderedKeys = elem.homeSectionKeys || [];
    const staleIds = renderedIds.filter((id, index) => staleKeys.includes(renderedKeys[index]));

    return fetchSections(api, { ...params, keys: staleKeys })
        .then(sections => {
            const ids = sections.map(section => section.Id);
            if (ids.length !== staleIds.length || ids.some((id, index) => id !== staleIds[index])) {
                return false;
            }

            elem.pendingSections = Promise.resolve(sections);

            return refreshRows(elem, staleKeys)
                .then(() => true)
                .finally(() => {
                    elem.pendingSections = null;
                });
        });
}

/**
 * Brings the screen up to date after the server said rows went stale.
 *
 * Stale rows are refreshed in place, so focus and scroll position survive. When only some keys
 * went stale only their sections are fetched. The layout is checked as well, because a provider
 * that expands to several rows can gain or lose one when its data changes, and then the screen is
 * built again.
 *
 * @param {HTMLElement} elem The sections container.
 * @param {Object} apiClient The api client of the server the sections belong to.
 * @param {Object} user The user the sections belong to.
 * @param {Object} userSettings The settings of that user.
 * @param {Array<string>|null} staleKeys The provider keys that went stale, or null when everything did.
 * @returns {Promise} A promise that resolves when the rows are current again.
 */
export function refreshSections(elem, apiClient, user, userSettings, staleKeys = null) {
    const api = ServerConnections.getApi(apiClient.serverId());
    const params = getSectionParams(apiClient, user);
    const renderedIds = elem.homeSectionIds || [];

    if (staleKeys?.length) {
        return refreshStaleSections(elem, api, params, staleKeys)
            .then(isCurrent => isCurrent || loadSections(elem, apiClient, user, userSettings));
    }

    // Started before the sections are read, so both share the one request.
    const refreshed = refreshRows(elem, staleKeys);

    return fetchSections(api, params)
        .then(sections => withLibrarySection(api, params.userId, sections))
        .then(sections => {
            const ids = sections.map(section => section.Id);
            const isSameLayout = ids.length === renderedIds.length
                && ids.every((id, index) => id === renderedIds[index]);

            if (isSameLayout) {
                return refreshed;
            }

            // Rows have moved, appeared or been hidden, so the screen is built again.
            return loadSections(elem, apiClient, user, userSettings);
        });
}

export function destroySections(elem) {
    const elems = elem.querySelectorAll('.itemsContainer');
    for (const e of elems) {
        e.fetchData = null;
        e.parentContainer = null;
        e.getItemsHtml = null;
    }

    elem.homeSectionIds = null;
    elem.homeSectionKeys = null;
    elem.pendingSections = null;
    elem.innerHTML = '';
}

export function pause(elem) {
    const elems = elem.querySelectorAll('.itemsContainer');
    for (const e of elems) {
        e.pause();
    }
}

export function resume(elem, options) {
    const elems = elem.querySelectorAll('.itemsContainer');
    const promises = [];

    Array.prototype.forEach.call(elems, section => {
        if (section.resume) {
            promises.push(section.resume(options));
        }
    });

    return Promise.all(promises);
}

export default {
    loadSections,
    refreshSections,
    destroySections,
    pause,
    resume
};
