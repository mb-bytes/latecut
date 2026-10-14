import React, { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { CheckCircle2, XCircle, Info, Cpu, Activity, ShieldCheck, Database, Key } from "lucide-react"
import { CatchupResponse, InspectResponse } from "../types/match"
import { getInspect } from "../lib/api"

interface HowAiWorksPanelProps {
  catchupResult: CatchupResponse | null
}

export const HowAiWorksPanel: React.FC<HowAiWorksPanelProps> = ({ catchupResult }) => {
  const [inspectData, setInspectData] = useState<InspectResponse | null>(null)
  const [activeTab, setActiveTab] = useState<string>("facts")

  useEffect(() => {
    getInspect("en")
      .then((data) => setInspectData(data))
      .catch(() => {})
  }, [catchupResult])

  return (
    <Card className="w-full bg-card/80 border-border/80 shadow-xl backdrop-blur-md rounded-2xl overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-border/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            How the AI Works
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full auditability: deterministic facts, weighted moment detection, prompt construction, and grounding checks.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-secondary/50">
          Transparency & Safety
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-secondary/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="facts" className="text-xs flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> Facts
            </TabsTrigger>
            <TabsTrigger value="moments" className="text-xs flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" /> Key Moments
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Prompt
            </TabsTrigger>
            <TabsTrigger value="grounding" className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Grounding
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="text-xs flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Telemetry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facts" className="space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Structured facts extracted deterministically from live delivery events:
            </div>
            {inspectData?.facts ? (
              <pre className="bg-secondary/40 border border-border/60 rounded-xl p-4 text-xs font-mono text-foreground/90 overflow-x-auto max-h-96">
                {JSON.stringify(inspectData.facts, null, 2)}
              </pre>
            ) : (
              <div className="text-xs text-muted-foreground p-6 text-center">Loading facts data...</div>
            )}
          </TabsContent>

          <TabsContent value="moments" className="space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Moments selected via pure weighted scoring (wickets, milestone 50s/100s, clutch boundaries):
            </div>
            {inspectData?.key_moments && inspectData.key_moments.length > 0 ? (
              <div className="space-y-3">
                {inspectData.key_moments.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs font-bold text-primary">
                          Over {m.over_ball}
                        </Badge>
                        <span className="font-semibold text-foreground text-sm">{m.description}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        Weight: {m.weight}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                      <span>Reason: {m.reason}</span>
                    </div>
                    <Progress value={Math.min(100, (m.weight / 5) * 100)} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground p-6 text-center">
                No key moments detected yet in this match phase.
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  System Prompt (Constraint & Hallucination Guard)
                </h4>
                <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 text-xs font-mono text-foreground/90 leading-relaxed">
                  {inspectData?.system_prompt || "Loading prompt..."}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  User Message (Strict Facts + Moments JSON)
                </h4>
                <pre className="p-4 rounded-xl bg-secondary/40 border border-border/60 text-xs font-mono text-foreground/90 overflow-x-auto max-h-72">
                  {inspectData?.user_message || "Loading user message..."}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="grounding" className="space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Cross-verification check ensuring every number and name in AI response exists in facts:
            </div>

            {catchupResult?.grounding_details ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <span className="text-xs font-semibold text-foreground">Overall Grounding Verification</span>
                  <Badge
                    variant="outline"
                    className={
                      catchupResult.grounded
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                    }
                  >
                    {catchupResult.grounded ? "✓ 100% Grounded" : "⚠ Contains Unverified Entities"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-3">
                    <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                      Verified Numbers
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {catchupResult.grounding_details.verified_numbers.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No numbers in output</span>
                      ) : (
                        catchupResult.grounding_details.verified_numbers.map((num, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={
                              num.found
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs flex items-center gap-1"
                            }
                          >
                            {num.found ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {num.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-3">
                    <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                      Verified Players & Entities
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {catchupResult.grounding_details.verified_names.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No specific names extracted</span>
                      ) : (
                        catchupResult.grounding_details.verified_names.map((name, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={
                              name.found
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs flex items-center gap-1"
                            }
                          >
                            {name.found ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {name.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground p-6 text-center">
                Trigger &quot;I Just Joined&quot; above to inspect live grounding metrics for the latest catch-up response.
              </div>
            )}
          </TabsContent>

          <TabsContent value="telemetry" className="space-y-4">
            {catchupResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Model</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.model}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Tokens (In / Out)</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.prompt_tokens} / {catchupResult.telemetry.completion_tokens}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Latency</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.total_latency_ms} ms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Time to First Token</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.time_to_first_token_ms} ms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Cache Status</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.cached ? "Cache Hit (0ms)" : "Fresh Synthesis"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Generation Mode</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-1">
                    {catchupResult.telemetry.ai ? "OpenAI Async" : "Deterministic Fallback"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground p-6 text-center">
                Trigger &quot;I Just Joined&quot; above to inspect token counts, latencies, and generation telemetry.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
