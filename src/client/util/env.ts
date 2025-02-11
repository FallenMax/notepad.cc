export const isDebugging = /debug=1/.test(location.search)
export const isMac = /Mac/.test(navigator.platform)
export const isMobile = /(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent)
