"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Check,
  X,
  Trash2,
  Loader2,
  StickyNote,
  Send,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentMember } from "@/lib/hooks/use-current-member";

type EmployeeDetail = {
  id: string;
  role: string;
  isActive: boolean;
  isActivated: boolean;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    nickname: string | null;
    profileImage: string | null;
    createdAt: string;
  };
};

type Note = {
  id: string;
  subjectId: string;
  authorId: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "ADMIN":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
    case "MANAGER":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    default:
      return "";
  }
}

function InlineEdit({
  value,
  onSave,
  type = "text",
  disabled = false,
}: {
  value: string;
  onSave: (val: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleSave() {
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
          className="h-7 text-sm"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleSave}
          className="text-emerald-600"
        >
          <Check className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCancel}
          className="text-muted-foreground"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="text-sm">{value || "-"}</span>
      {!disabled && (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="invisible group-hover:visible text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  );
}

export function EmployeeDetail({ memberId }: { memberId: string }) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentMember } = useCurrentMember();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [noteText, setNoteText] = useState("");

  const isAdmin =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const isManagerPlus =
    isAdmin || currentMember?.role === "MANAGER";

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery<EmployeeDetail>({
    queryKey: ["employee", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${memberId}`);
      if (!res.ok) throw new Error(t("detail.employeeNotFound"));
      return res.json();
    },
  });

  const { data: notes } = useQuery<Note[]>({
    queryKey: ["employee-notes", memberId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${memberId}/notes`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isManagerPlus,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/employees/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || tc("save") + " " + t("error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("detail.saved"));
      queryClient.invalidateQueries({ queryKey: ["employee", memberId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch(`/api/employees/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("detail.roleChanged"));
      queryClient.invalidateQueries({ queryKey: ["employee", memberId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/employees/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("detail.employeeDeactivated"));
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const res = await fetch(`/api/admin/users/${memberId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("detail.passwordReset"));
      setResetPasswordOpen(false);
      setResetPasswordValue("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const noteMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/employees/${memberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("error"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("detail.noteSaved"));
      setNoteText("");
      queryClient.invalidateQueries({
        queryKey: ["employee-notes", memberId],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return <EmployeeDetailSkeleton />;
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/employees")}>
          <ArrowLeft className="size-4" />
          {tc("back")}
        </Button>
        <Card className="p-12 text-center">
          <p className="text-destructive">{t("detail.employeeNotFound")}</p>
        </Card>
      </div>
    );
  }

  const joinedDate = new Date(employee.joinedAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const isSelf = employee.user.id === currentMember?.user?.id;
  const canEdit = isAdmin || isSelf;
  const canChangeRole = isAdmin && !isSelf && employee.role !== "OWNER";
  const canDelete = isAdmin && !isSelf && employee.role !== "OWNER";

  function roleLabel(role: string) {
    switch (role) {
      case "OWNER": return t("owner");
      case "ADMIN": return t("admin");
      case "MANAGER": return t("manager");
      default: return t("employee");
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/employees")}>
        <ArrowLeft className="size-4" />
        {t("detail.backToList")}
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {employee.user.profileImage && (
              <AvatarImage src={employee.user.profileImage} />
            )}
            <AvatarFallback className="text-lg">
              {getInitials(employee.user.firstName, employee.user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {employee.user.lastName}, {employee.user.firstName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getRoleBadgeColor(employee.role)}>
                {roleLabel(employee.role)}
              </Badge>
              {!employee.isActive && (
                <Badge variant="destructive">{t("status.inactive")}</Badge>
              )}
              {employee.isActive && !employee.isActivated && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600"
                >
                  {t("status.notActivated")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {(canChangeRole || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{t("detail.actions")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAdmin && (
                <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
                  {t("detail.resetPassword")}
                </DropdownMenuItem>
              )}
              {canDelete && employee.isActive && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  {t("detail.deactivate")}
                </DropdownMenuItem>
              )}
              {canDelete && !employee.isActive && (
                <DropdownMenuItem
                  onClick={() => {
                    toast.info(t("detail.reactivationNotImplemented"));
                  }}
                >
                  {t("detail.reactivate")}
                </DropdownMenuItem>
              )}
              {canChangeRole && (
                <>
                  <DropdownMenuSeparator />
                  {["ADMIN", "MANAGER", "EMPLOYEE"]
                    .filter((r) => r !== employee.role)
                    .map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => roleMutation.mutate(r)}
                      >
                        {t("detail.changeRoleTo", { role: roleLabel(r) })}
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
              {t("detail.contactInfo")}
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] items-center">
                <span className="text-sm text-muted-foreground">{t("detail.firstName")}</span>
                <InlineEdit
                  value={employee.user.firstName}
                  onSave={(v) => updateMutation.mutate({ firstName: v })}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center">
                <span className="text-sm text-muted-foreground">{t("detail.lastName")}</span>
                <InlineEdit
                  value={employee.user.lastName}
                  onSave={(v) => updateMutation.mutate({ lastName: v })}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center">
                <span className="text-sm text-muted-foreground">{t("detail.nickname")}</span>
                <InlineEdit
                  value={employee.user.nickname || ""}
                  onSave={(v) => updateMutation.mutate({ nickname: v })}
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center">
                <span className="text-sm text-muted-foreground">
                  <Mail className="inline size-3.5 mr-1" />
                  {t("detail.email")}
                </span>
                <InlineEdit
                  value={employee.user.email}
                  onSave={(v) => updateMutation.mutate({ email: v })}
                  type="email"
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center">
                <span className="text-sm text-muted-foreground">
                  <Phone className="inline size-3.5 mr-1" />
                  {t("detail.phone")}
                </span>
                <InlineEdit
                  value={employee.user.phone || ""}
                  onSave={(v) => updateMutation.mutate({ phone: v })}
                  type="tel"
                  disabled={!canEdit}
                />
              </div>
            </div>

            {canChangeRole && (
              <div className="grid grid-cols-[120px_1fr] items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">{t("detail.role")}</span>
                <Select
                  value={employee.role}
                  onValueChange={(v) => roleMutation.mutate(v)}
                  disabled={roleMutation.isPending}
                >
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t("admin")}</SelectItem>
                    <SelectItem value="MANAGER">{t("manager")}</SelectItem>
                    <SelectItem value="EMPLOYEE">{t("employee")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
              {t("detail.navigation")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled>
                <Clock className="size-4" />
                {t("hours")}
              </Button>
            </div>
          </Card>

          {isManagerPlus && (
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
                <StickyNote className="inline size-3.5 mr-1" />
                {t("notes")}
              </h2>

              <div className="flex gap-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("detail.addNote")}
                  className="min-h-[60px]"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    if (noteText.trim()) {
                      noteMutation.mutate(noteText.trim());
                    }
                  }}
                  disabled={!noteText.trim() || noteMutation.isPending}
                >
                  {noteMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>

              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="whitespace-pre-wrap">{note.text}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {note.author.firstName} {note.author.lastName}
                        </span>
                        <span>-</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("detail.noNotes")}
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide mb-4">
              {t("detail.monthlyOverview")}
            </h2>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Clock className="size-10 opacity-30 mb-3" />
              <p className="text-sm font-medium">E-Dash</p>
              <p className="text-xs mt-1">
                {t("detail.eDashComingSoon")}
              </p>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
              {t("detail.memberMeta")}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.memberSince", { date: joinedDate })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.statusLabel")}</span>
                <span>
                  {employee.isActive ? t("status.active") : t("status.inactive")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.activated")}</span>
                <span>{employee.isActivated ? t("detail.yes") : t("detail.no")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.memberId")}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {employee.id}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("detail.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("detail.deleteConfirm", {
                name: `${employee.user.firstName} ${employee.user.lastName}`,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate();
                setDeleteOpen(false);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("detail.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordOpen} onOpenChange={(o) => { if (!o) setResetPasswordValue(""); setResetPasswordOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("detail.resetPassword")}</DialogTitle>
            <DialogDescription>
              {t("detail.resetPasswordDescription", {
                name: `${employee.user.firstName} ${employee.user.lastName}`,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder={t("detail.resetPasswordPlaceholder")}
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              minLength={6}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordOpen(false); setResetPasswordValue(""); }}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (resetPasswordValue.length >= 6) {
                  resetPasswordMutation.mutate(resetPasswordValue);
                }
              }}
              disabled={resetPasswordValue.length < 6 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("detail.savePassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
