"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { usePathname } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { Loader } from "@/components/Loader";

// Lazy: the chat bundle (its client deps + the /api/chat caller) only downloads when the launcher
// is FIRST opened — the dynamic import fires on first mount. So the ~8,770 static pages ship with
// just this small button and keep their Core Web Vitals intact; nothing heavy loads until a tap.
const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
  loading: () => <div className="cl-loading"><Loader size={34} label="Fellow" /></div>,
});

export default function ChatLauncher() {
  const t = useTranslations("launcher");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false); // true after first open — keeps the chat alive
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // The homepage already presents Ask Fellow inline (the tabbed hero) — no floating launcher there.
  // usePathname() is locale-stripped, so "/" covers both "/" and "/es".
  const onHome = pathname === "/";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openPanel() { setMounted(true); setOpen(true); }
  function close() { setOpen(false); fabRef.current?.focus(); }

  if (onHome) return null;

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          type="button"
          className="chat-fab"
          onClick={openPanel}
          aria-label={t("open")}
          aria-haspopup="dialog"
        >
          <Icon name="chatdots" size={22} />
          <span className="chat-fab-label">{tc("askFellow")}</span>
        </button>
      )}

      {/* Rendered after first open and kept mounted (hidden via CSS when closed) so the conversation
          persists across open/close within a visit. */}
      {mounted && (
        <div className={"chat-launcher" + (open ? " is-open" : "")} aria-hidden={!open}>
          <div className="cl-overlay" onClick={close} />
          <div
            className="cl-panel"
            role="dialog"
            aria-modal="true"
            aria-label={tc("askFellow")}
            tabIndex={-1}
            ref={panelRef}
          >
            <div className="cl-head">
              <span className="cl-title">
                <span className="cl-ava" aria-hidden><Mark size={28} /></span>
                {tc("askFellow")}
              </span>
              <button type="button" className="cl-close" onClick={close} aria-label={t("close")}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="cl-body">
              <Chat />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
