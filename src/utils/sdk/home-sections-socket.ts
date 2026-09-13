// FIXME: This file should be removed once the SDK knows about the home sections messages.
import type { Api } from '@jellyfin/sdk/lib/api';

import type { HomeSectionsChangedInfo } from 'types/homeSections';

const CHANGED_MESSAGE_TYPE = 'HomeSectionsChanged';
const START_MESSAGE_TYPE = 'HomeSectionsStart';
const STOP_MESSAGE_TYPE = 'HomeSectionsStop';

/**
 * The initial delay and interval in milliseconds the server coalesces notifications with. A
 * library scan invalidates continuously and every message can rebuild the whole screen, so this
 * is longer than the one second the SDK subscribes with.
 */
const INTERVAL = '0,5000';

interface HomeSectionsChangedMessage {
    MessageType: string;
    Data?: HomeSectionsChangedInfo;
}

type Subscribe = (
    messageTypes: string[],
    onMessage: (message: HomeSectionsChangedMessage) => void
) => () => void;

interface WebSocketService {
    socketStatus: number | 'disconnected';
    sendMessage: (message: { MessageType: string, Data?: string }) => void;
    onStatusChange: (handler: (status: number | 'disconnected') => void) => () => void;
}

/**
 * Subscribes to the sections of a user going stale.
 *
 * The SDK only sends start and stop messages for the types in its subscription registry, so the
 * socket is driven by hand here. Without a start message the server never begins transmitting.
 *
 * @param api The api instance to subscribe with.
 * @param onChanged Called with the sections that went stale.
 * @returns A function that unsubscribes.
 */
export function subscribeToHomeSectionsChanged(
    api: Api,
    onChanged: (info: HomeSectionsChangedInfo) => void
) {
    const subscribe = api.subscribe.bind(api) as unknown as Subscribe;
    const unsubscribe = subscribe([ CHANGED_MESSAGE_TYPE ], ({ Data }) => {
        if (Data) onChanged(Data);
    });

    // Subscribing is what creates the socket, so it cannot be read before this point.
    const socket = (api as unknown as { webSocket?: WebSocketService }).webSocket;
    const sendStartMessage = () => socket?.sendMessage({
        MessageType: START_MESSAGE_TYPE,
        Data: INTERVAL
    });

    // The start message has to be sent again after a reconnect, since the SDK only replays the
    // subscriptions it knows about.
    const removeStatusListener = socket?.onStatusChange(status => {
        if (status === WebSocket.OPEN) sendStartMessage();
    });

    if (socket?.socketStatus === WebSocket.OPEN) sendStartMessage();

    return () => {
        removeStatusListener?.();
        socket?.sendMessage({ MessageType: STOP_MESSAGE_TYPE });
        unsubscribe();
    };
}
