import { useEffect, useMemo, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HeaderActions } from "@/components/header-actions"
import { getSessionUser } from "@/lib/authSession"

type NavItem = {
  label: string
  href: string
  description: string
  icon: "dashboard" | "projects" | "invites" | "profile" | "admin" | "users"
}

type AppShellProps = {
  pageTitle?: string
  children: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Ringkasan project dan aktivitas.",
    icon: "dashboard",
  },
  {
    label: "Project",
    href: "/tasks",
    description: "Daftar task per project.",
    icon: "projects",
  },
  {
    label: "Undangan",
    href: "/invites",
    description: "Undangan masuk project.",
    icon: "invites",
  },
  {
    label: "Profile",
    href: "/profile",
    description: "Data akun dan peran kamu.",
    icon: "profile",
  },
]

const adminNavItems: NavItem[] = [
  {
    label: "Admin",
    href: "/admin",
    description: "Ringkasan kontrol admin.",
    icon: "admin",
  },
  {
    label: "User",
    href: "/admin/users",
    description: "Kelola user developer.",
    icon: "users",
  },
  {
    label: "Project",
    href: "/admin/projects",
    description: "Pantau semua project.",
    icon: "projects",
  },
]

function NavIcon({ name }: { name: NavItem["icon"] }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  if (name === "dashboard") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }

  if (name === "projects") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <rect x="4" y="5" width="16" height="5" rx="1.5" />
        <rect x="4" y="11" width="16" height="8" rx="2" />
      </svg>
    )
  }

  if (name === "invites") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3.5 7l8.5 6 8.5-6" />
      </svg>
    )
  }

  if (name === "admin") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" />
        <path d="M9.5 12.5l2 2 3-3" />
      </svg>
    )
  }

  if (name === "users") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9.5" r="2.5" />
        <path d="M3.5 20c1.4-3 3.8-4.5 6.5-4.5" />
        <path d="M12 20c.6-1.8 2.1-3.2 4.5-3.2 1 0 2 .2 3 .7" />
      </svg>
    )
  }

  return (
    <svg {...commonProps} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.8-3.2 4.8-5 7.5-5s5.7 1.8 7.5 5" />
    </svg>
  )
}

export default function AppShell({ pageTitle, children }: AppShellProps) {
  const [pathname, setPathname] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPathname(window.location.pathname)
    const sessionUser = getSessionUser()
    if (sessionUser) {
      setUserRole(sessionUser.role)
    }
  }, [])

  const currentTitle = useMemo(() => {
    if (pageTitle?.trim()) {
      return pageTitle
    }

    const match = navItems.find((item) => pathname.startsWith(item.href))
    return match?.label ?? "Workspace"
  }, [pageTitle, pathname])

  const isAdmin = userRole.toLowerCase() === "admin"

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="gap-3 px-3 py-4">
            <div className="rounded-2xl border border-sidebar-border bg-[linear-gradient(135deg,#0b1320_0%,#182233_45%,#0b1320_100%)] px-3 py-3 text-sidebar-primary-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-100 group-data-[collapsible=icon]:flex">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="6" />
                    <path d="M4 12c0 0 3.5 3 8 3s8-3 8-3" />
                  </svg>
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-slate-200/80 uppercase">
                    Orbit Workspace
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-serif text-lg font-semibold">
                      Project Orbit
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] tracking-[0.2em] uppercase">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              <p>Fokus ke project aktif dan jobdesk harian.</p>
              {isAdmin ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-amber-800">
                  Mode Admin
                </div>
              ) : null}
            </div>
          </SidebarHeader>
          <SidebarContent>
            {isAdmin ? (
              <SidebarGroup>
                <SidebarGroupLabel>Admin Workspace</SidebarGroupLabel>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === item.href ||
                          pathname.startsWith(item.href + "/")
                        }
                        tooltip={item.description}
                      >
                        <a href={item.href}>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                            <NavIcon name={item.icon} />
                          </span>
                          <span className="truncate group-data-[collapsible=icon]:hidden">
                            {item.label}
                          </span>
                          <span className="ml-auto text-[0.65rem] tracking-[0.2em] text-sidebar-foreground/50 uppercase group-data-[collapsible=icon]:hidden">
                            Go
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
            <SidebarGroup>
              <SidebarGroupLabel>
                {isAdmin ? "Tim & Project" : "Menu Utama"}
              </SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                      }
                      tooltip={item.description}
                    >
                      <a href={item.href}>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                          <NavIcon name={item.icon} />
                        </span>
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                        <span className="ml-auto text-[0.65rem] tracking-[0.2em] text-sidebar-foreground/50 uppercase group-data-[collapsible=icon]:hidden">
                          Go
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-3 py-3">
            <div className="rounded-2xl border border-sidebar-border bg-[linear-gradient(140deg,#f8fafc_0%,#e2e8f0_100%)] px-3 py-3 text-xs text-slate-700 group-data-[collapsible=icon]:hidden">
              Tip: pilih project dulu, baru atur jobdesk.
            </div>
            <div className="hidden h-9 items-center justify-center rounded-2xl border border-sidebar-border bg-white text-[0.65rem] font-semibold tracking-[0.25em] text-slate-500 uppercase group-data-[collapsible=icon]:flex">
              Tip
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarRail />
        <SidebarInset className="relative overflow-hidden border-l border-slate-200/70 bg-white">
          <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 backdrop-blur">
            <div className="flex w-full items-center gap-3 px-4 py-4">
              <SidebarTrigger />
              <div className="flex-1">
                <p className="text-[0.65rem] font-semibold tracking-[0.35em] text-slate-500 uppercase">
                  Ruang Kerja
                </p>
                <h1 className="font-serif text-2xl font-semibold text-slate-900">
                  {currentTitle}
                </h1>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 md:flex">
                Diperbarui hari ini
              </div>
              <HeaderActions />
            </div>
          </header>
          <div className="relative flex-1 animate-in px-4 py-5 fade-in slide-in-from-bottom-2">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
