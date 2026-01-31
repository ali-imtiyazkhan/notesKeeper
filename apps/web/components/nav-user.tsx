"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    if (typeof document === "undefined") return
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    const next = !isDark
    setIsDark(next)
    if (next) root.classList.add("dark")
    else root.classList.remove("dark")
    try { localStorage.setItem("theme", next ? "dark" : "light") } catch {}
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium dark:text-[#d4d4d4]">{user.name}</span>
                <span className="truncate text-xs dark:text-[#9cdcfe]">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 dark:text-[#9cdcfe]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium dark:text-[#d4d4d4]">{user.name}</span>
                  <span className="truncate text-xs dark:text-[#9cdcfe]">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]">
                <Sparkles className="size-4 dark:text-[#9cdcfe]" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); toggleTheme() }}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  Theme
                </div>
                <div className={`h-5 w-9 rounded-full ${isDark ? 'bg-[#4fc3f7]' : 'bg-muted'} relative transition-colors`}>
                  <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background dark:bg-[#1a1a1a] shadow transition-transform ${isDark ? 'translate-x-4' : ''}`}></div>
                </div>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            {/* <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
