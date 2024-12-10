import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ThemeProvider } from "@/components/theme-provider";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SidebarProvider>
          {/* Sidebar */}
          <AppSidebar className="fixed rounded-2xl left-0 w-64 h-screen z-30 bg-zinc-900/95 border-r border-zinc-800 " />

          {/* Main Content */}
          <main className="flex-1 rounded-2xl pl-6">
            {/* Header */}
            <div className="sticky top-0 z-20  flex h-16 items-center gap-4 border-b border-zinc-800 bg-background px-4">
              <SidebarTrigger className="text-zinc-400 hover:text-zinc-100" />
              <Separator orientation="vertical" className="h-6" />
              <Image src="/logo.png" width={130} height={30} alt="Logo" />
              Mesa Propietária - Traders House
              <Breadcrumb />
            </div>

            {/* Content */}
            <div className="p-4">{children}</div>
          </main>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </>
  );
}
