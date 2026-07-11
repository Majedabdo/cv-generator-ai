import React from "react";
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-lg shadow-violet-500/30">
        <Plane className="h-5 w-5 -rotate-45 text-white" strokeWidth={2.4} />
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        CVPilot<span className="gradient-text"> AI</span>
      </span>
    </Link>
  );
}
