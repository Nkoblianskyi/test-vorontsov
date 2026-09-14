import type { TemplateConfig } from "@/entities/template/model/schema";
import type { InvoiceDocumentData } from "../model/document";
import { ClassicDocument } from "./classic-document";
import { SwissDocument } from "./swiss-document";

/**
 * One entry point for every sheet in the app: generator preview, template editors,
 * gallery thumbnails and print all render through here. No client code, so it also
 * renders on the server.
 */
export function InvoiceDocument({
  config,
  data,
  fluid,
}: {
  config: TemplateConfig;
  data: InvoiceDocumentData;
  fluid?: boolean;
}) {
  return config.design === "classic" ? (
    <ClassicDocument config={config} data={data} fluid={fluid} />
  ) : (
    <SwissDocument config={config} data={data} />
  );
}
