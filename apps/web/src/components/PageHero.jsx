import React from "react";
import Reveal from "./Reveal";

export default function PageHero({ badge, title, subtitle }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 start-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute top-10 end-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>
      <div className="container-page relative text-center">
        <Reveal>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              {badge}
            </span>
          )}
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
