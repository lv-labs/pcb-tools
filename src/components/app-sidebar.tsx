import { CircuitBoard } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Audio",
      url: "#",
      items: [
        { title: "Signal Conversion", url: "/audio/signal-conversion" },
        { title: "Example tool 2", url: "#" },
      ],
    },
    {
      title: "Filters",
      url: "#",
      items: [
        { title: "Passive RC Filters", url: "/filters/passive-rc" },
        { title: "Active Filters", url: "#" },
      ],
    },
    {
      title: "Opamps",
      url: "#",
      items: [{ title: "Gain Calculator", url: "#" }],
    },
    {
      title: "Passives",
      url: "#",
      items: [
        { title: "Resistor Value Calculator", url: "#" },
        { title: "Voltage Divider", url: "#" },
      ],
    },
    {
      title: "Ohm’s Law",
      url: "#",
      items: [
        { title: "Ohm’s Law Calculator", url: "#" },
        { title: "Power Calculator", url: "#" },
      ],
    },
  ],
}

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CircuitBoard className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">PCB Tools</span>
                <span>Electronics workbench</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton className="font-medium">
                  {item.title}
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={
                            subItem.url === "#" ? undefined : (
                              <NavLink to={subItem.url} end />
                            )
                          }
                          aria-disabled={subItem.url === "#" || undefined}
                          isActive={subItem.url === pathname}
                        >
                          {subItem.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">Made by lv_labs</p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
