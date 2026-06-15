"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "@/lib/useTheme";

/**
 * Ant Design, themed to the Atlas "field-notebook" palette so antd components
 * blend with the custom Tailwind surfaces instead of shipping default blue.
 * AntdRegistry handles SSR style extraction for the App Router; the v5 React-19
 * patch keeps message/notification/Modal static methods working on React 19.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const dark = useTheme((s) => s.dark);
  const sync = useTheme((s) => s.sync);

  // Mirror the pre-paint <html> class so antd's algorithm matches on first load.
  useEffect(() => {
    sync();
  }, [sync]);

  const light = {
    colorBgBase: "#FBF8F1",
    colorBgContainer: "#FBF8F1",
    colorBgLayout: "#F6F1E7",
    colorBgElevated: "#FBF8F1",
    colorText: "#211F1A",
    colorTextSecondary: "#5A554A",
    colorTextTertiary: "#8C8576",
    colorBorder: "#E2D8C4",
    colorBorderSecondary: "#EFE7D6",
    colorPrimary: "#3D7A6B",
  };
  const darkTokens = {
    colorBgBase: "#161a39",
    colorBgContainer: "#161a39",
    colorBgLayout: "#0c0f24",
    colorBgElevated: "#1c2247",
    colorText: "#ecebfb",
    colorTextSecondary: "#a8a4cf",
    colorTextTertiary: "#7b779e",
    colorBorder: "#29305a",
    colorBorderSecondary: "#29305a",
    colorPrimary: "#5ec9a7",
  };
  const modeTokens = dark ? darkTokens : light;

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorInfo: modeTokens.colorPrimary,
            colorSuccess: dark ? "#5ec9a7" : "#3D7A6B",
            colorWarning: dark ? "#d8b86a" : "#C9A34E",
            colorError: dark ? "#e8859a" : "#B5556A",
            ...modeTokens,
            borderRadius: 10,
            borderRadiusLG: 12,
            fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
            controlHeight: 38,
          },
          components: {
            Card: { paddingLG: 22, boxShadowTertiary: "0 14px 30px -22px rgba(60,50,30,.45)" },
            Steps: {
              colorPrimary: "#3D7A6B",
              navArrowColor: "#cdbfa3",
              descriptionMaxWidth: 520,
            },
            Button: { primaryShadow: "0 10px 24px -12px rgba(44,90,79,0.7)", fontWeight: 600 },
            Tag: { defaultBg: "#EFE7D6", defaultColor: "#5A554A" },
            Segmented: { itemSelectedBg: "#3D7A6B", itemSelectedColor: "#ffffff" },
            Collapse: { headerBg: "transparent" },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
