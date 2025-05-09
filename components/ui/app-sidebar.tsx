"use client";

import * as React from "react";
import {
  Bot,
  Command,
  FileCheck,
  PieChart,
  PlayCircle,
  Shield,
  SquareTerminal,
  User,
  UserX,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "Controle Geral",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Traders Avaliação",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: PieChart,
        },
        {
          title: "Avaliações",
          url: "/evaluations",
          icon: PlayCircle,
        },
        {
          title: "Clientes",
          url: "/clients",
          icon: User,
        },
        {
          title: "Contato Reprovados",
          url: "/reproved",
          icon: UserX,
        },
        {
          title: "Assinaturas", // Novo item adicionado
          url: "/subscriptions",
          icon: FileCheck, // ou outro ícone adequado
        },
        {
          title: "Perfis de Risco",
          url: "/risk-profiles",
          icon: Shield, // Ou outro ícone apropriado
          //isActive: pathname.startsWith("/risk-profiles"),
        },
      ],
    },
    {
      title: "Traders Conta Real",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Dashboard",
          url: "#",
        },
        {
          title: "Traders",
          url: "#",
        },
        {
          title: "Controle de Saldo",
          url: "#",
        },
        {
          title: "Controle de Plataformas",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Traders House</span>
                  <span className="truncate text-xs">Controle</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
