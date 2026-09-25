"use client";

import { Sparkles } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

/**
 * Placeholder for the reference platform's LLM-generated chart summary.
 * `momcare_model` is a classifier only — it never generates text, and is
 * contractually forbidden from calling out to anything else
 * (import-linter: framework-free, see backend CLAUDE.md). No backend
 * capability exists to connect this to, so it stays a clearly-labeled
 * empty shell, same honesty precedent as the Documents tab — never
 * fabricated text about a real patient.
 */
export function AiSummaryCard() {
  return (
    <Card>
      <CardHeader>
        <div className="mc-card-title">
          <Sparkles
            size={15}
            strokeWidth={1.9}
            style={{ verticalAlign: -2, marginRight: 6 }}
            aria-hidden
          />
          AI Summary
        </div>
      </CardHeader>
      <CardBody>
        <p className="mc-alert mc-alert-notice" style={{ margin: 0 }}>
          Not yet connected to an AI summary service. This card is a preview of
          where one would appear.
        </p>
      </CardBody>
    </Card>
  );
}
