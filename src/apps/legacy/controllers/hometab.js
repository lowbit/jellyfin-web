import * as userSettings from 'scripts/settings/userSettings';
import focusManager from 'components/focusManager';
import homeSections from 'components/homesections/homesections';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { subscribeToHomeSectionsChanged } from 'utils/sdk/home-sections-socket';

import 'elements/emby-itemscontainer/emby-itemscontainer';

class HomeTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        view.querySelector('.sections').addEventListener('settingschange', onHomeScreenSettingsChanged.bind(this));

        const api = ServerConnections.getApi(this.apiClient.serverId());
        this.unsubscribeSectionsChanged = subscribeToHomeSectionsChanged(
            api,
            onHomeSectionsChanged.bind(this)
        );
    }
    onResume(options) {
        this.paused = false;

        if (this.sectionsRendered) {
            const sectionsContainer = this.sectionsContainer;

            if (sectionsContainer) {
                return homeSections.resume(sectionsContainer, options);
            }

            return Promise.resolve();
        }

        const view = this.view;
        const apiClient = this.apiClient;
        this.destroyHomeSections();
        this.sectionsRendered = true;
        return apiClient.getCurrentUser()
            .then(user => homeSections.loadSections(view.querySelector('.sections'), apiClient, user, userSettings))
            .then(() => {
                if (options.autoFocus) {
                    focusManager.autoFocus(view);
                }
            }).catch(err => {
                console.error(err);
            });
    }
    onPause() {
        this.paused = true;
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.pause(sectionsContainer);
        }
    }
    destroy() {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.unsubscribeSectionsChanged?.();
        this.unsubscribeSectionsChanged = null;
        this.destroyHomeSections();
        this.sectionsContainer = null;
    }
    destroyHomeSections() {
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.destroySections(sectionsContainer);
        }
    }
}

function onHomeScreenSettingsChanged() {
    this.sectionsRendered = false;

    if (!this.paused) {
        this.onResume({
            refresh: true
        });
    }
}

function onHomeSectionsChanged(info) {
    const sectionsContainer = this.sectionsContainer;
    if (!sectionsContainer || !this.sectionsRendered) {
        return;
    }

    if (this.paused) {
        // Nothing is on screen to refresh, so the rows are built again on the way back.
        this.sectionsRendered = false;
        return;
    }

    const apiClient = this.apiClient;
    apiClient.getCurrentUser()
        .then(user => homeSections.refreshSections(
            sectionsContainer,
            apiClient,
            user,
            userSettings,
            info.AllStale ? null : info.StaleSectionKeys
        ))
        .catch(err => {
            console.error('[HomeTab] failed to refresh the home sections', err);
        });
}

export default HomeTab;
