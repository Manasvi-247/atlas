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

  // Landing palette — light "warm pastel cartography", dark "terrain".
  const light = {
    colorBgBase: "#ffffff",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#fdf3ee",
    colorBgElevated: "#ffffff",
    colorText: "#2c2440",
    colorTextSecondary: "#6c6383",
    colorTextTertiary: "#9a93ab",
    colorBorder: "#ecd9e0",
    colorBorderSecondary: "#f9e8ee",
    colorPrimary: "#41b07f",
  };
  const darkTokens = {
    colorBgBase: "#161a39",
    colorBgContainer: "#161a39",
    colorBgLayout: "#0c0f24",
    colorBgElevated: "#1c2247",
    colorText: "#ecebfb",
    colorTextSecondary: "#a8a4cf",
    colorTextTertiary: "#6f6b92",
    colorBorder: "#29305a",
    colorBorderSecondary: "#29305a",
    colorPrimary: "#5eead4",
  };
  const modeTokens = dark ? darkTokens : light;

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorInfo: dark ? "#38bdf8" : "#f56a9c",
            colorSuccess: dark ? "#5eead4" : "#41b07f",
            colorWarning: dark ? "#d8b86a" : "#d99a3c",
            colorError: dark ? "#f08fc0" : "#c0455f",
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
