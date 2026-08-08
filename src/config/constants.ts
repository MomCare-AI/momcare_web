export const ROUTES = {
  login:        "/login",
  dashboard:    "/dashboard",
  patients:     "/patients",
  appointments: "/appointments",
  labReports:   "/lab-reports",
  alerts:       "/alerts",
  inventory:    "/inventory",
  users:        "/users",
}

export const ROLE_ROUTES = {
  doctor: ["/dashboard", "/patients", "/appointments", "/lab-reports", "/alerts"],
  ngo:    ["/dashboard", "/alerts", "/inventory"],
  admin:  ["/dashboard", "/patients", "/appointments", "/lab-reports", "/alerts", "/inventory", "/users"],
}
