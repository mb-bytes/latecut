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
    <Card className="w-full bg-card border border-orange-200/80 shadow-md hover:shadow-lg transition-shadow rounded-2xl overflow-hidden mt-6">
      <div className="p-4 sm:p-6 border-b border-orange-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-orange-600" />
            How the AI Works
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full auditability: deterministic facts, weighted moment detection, prompt construction, and grounding checks.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-orange-50 text-orange-700 border-orange-200 font-bold">
          Transparency & Safety
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-stone-100 p-1 rounded-xl mb-6 border border-stone-200/80">
            <TabsTrigger value="facts" className="text-xs flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg">
              <Database className="h-3.5 w-3.5" /> Facts
            </TabsTrigger>
            <TabsTrigger value="moments" className="text-xs flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg">
              <Key className="h-3.5 w-3.5" /> Key Moments
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg">
              <Info className="h-3.5 w-3.5" /> Prompt
            </TabsTrigger>
            <TabsTrigger value="grounding" className="text-xs flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg">
              <ShieldCheck className="h-3.5 w-3.5" /> Grounding
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="text-xs flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg">
              <Activity className="h-3.5 w-3.5" /> Telemetry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facts" className="space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Structured facts extracted deterministically from live delivery events:
            </div>
            {inspectData?.facts ? (
              <pre className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-mono text-stone-800 overflow-x-auto max-h-96">
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
                  <div key={idx} className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-bold bg-orange-50 text-orange-700 border-orange-200">
                          Over {m.over_ball}
                        </Badge>
                        <span className="font-bold text-foreground text-sm">{m.description}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs bg-stone-100 text-stone-700 border-stone-300 font-bold">
                        Weight: {m.weight}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                      <span>Reason: {m.reason}</span>
                    </div>
                    <Progress value={Math.min(100, (m.weight / 5) * 100)} className="h-2 bg-orange-100" />
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  System Prompt (Constraint & Hallucination Guard)
                </h4>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 leading-relaxed">
                  {inspectData?.system_prompt || "Loading prompt..."}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  User Message (Strict Facts + Moments JSON)
                </h4>
                <pre className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 overflow-x-auto max-h-72">
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
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-xs font-bold text-foreground">Overall Grounding Verification</span>
                  <Badge
                    variant="outline"
                    className={
                      catchupResult.grounded
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold"
                        : "bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold"
                    }
                  >
                    {catchupResult.grounded ? "✓ 100% Grounded" : "⚠ Contains Unverified Entities"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/80 space-y-3">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground">
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
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold flex items-center gap-1"
                                : "bg-rose-50 text-rose-800 border-rose-300 text-xs font-bold flex items-center gap-1"
                            }
                          >
                            {num.found ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
                            {num.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/80 space-y-3">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground">
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
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold flex items-center gap-1"
                                : "bg-rose-50 text-rose-800 border-rose-300 text-xs font-bold flex items-center gap-1"
                            }
                          >
                            {name.found ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
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
                Trigger &quot;LateCut&quot; above to inspect live grounding metrics for the latest catch-up response.
              </div>
            )}
          </TabsContent>

          <TabsContent value="telemetry" className="space-y-4">
            {catchupResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Model</div>
                  <div className="text-sm font-black font-mono text-foreground mt-1">
                    {catchupResult.telemetry.model}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Tokens (In / Out)</div>
                  <div className="text-sm font-black font-mono text-foreground mt-1">
                    {catchupResult.telemetry.prompt_tokens} / {catchupResult.telemetry.completion_tokens}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Latency</div>
                  <div className="text-sm font-black font-mono text-foreground mt-1">
                    {catchupResult.telemetry.total_latency_ms} ms
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Time to First Token</div>
                  <div className="text-sm font-black font-mono text-foreground mt-1">
                    {catchupResult.telemetry.time_to_first_token_ms} ms
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Cache Status</div>
                  <div className="text-sm font-black font-mono text-orange-600 mt-1">
                    {catchupResult.telemetry.cached ? "Cache Hit (0ms)" : "Fresh Synthesis"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/70">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Generation Mode</div>
                  <div className="text-sm font-black font-mono text-foreground mt-1">
                    {catchupResult.telemetry.ai ? "OpenAI Async" : "Deterministic Fallback"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground p-6 text-center">
                Trigger &quot;LateCut&quot; above to inspect token counts, latencies, and generation telemetry.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
