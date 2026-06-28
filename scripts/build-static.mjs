import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const apiDir = "src/app/api";
const disabledApiDir = "src/.api-static-disabled";

let movedApi = false;
let exitCode = 0;
const patchedFiles = [];

function patchDynamicParamsForStaticExport() {
  const files = [
    {
      file: "src/app/(app)/chat/[id]/page.tsx",
      params: '[{ id: "demo-chat-rizky" }, { id: "demo-chat-budi" }, { id: "demo-chat-farhan" }]',
    },
    {
      file: "src/app/(app)/orders/[id]/page.tsx",
      params: '[{ id: "demo-order" }]',
    },
    {
      file: "src/app/(app)/posts/[id]/page.tsx",
      params: '[{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }]',
    },
    {
      file: "src/app/(app)/posts/[id]/report/page.tsx",
      params: '[{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }]',
    },
    {
      file: "src/app/(app)/profile/[id]/page.tsx",
      params: '[{ id: "demo-ayu" }, { id: "demo-rizky" }, { id: "demo-farhan" }, { id: "demo-dewi" }, { id: "demo-budi" }, { id: "demo-sari" }]',
    },
    {
      file: "src/app/(app)/profile/[id]/report/page.tsx",
      params: '[{ id: "demo-ayu" }, { id: "demo-rizky" }, { id: "demo-farhan" }, { id: "demo-dewi" }, { id: "demo-budi" }, { id: "demo-sari" }]',
    },
  ];

  for (const { file, params } of files) {
    if (!existsSync(file)) continue;
    const original = readFileSync(file, "utf8");
    let patched = original.replace("export const dynamicParams = true;", "export const dynamicParams = false;");
    if (!patched.includes("generateStaticParams")) {
      patched = patched.replace(
        "export default function Page()",
        `export function generateStaticParams() {\n  return ${params};\n}\n\nexport default function Page()`,
      );
    }
    if (patched !== original) {
      writeFileSync(file, patched);
      patchedFiles.push([file, original]);
    }
  }
}

try {
  patchDynamicParamsForStaticExport();

  if (existsSync(apiDir)) {
    if (existsSync(disabledApiDir)) {
      throw new Error(`${disabledApiDir} already exists. Remove it before running the static build.`);
    }
    renameSync(apiDir, disabledApiDir);
    movedApi = true;
  }

  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(npxCommand, ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NEXT_OUTPUT_EXPORT: "true",
    },
  });

  if (result.status !== 0) exitCode = result.status ?? 1;
} finally {
  if (movedApi) renameSync(disabledApiDir, apiDir);
  for (const [file, original] of patchedFiles.reverse()) writeFileSync(file, original);
}

process.exit(exitCode);
