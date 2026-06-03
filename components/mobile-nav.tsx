"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle as RadixDialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { NavMenu } from "@/components/nav/NavMenu";
import { UserCard } from "@/components/nav/UserCard";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/** Header + drawer para móvil. Oculto en escritorio (md:hidden). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const closeDrawer = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/difar-logo.png"
          alt="Logo difar"
          width={80}
          height={40}
          className="object-contain"
        />
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <RadixDialogTitle asChild>
            <VisuallyHidden>Menú de navegación</VisuallyHidden>
          </RadixDialogTitle>
          <UserCard />
          <NavMenu onNavigate={closeDrawer} />
          <LogoutButton onBeforeOpen={closeDrawer} />
        </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
