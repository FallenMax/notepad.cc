export const isDebugging = /debug=1/.test(location.search)
export const isMac = /Mac/.test(navigator.platform)
export const isMobile = window.innerWidth < 450
