import type { Metadata } from "next";
import Link from "next/link";

import { readEnvironmentContractStatus } from "@/lib/environment-contract";

import {
  executionChecklist,
  hostingBaseline,
  planningAssets,
  productSurfaces,
  serviceBoundaries,
  type PlanningAssetId,
  type ProductSurfaceId,
  type ServiceBoundaryId,
} from "@/lib/prototype-data";

export const metadata: Metadata = {
  title: "Service Map",
  description: "Phase 11 product-surface split and first production service-boundary contract.",
};

const surfaceNameById = Object.fromEntries(
  productSurfaces.map((surface) => [surface.id, surface.name]),
) as Record<ProductSurfaceId, string>;

const serviceNameById = Object.fromEntries(
  serviceBoundaries.map((boundary) => [boundary.id, boundary.name]),
) as Record<ServiceBoundaryId, string>;

const planningAssetById = Object.fromEntries(
  planningAssets.map((asset) => [asset.id, asset]),
) as Record<PlanningAssetId, (typeof planningAssets)[number]>;

const executionChecklistClassName = {
  Done: "status-chip status-done",
  Next: "status-chip status-next",
} as const;

const environmentContractClassName = {
  ready: "status-chip status-done",
  blocked: "status-chip status-next",
} as const;

export default function ServiceMapPage() {
  const environmentContractStatus = readEnvironmentContractStatus();

  return (
    <div className="main-shell space-y-10 py-10 md:py-14">
      <section className="glass-panel rounded-[2rem] p-8 md:p-10">
        <p className="section-kicker">Phase 11 production planning</p>
        <h1 className="section-title mt-4 font-semibold tracking-tight">
          Lock the stack choice, then turn it into the first execution checklist.
        </h1>
        <p className="muted-copy mt-6 max-w-4xl text-lg leading-8">
          The slice is green, so this route turns the exit decision into explicit
          contracts. It shows what the browser client, player portal, and admin
          console each own, which services back them, which hosted baseline
          will carry the first production deployment, and the exact migration,
          environment, and rollout checklist that now follows from that choice.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            href="/backlog"
            className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-[color:var(--surface-strong)] transition hover:bg-[color:var(--accent-teal)]"
          >
            Return to backlog
          </Link>
          <a
            href="/api/service-map"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
          >
            Open JSON contract
          </a>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8" data-testid="service-map-execution-checklist">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Execution baseline</p>
            <h2 className="text-3xl font-semibold">
              Sequence migrations, environment setup, and rollout before production implementation.
            </h2>
          </div>
          <span className="data-chip">Milestone 7</span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {executionChecklist.map((section) => (
            <article
              key={section.id}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
              data-testid={`service-map-execution-${section.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{section.title}</p>
                  <p className="muted-copy mt-2 text-sm leading-7">{section.summary}</p>
                </div>
                <span className={executionChecklistClassName[section.status]}>{section.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm leading-7">
                {section.steps.map((step) => (
                  <div
                    key={step}
                    className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3"
                  >
                    {step}
                  </div>
                ))}
              </div>
              {section.assetIds.length > 0 ? (
                <div className="mt-4 space-y-2 text-sm leading-7">
                  {section.assetIds.map((assetId) => {
                    const asset = planningAssetById[assetId];

                    return (
                      <a
                        key={asset.id}
                        href={asset.href}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`service-map-asset-${asset.id}`}
                        className="block rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
                      >
                        <span className="font-semibold">{asset.title}</span>
                        <span className="muted-copy mt-2 block">{asset.summary}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-7">
                  <p className="font-semibold">Asset follow-through</p>
                  <p className="muted-copy mt-2">
                    This section stays open until the rollout runbook is written and linked here.
                  </p>
                </div>
              )}
              <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-7">
                <p className="font-semibold">Done when</p>
                <p className="muted-copy mt-2">{section.doneWhen}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8" data-testid="service-map-hosting-baseline">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">VS-21 deployment baseline</p>
            <h2 className="text-3xl font-semibold">
              Choose one hosted stack and one rollout path before service work spreads.
            </h2>
          </div>
          <span className="data-chip">{hostingBaseline.primaryRegion}</span>
        </div>
        <p className="muted-copy mt-4 max-w-4xl text-sm leading-7">{hostingBaseline.summary}</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {hostingBaseline.platformDecisions.map((decision) => (
            <article
              key={decision.id}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
              data-testid={`service-map-hosting-${decision.id}`}
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {decision.label}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{decision.provider}</h3>
              <p className="muted-copy mt-3 text-sm leading-7">{decision.deploymentShape}</p>
              <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-7">
                <p className="font-semibold">Why this provider</p>
                <p className="muted-copy mt-2">{decision.rationale}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {decision.supportsServices.map((serviceId) => (
                  <span key={serviceId} className="data-chip">
                    {serviceNameById[serviceId]}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Release strategy</p>
            <p className="muted-copy mt-3">{hostingBaseline.releaseStrategy}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Operating rules</p>
            <div className="mt-3 space-y-2">
              {hostingBaseline.operatingRules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8" data-testid="service-map-environment-contract">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Hosted environment validation</p>
            <h2 className="text-3xl font-semibold">
              Check the current runtime against the locked provider contract before deployment rehearsal.
            </h2>
          </div>
          <span
            className={
              environmentContractStatus.contractReady
                ? environmentContractClassName.ready
                : environmentContractClassName.blocked
            }
            data-testid="service-map-environment-contract-status"
          >
            {environmentContractStatus.contractReady ? "Ready" : "Needs setup"}
          </span>
        </div>
        <p className="muted-copy mt-4 max-w-4xl text-sm leading-7">
          {environmentContractStatus.headline}
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="data-chip" data-testid="service-map-environment-contract-runtime">
                Runtime: {environmentContractStatus.runtimeMode === "local-prototype" ? "local prototype" : "hosted candidate"}
              </span>
              <span className="data-chip" data-testid="service-map-environment-contract-source">
                Mode source: {environmentContractStatus.runtimeModeSource}
              </span>
              <span className="data-chip" data-testid="service-map-environment-contract-gate">
                Gate: {environmentContractStatus.gateStatus}
              </span>
              <span className="data-chip">
                Valid {environmentContractStatus.validCount}/{environmentContractStatus.requiredCount}
              </span>
              <span className="data-chip">Missing {environmentContractStatus.missingKeys.length}</span>
              <span className="data-chip">Invalid {environmentContractStatus.invalidKeys.length}</span>
            </div>
            <p className="mt-4">{environmentContractStatus.gateSummary}</p>
            <p className="muted-copy mt-3">{environmentContractStatus.nextStep}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
              <a
                href="/api/environment-contract"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 transition hover:border-[color:var(--accent-teal)] hover:bg-white"
              >
                Open validation JSON
              </a>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5 text-sm leading-7">
            <p className="font-semibold">Missing or invalid contract keys</p>
            {environmentContractStatus.missingKeys.length === 0 &&
            environmentContractStatus.invalidKeys.length === 0 ? (
              <p className="muted-copy mt-3">All hosted contract keys are configured and valid.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {environmentContractStatus.missingKeys.map((key) => (
                  <span key={key} className="data-chip">
                    Missing: {key}
                  </span>
                ))}
                {environmentContractStatus.invalidKeys.map((key) => (
                  <span key={key} className="data-chip">
                    Invalid: {key}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section data-testid="service-map-surfaces">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">VS-19 product surfaces</p>
            <h2 className="text-3xl font-semibold">
              Keep the player client, planning portal, and staff console explicit.
            </h2>
          </div>
          <span className="data-chip">3 surfaces</span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {productSurfaces.map((surface) => {
            const connectedBoundaries = serviceBoundaries.filter((boundary) =>
              boundary.consumerSurfaces.includes(surface.id),
            );

            return (
              <article
                key={surface.id}
                className="glass-panel rounded-[1.75rem] p-6"
                data-testid={`service-map-surface-${surface.id}`}
              >
                <p className="section-kicker">{surface.audience}</p>
                <h3 className="mt-4 text-2xl font-semibold">{surface.name}</h3>
                <div className="mt-5 space-y-5 text-sm leading-7">
                  <div>
                    <p className="font-semibold">Responsibilities</p>
                    <div className="mt-3 space-y-2">
                      {surface.responsibilities.map((responsibility) => (
                        <div
                          key={responsibility}
                          className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/72 px-4 py-3"
                        >
                          {responsibility}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/72 p-4">
                    <p className="font-semibold">Shared auth assumption</p>
                    <p className="muted-copy mt-2">{surface.sharedAuth}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Overlap rules</p>
                    <div className="mt-3 space-y-2">
                      {surface.overlapRules.map((rule) => (
                        <div
                          key={rule}
                          className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/72 px-4 py-3"
                        >
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Current prototype coverage</p>
                    <div className="mt-3 space-y-2">
                      {surface.prototypeCoverage.map((coverage) => (
                        <div
                          key={coverage}
                          className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/72 px-4 py-3"
                        >
                          {coverage}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  {connectedBoundaries.map((boundary) => (
                    <span key={boundary.id} className="data-chip">
                      {boundary.name}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8" data-testid="service-map-boundaries">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">VS-20 service boundaries</p>
            <h2 className="text-3xl font-semibold">
              Split web, realtime, and worker responsibilities before the stack grows.
            </h2>
          </div>
          <span className="data-chip">5 boundaries</span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {serviceBoundaries.map((boundary) => (
            <article
              key={boundary.id}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-5"
              data-testid={`service-map-boundary-${boundary.id}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold">{boundary.name}</p>
                  <p className="muted-copy mt-2 text-sm leading-7">
                    {boundary.currentImplementation}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm leading-6 lg:max-w-72">
                  <p className="font-semibold">Target runtime</p>
                  <p className="muted-copy mt-2">{boundary.targetRuntime}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="font-semibold">Responsibilities</p>
                  <div className="mt-3 space-y-2 text-sm leading-7">
                    {boundary.responsibilities.map((responsibility) => (
                      <div
                        key={responsibility}
                        className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3"
                      >
                        {responsibility}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-7">
                    <p className="font-semibold">Production shift</p>
                    <p className="muted-copy mt-2">{boundary.productionShift}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Owned data</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {boundary.ownedData.map((ownedData) => (
                      <span key={ownedData} className="data-chip">
                        {ownedData}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 font-semibold">Serves these surfaces</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {boundary.consumerSurfaces.map((surfaceId) => (
                      <span key={surfaceId} className="data-chip">
                        {surfaceNameById[surfaceId]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}