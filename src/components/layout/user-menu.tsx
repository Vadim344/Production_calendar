"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { LogOut, Moon, Sun, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentMember } from "@/lib/hooks/use-current-member";
import { routing } from "@/i18n/routing";

export function UserMenu() {
  const { data: member } = useCurrentMember();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const tl = useTranslations("locales");

  const firstName = member?.user.firstName ?? "";
  const lastName = member?.user.lastName ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  function switchLang(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 gap-2 px-2">
          <Avatar size="sm">
            {member?.user.profileImage && (
              <AvatarImage
                src={member.user.profileImage}
                alt={fullName}
              />
            )}
            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:inline">
            {fullName || tc("loading")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{fullName}</p>
            {member?.organizationName && (
              <p className="text-xs text-muted-foreground">
                {member.organizationName}
              </p>
            )}
            {member?.user.email && (
              <p className="text-xs text-muted-foreground truncate">
                {member.user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Language switcher */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1">
          {tc("language")}
        </DropdownMenuLabel>
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLang(l)}
            className={l === locale ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : ""}
          >
            <Languages className="mr-2 size-4" />
            {tl(l)}
            {l === locale && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="mr-2 size-4" />
          ) : (
            <Moon className="mr-2 size-4" />
          )}
          {theme === "dark" ? "Hellmodus" : "Dunkelmodus"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="destructive"
        >
          <LogOut className="mr-2 size-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}