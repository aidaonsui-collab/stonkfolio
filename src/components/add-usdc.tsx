"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createOnrampKit, fetchOnrampSession, type OnrampKit } from "@circle-fin/onramp-kit";
import { useAccount } from "wagmi";
import { ONRAMP_WIDGET_BASE_URL } from "@/lib/onramp";
import { Button } from "./ui/button";

type OnrampUi = {
  open: boolean;
  busy: boolean;
  toggle: () => void;
};

const OnrampUiContext = createContext<OnrampUi | null>(null);

export function AddUsdc({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<{ close: () => void } | null>(null);
  const kit = useRef<OnrampKit | null>(null);

  function browserKit() {
    if (!kit.current) kit.current = createOnrampKit({ widgetBaseUrl: ONRAMP_WIDGET_BASE_URL });
    return kit.current;
  }

  useEffect(() => {
    return () => {
      widget.current?.close();
    };
  }, []);

  function close() {
    widget.current?.close();
    widget.current = null;
    setOpen(false);
    setBusy(false);
  }

  async function start() {
    setNote("");
    if (!isConnected || !address) {
      setNote("Connect a wallet on Arc. USDC lands in that wallet.");
      return;
    }
    setOpen(true);
    setBusy(true);
    widget.current?.close();
    try {
      const session = await fetchOnrampSession({
        url: "/api/onramp/sessions",
        body: {
          appUserId: address.toLowerCase(),
          destinationAddress: address,
          destinationChain: "arc",
          currency: "USDC",
          assets: { pairs: [{ token: "USDC", chain: "arc" }] },
        },
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (!box.current) return;
      widget.current = browserKit().mountIframe({
        session,
        container: box.current,
        title: "Add USDC",
      });
    } catch {
      setNote("Add USDC is not available yet.");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnrampUiContext.Provider value={{ open, busy, toggle: () => (open ? close() : void start()) }}>
      {children}
      {note ? <p className="mt-4 max-w-md text-sm text-muted">{note}</p> : null}
      {open ? (
        <div className="mt-4 w-full">
          <p className="mb-3 max-w-md text-sm text-muted">
            USDC goes to your wallet. This checkout is a test. No real charge.
          </p>
          <div ref={box} className="h-[720px] w-full overflow-hidden rounded-xl bg-surface" />
        </div>
      ) : null}
    </OnrampUiContext.Provider>
  );
}

export function AddUsdcButton() {
  const ui = useContext(OnrampUiContext);
  if (!ui) return null;
  return (
    <Button type="button" variant="outline" size="lg" onClick={ui.toggle} disabled={ui.busy}>
      {ui.open ? "Close" : "Add USDC with Apple or Google Pay"}
    </Button>
  );
}
