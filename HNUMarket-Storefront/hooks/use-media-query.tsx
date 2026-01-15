import * as React from "react"
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

/**
 * Check if the screen size is mobile (< 768px).
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   return <MobileComponent />;
 * }
 */
export function useIsMobile() {
    const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    return isMobile
}

/**
 * Check if the screen size is tablet (>= 768px and < 1024px).
 *
 * @example
 * const isTablet = useIsTablet();
 * return isTablet ? <TabletView /> : <DefaultView />;
 */
export function useIsTablet() {
    const isTablet = useMediaQuery(
        `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    )
    return isTablet
}

/**
 * Check if the screen size is desktop (>= 1024px).
 *
 * @example
 * const isDesktop = useIsDesktop();
 * if (isDesktop) {
 *   // Do desktop specific logic
 * }
 */
export function useIsDesktop() {
    const isDesktop = useMediaQuery(`(min-width: ${TABLET_BREAKPOINT}px)`)
    return isDesktop
}

type UseMediaQueryOptions = {
    defaultValue?: boolean;
    initializeWithValue?: boolean;
};

const IS_SERVER = typeof window === "undefined";

/**
 * Custom media query hook.
 *
 * @param query The media query string to match.
 * @param options Configuration options.
 *
 * @example
 * const isLargeScreen = useMediaQuery("(min-width: 1280px)");
 *
 * @example
 * const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
 *   defaultValue: false,
 *   initializeWithValue: false
 * });
 */
export function useMediaQuery(
    query: string,
    { defaultValue = false, initializeWithValue = true }: UseMediaQueryOptions = {}
): boolean {
    const getMatches = (query: string): boolean => {
        if (IS_SERVER) {
            return defaultValue;
        }
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = React.useState<boolean>(() => {
        if (initializeWithValue) {
            return getMatches(query);
        }
        return defaultValue;
    });

    React.useEffect(() => {
        const matchMedia = window.matchMedia(query);

        const handleChange = () => {
            setMatches(matchMedia.matches);
        };

        handleChange();

        matchMedia.addEventListener("change", handleChange);

        return () => {
            matchMedia.removeEventListener("change", handleChange);
        };
    }, [query]);

    return matches;
}

export type { UseMediaQueryOptions };
