/**
 * The one version file for the storefront and admin console.
 *
 * APP_VERSION is the release number, bumped by hand for each release.
 * BUILD_LABEL is the commit and date this build was made from (injected by vite.config.js),
 * so a deployed site shows exactly which commit is running.
 */
export const APP_VERSION = '1.0.0';

declare const __APP_BUILD__: string;
export const BUILD_LABEL: string = __APP_BUILD__;
