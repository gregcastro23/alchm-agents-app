export const DESKTOP_APP_REPOSITORY_URL = 'https://github.com/gregcastro23/alchm-agents-app'
export const DESKTOP_APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_ALCHM_DESKTOP_DOWNLOAD_URL?.trim() ||
  `${DESKTOP_APP_REPOSITORY_URL}/releases`

const PLATFORM_DOWNLOAD_URLS = {
  mac: process.env.NEXT_PUBLIC_ALCHM_DESKTOP_MAC_DOWNLOAD_URL?.trim(),
  windows: process.env.NEXT_PUBLIC_ALCHM_DESKTOP_WINDOWS_DOWNLOAD_URL?.trim(),
  linux: process.env.NEXT_PUBLIC_ALCHM_DESKTOP_LINUX_DOWNLOAD_URL?.trim(),
}

export function getDesktopAppDownloadUrl() {
  if (typeof window === 'undefined') {
    return DESKTOP_APP_DOWNLOAD_URL
  }

  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  if (PLATFORM_DOWNLOAD_URLS.mac && (userAgent.includes('mac') || platform.includes('mac'))) {
    return PLATFORM_DOWNLOAD_URLS.mac
  }

  if (PLATFORM_DOWNLOAD_URLS.windows && (userAgent.includes('win') || platform.includes('win'))) {
    return PLATFORM_DOWNLOAD_URLS.windows
  }

  if (PLATFORM_DOWNLOAD_URLS.linux && (userAgent.includes('linux') || platform.includes('linux'))) {
    return PLATFORM_DOWNLOAD_URLS.linux
  }

  return DESKTOP_APP_DOWNLOAD_URL
}

export function openDesktopAppDownload() {
  if (typeof window === 'undefined') {
    return
  }

  window.open(getDesktopAppDownloadUrl(), '_blank', 'noopener,noreferrer')
}
