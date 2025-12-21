export const MODES = {
    ORACLE: 'Oracle' as const,
    MAX_FREI: 'MaxFrei' as const
};

export const FOLDERS = {
    WISHES: 'wishes' as const,
    MAX_FREU: 'max-freu' as const
};

export const UI = {
    SHEET_NAME: 'UI',
    LOADING_ERROR: 'Error loading data.',
    RETRY: 'Retry'
};

export const ASSETS = {
    ORACLE_INTRO_IMG: 'assets/images/wishes/webp/11.webp',
    MAX_FREI_INTRO_IMG: 'assets/images/max-freu/webp/12.webp',
    BASE_PATH: 'assets/images/'
};

export const BLURHASHES = {
    ORACLE_INTRO: 'U E{?|~q00_3004n%M-;?bD%ITRj4TM{ofxt',
    MAX_FREI_INTRO: 'L26R|@of00R+00of?bIU00of~qRj'
};

export const IFRAME_MESSAGES = {
    SCROLL_TO_TOP: 'scrollToTop',
    SET_WISH: 'setWish'
};

export const URL_PARAMS = {
    WISH: 'wish',
    IMG: 'img'
};

export const DOM_EVENTS = {
    MESSAGE: 'message' as const,
    RESIZE: 'resize' as const
};

export const IFRAME_TARGET_ORIGIN = '*';

export const ANIMATION_TIMINGS = {
    FADE_IN: '500ms ease-in',
    SLIDE_IN_UP: '600ms ease-out'
};

export const LOG_MESSAGES = {
    UI_DATA_LOAD_ERROR: 'Failed to load UI data',
    GENERATE_WISH_ERROR: '[WishService] Error generating wish',
    LOAD_SPECIFIC_WISH_ERROR: '[WishService] Error loading specific wish',
    MATH_RANDOM_FALLBACK: 'Fallback to Math.random()'
};
