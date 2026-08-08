export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit",
  })
}
