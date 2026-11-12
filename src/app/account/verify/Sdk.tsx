"use client";

import Script from "next/script";
import { useState } from "react";

declare global { interface Window { snsWebSdk?: any } }

export default function Sdk() {
  const [err, setErr] = useState("");

  async function getToken(): Promise<string> {
    const r = await fetch("/api/sumsub/token", { cache: "no-store" });
    if (!r.ok) throw new Error("token");
    return (await r.json()).token;
  }

  async function launch() {
    try {
      const token = await getToken();
      window.snsWebSdk
        .init(token, getToken)
        .withConf({ lang: "nl" })
        .withOptions({ addViewportTag: false, adaptIframeHeight: true })
        .on("idCheck.onError", () => setErr("Er ging iets mis met de controle. Probeer het opnieuw."))
        .build()
        .launch("#sumsub-container");
    } catch {
      setErr("De identiteitscontrole kon niet worden gestart. Probeer het later opnieuw.");
    }
  }

  return (
    <>
      <Script src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js" onReady={() => { void launch(); }} />
      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}
      <div id="sumsub-container" className="card overflow-hidden bg-white" />
    </>
  );
}
