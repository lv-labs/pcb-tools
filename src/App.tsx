import { Link, Route, Routes } from "react-router"
import SignalConversion from "@/pages/signal-conversion"
import PassiveRcFilters from "@/pages/passive-rc-filters"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import OpampGain from "@/pages/opamp-gain"

import ActiveLowPass from "@/pages/active-low-pass"

export default function App() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="min-w-0 flex-1">
        <header className="flex h-14 items-center gap-3 border-b px-4">
          {/* <SidebarTrigger /> */}
          <h1 className="font-semibold">PCB Tools</h1>
        </header>

        <div className="p-6">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h2 className="text-xl font-semibold">Welcome</h2>
                  <p className="mt-2 text-muted-foreground">
                    Choose a tool from the sidebar.
                  </p>
                </>
              }
            />
            <Route
              path="/audio/signal-conversion"
              element={<SignalConversion />}
            />
            <Route
              path="/filters/active-low-pass"
              element={<ActiveLowPass />}
            />
            <Route path="/filters/passive-rc" element={<PassiveRcFilters />} />
            <Route path="/opamps/gain" element={<OpampGain />} />
            <Route
              path="*"
              element={
                <p>
                  Page not found.{" "}
                  <Link to="/" className="underline">
                    Go home
                  </Link>
                </p>
              }
            />
          </Routes>
        </div>
      </main>
    </SidebarProvider>
  )
}
