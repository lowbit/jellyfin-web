import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

// NOTE: These mirror the server DTOs and should come from the SDK once the home sections
// endpoints are part of the OpenAPI spec.

/** The card shape a section should be rendered with. */
export enum HomeSectionViewType {
    Portrait = 'Portrait',
    Landscape = 'Landscape',
    Square = 'Square'
}

/** A row of the home screen, with the items to show in it. */
export interface HomeSectionDto {
    /** Stable across requests, so a row can be tracked between refreshes. */
    Id: string;
    /** The provider that built the row. A string, so a row added by a plugin needs no client change. */
    Key: string;
    DisplayText: string;
    ViewType: HomeSectionViewType;
    /** The item the row is about, if any: a collection, a genre, or what was watched. */
    ParentId?: string | null;
    Items: BaseItemDto[];
}

/** A row of the home screen layout, without its items. */
export interface HomeSectionConfigDto {
    Key: string;
    ItemId?: string | null;
    /** The maximum number of items, or null for the server default. */
    MaxItems?: number | null;
    Active: boolean;
}

/** A kind of section the server can build, including ones contributed by plugins. */
export interface HomeSectionProviderDto {
    Key: string;
    /** Localized by the server for the request's language. */
    Name: string;
    /** The kind of item a section must be bound to, or null when it takes none. */
    ItemKind?: BaseItemKind | null;
}

/** Tells a client which of its home sections are out of date. */
export interface HomeSectionsChangedInfo {
    AllStale: boolean;
    /** Ignored when AllStale is true. Keys match HomeSectionDto.Key. */
    StaleSectionKeys: string[];
}
