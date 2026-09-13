/**
 * The keys of the sections the server builds itself.
 *
 * The full list, with names and what each binds to, comes from the server at
 * `GET /HomeSections/Providers`, and rows are drawn from whatever it returns. These are only the
 * keys the client has to know about: the ones it renders differently, or lets the user pick an
 * item for in a particular way.
 */
export enum HomeSectionKey {
    None = 'none',
    SmallLibraryTiles = 'smalllibrarytiles',
    LibraryButtons = 'librarybuttons',
    ActiveRecordings = 'activerecordings',
    Resume = 'resume',
    ResumeAudio = 'resumeaudio',
    LatestMedia = 'latestmedia',
    NextUp = 'nextup',
    LiveTv = 'livetv',
    ResumeBook = 'resumebook',
    PinnedCollection = 'pinnedcollection',
    Genre = 'genre'
}
