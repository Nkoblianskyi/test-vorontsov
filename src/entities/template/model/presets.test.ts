import { describe, expect, it } from "vitest";
import {
  applyPreset,
  defaultTemplateConfig,
  matchesPreset,
  seedTemplates,
  templatePresets,
} from "./presets";
import { templateConfigSchema, toTemplateConfig } from "./schema";

describe("template presets", () => {
  it("change the look but never the wording or the logo file", () => {
    const custom = {
      ...defaultTemplateConfig,
      name: "Client A",
      logo: {
        ...defaultTemplateConfig.logo,
        src: "data:image/png;base64,AAAA",
        monogram: "CA",
      },
      content: {
        ...defaultTemplateConfig.content,
        documentTitle: "Rechnung",
        terms: "Net 30",
      },
    };

    for (const preset of templatePresets) {
      const result = applyPreset(custom, preset);
      expect(result.name).toBe("Client A");
      expect(result.content).toEqual(custom.content);
      expect(result.logo.src).toBe(custom.logo.src);
      expect(result.logo.monogram).toBe("CA");
      expect(matchesPreset(result, preset)).toBe(true);
    }
  });

  it("are recognised only when every look setting matches", () => {
    const [first] = templatePresets;
    const applied = applyPreset(defaultTemplateConfig, first);
    expect(matchesPreset({ ...applied, typeScale: applied.typeScale + 1 }, first)).toBe(
      false,
    );
  });

  it("produce valid templates, and so do the seeds", () => {
    for (const preset of templatePresets) {
      expect(
        templateConfigSchema.safeParse(applyPreset(defaultTemplateConfig, preset)).success,
      ).toBe(true);
    }
    for (const seed of seedTemplates()) {
      expect(templateConfigSchema.safeParse(toTemplateConfig(seed)).success, seed.id).toBe(
        true,
      );
    }
  });
});

describe("templateConfigSchema payments", () => {
  it("asks for details only for the methods that are switched on", () => {
    const payments = defaultTemplateConfig.payments;
    const withPaypal = {
      ...defaultTemplateConfig,
      payments: { ...payments, paypal: { enabled: true, email: "not-an-email" } },
    };
    const result = templateConfigSchema.safeParse(withPaypal);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "payments.paypal.email",
    ]);

    const off = {
      ...withPaypal,
      payments: { ...payments, paypal: { enabled: false, email: "" } },
    };
    expect(templateConfigSchema.safeParse(off).success).toBe(true);
  });
});
