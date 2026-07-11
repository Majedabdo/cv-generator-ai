import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import integratedAiClient from "@/lib/integratedAiClient";

let sdkPromise = null;
let sdkKey = "";

function loadSdk(clientId, currency) {
  const key = `${clientId}:${currency}`;
  if (sdkPromise && sdkKey === key) return sdkPromise;
  // Reset if a different client/currency is requested.
  sdkKey = key;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("paypal-sdk");
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.id = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    s.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal SDK unavailable")));
    s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(s);
  });
  return sdkPromise;
}

/**
 * Fetches the public PayPal config and returns { loading, config }.
 * config.enabled tells the caller whether to show real PayPal buttons.
 */
export function usePayPalConfig() {
  const [state, setState] = useState({ loading: true, config: null });
  useEffect(() => {
    let alive = true;
    integratedAiClient
      .fetch("/payments/config")
      .then((cfg) => alive && setState({ loading: false, config: cfg }))
      .catch(() => alive && setState({ loading: false, config: { enabled: false } }));
    return () => { alive = false; };
  }, []);
  return state;
}

/**
 * Renders live PayPal Buttons. Calls onApprove(orderId) after a successful capture.
 */
export default function PayPalCheckout({ config, onApprove, onError, disabled }) {
  const ref = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const cbRef = useRef({ onApprove, onError });
  cbRef.current = { onApprove, onError };

  useEffect(() => {
    if (!config?.enabled || !config?.clientId) { setStatus("error"); return; }
    let cancelled = false;
    loadSdk(config.clientId, config.currency || "USD")
      .then((paypal) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        paypal
          .Buttons({
            style: { layout: "vertical", color: "blue", shape: "pill", label: "paypal" },
            createOrder: (data, actions) =>
              actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: String(Number(config.amount || 2.69).toFixed(2)),
                      currency_code: config.currency || "USD",
                    },
                    description: "CVPilot resume unlock",
                  },
                ],
              }),
            onApprove: async (data, actions) => {
              try {
                await actions.order.capture();
                cbRef.current.onApprove?.(data.orderID);
              } catch (err) {
                cbRef.current.onError?.(err);
              }
            },
            onError: (err) => cbRef.current.onError?.(err),
          })
          .render(ref.current)
          .then(() => !cancelled && setStatus("ready"))
          .catch(() => !cancelled && setStatus("error"));
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => { cancelled = true; };
  }, [config]);

  if (status === "error") {
    return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">PayPal is temporarily unavailable. Please try again later.</p>;
  }

  return (
    <div className="relative">
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading PayPal…
        </div>
      )}
      <div ref={ref} className={disabled ? "pointer-events-none opacity-50" : ""} />
    </div>
  );
}
