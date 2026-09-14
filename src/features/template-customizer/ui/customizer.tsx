"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { TemplateConfig } from "../model/schema";
import { TemplateEditorProvider, useTemplateEditor } from "../model/use-template-editor";
import { EditorTopbar } from "./editor-topbar";
import { GeneralSection } from "./general-section";
import { ContentSection } from "./content-section";
import { PreviewStage } from "./preview-stage";

function EditorPanel() {
  const { config } = useTemplateEditor();

  return (
    <div
      data-print="hide"
      className="flex w-full shrink-0 flex-col border-b border-rule-strong bg-panel lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r"
    >
      <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <TabsContent value="general" className="focus-visible:outline-none">
            <GeneralSection />
          </TabsContent>
          <TabsContent value="content" className="focus-visible:outline-none">
            <ContentSection />
          </TabsContent>
        </div>
      </Tabs>

      <div
        className="h-1.5 shrink-0 transition-colors"
        style={{ background: config.brandColor }}
        aria-hidden
      />
    </div>
  );
}

export function Customizer({
  templateId,
  initialConfig,
  initialUpdatedAt,
}: {
  templateId: string;
  initialConfig: TemplateConfig;
  initialUpdatedAt: string;
}) {
  return (
    <TemplateEditorProvider
      templateId={templateId}
      initialConfig={initialConfig}
      initialUpdatedAt={initialUpdatedAt}
    >
      <div data-print="shell" className="flex h-dvh flex-col overflow-hidden">
        <EditorTopbar />
        <div data-print="shell" className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <EditorPanel />
          <PreviewStage />
        </div>
      </div>
    </TemplateEditorProvider>
  );
}
