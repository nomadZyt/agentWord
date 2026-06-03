import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(projectRoot, "assets", "d_stage_manifest.json");
const reviewDir = join(projectRoot, "assets", "review", "d");
const tempDir = join(projectRoot, "tmp", "e1-4-asset-quality");
const reportJsonPath = join(reviewDir, "e1_4_asset_quality_report.json");
const reportMarkdownPath = join(reviewDir, "e1_4_asset_quality_report.md");
const scale64Path = join(reviewDir, "e1_4_scale_64_contact_sheet.png");
const scale96Path = join(reviewDir, "e1_4_scale_96_contact_sheet.png");
const edgeThresholdPixels = 0;

function runMagick(args, options = {}) {
  return execFileSync("magick", args, {
    encoding: options.encoding ?? "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
}

function identify(path) {
  const output = runMagick(["identify", "-format", "%w %h", path]).trim();
  const [width, height] = output.split(/\s+/).map(Number);

  return { width, height };
}

function rel(path) {
  return relative(projectRoot, path);
}

function abs(path) {
  return join(projectRoot, path);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function toCount(value) {
  const parsed = Number.parseFloat(String(value).trim());

  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function countOpaquePixels(imagePath, preCrop, crop) {
  const args = [imagePath];

  if (preCrop) {
    args.push("-crop", preCrop, "+repage");
  }

  if (crop) {
    args.push("-crop", crop, "+repage");
  }

  args.push(
    "-alpha",
    "extract",
    "-threshold",
    "0",
    "-format",
    "%[fx:mean*w*h]",
    "info:",
  );

  return toCount(runMagick(args));
}

function getEdgeStats(imagePath, width, height, preCrop) {
  const top = countOpaquePixels(imagePath, preCrop, `${width}x1+0+0`);
  const bottom = countOpaquePixels(
    imagePath,
    preCrop,
    `${width}x1+0+${height - 1}`,
  );
  const leftHeight = Math.max(0, height - 2);
  const left = leftHeight
    ? countOpaquePixels(imagePath, preCrop, `1x${leftHeight}+0+1`)
    : 0;
  const right = leftHeight
    ? countOpaquePixels(imagePath, preCrop, `1x${leftHeight}+${width - 1}+1`)
    : 0;
  const edgePixels = width * 2 + leftHeight * 2;
  const opaquePixels = top + bottom + left + right;

  return {
    bottom,
    edgePixels,
    edgeOpaquePixels: opaquePixels,
    edgeOpaqueRatio: edgePixels
      ? Number((opaquePixels / edgePixels).toFixed(6))
      : 0,
    left,
    right,
    top,
  };
}

function readManifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function getGroupSummary(items) {
  const summary = new Map();

  items.forEach((item) => {
    const current = summary.get(item.group) ?? {
      failed: 0,
      passed: 0,
      reported: 0,
      total: 0,
    };

    current.total += 1;
    current[item.status] += 1;
    summary.set(item.group, current);
  });

  return Object.fromEntries([...summary.entries()].sort());
}

function checkFullAsset({ file, group, id, expectedSize, edgePolicy }) {
  const imagePath = abs(file);
  const actualSize = existsSync(imagePath) ? identify(imagePath) : null;
  const dimensionPass =
    Boolean(actualSize) &&
    (!expectedSize ||
      (actualSize.width === expectedSize.width &&
        actualSize.height === expectedSize.height));
  const edge =
    actualSize && getEdgeStats(imagePath, actualSize.width, actualSize.height);
  const isRequired = edgePolicy === "required-transparent";
  const edgePass =
    !isRequired ||
    Boolean(edge && edge.edgeOpaquePixels <= edgeThresholdPixels);
  const status = !dimensionPass || !edgePass
    ? "failed"
    : isRequired
      ? "passed"
      : "reported";

  return {
    dimensionPass,
    edge,
    edgePolicy,
    expectedSize,
    file,
    group,
    id,
    kind: "image",
    size: actualSize,
    status,
  };
}

function checkSheet(sheet, group) {
  const imagePath = abs(sheet.source);
  const expectedSize = {
    height: sheet.frameHeight * sheet.rows,
    width: sheet.frameWidth * sheet.columns,
  };
  const actualSize = existsSync(imagePath) ? identify(imagePath) : null;
  const dimensionPass =
    Boolean(actualSize) &&
    actualSize.width === expectedSize.width &&
    actualSize.height === expectedSize.height;
  const frameChecks = [];

  if (!dimensionPass) {
    return {
      actions: sheet.actions.map((action) => action.id),
      dimensionPass,
      edgePolicy: "required-transparent-frame",
      expectedSize,
      file: sheet.source,
      frameChecks,
      frameCount: 0,
      frameHeight: sheet.frameHeight,
      frameWidth: sheet.frameWidth,
      group,
      id: sheet.characterId,
      kind: "spritesheet",
      maxFrameEdgeOpaquePixels: 0,
      size: actualSize,
      status: "failed",
    };
  }

  sheet.actions.forEach((action) => {
    const frames = action.frames ?? sheet.columns;

    for (let frame = 0; frame < frames; frame += 1) {
      const preCrop = `${sheet.frameWidth}x${sheet.frameHeight}+${
        frame * sheet.frameWidth
      }+${action.row * sheet.frameHeight}`;
      const edge = getEdgeStats(
        imagePath,
        sheet.frameWidth,
        sheet.frameHeight,
        preCrop,
      );
      const passed = edge.edgeOpaquePixels <= edgeThresholdPixels;

      frameChecks.push({
        action: action.id,
        edge,
        frame,
        passed,
      });
    }
  });

  const failedFrames = frameChecks.filter((frame) => !frame.passed);
  const status = !dimensionPass || failedFrames.length > 0
    ? "failed"
    : "passed";

  return {
    actions: sheet.actions.map((action) => action.id),
    dimensionPass,
    edgePolicy: "required-transparent-frame",
    expectedSize,
    file: sheet.source,
    frameChecks,
    frameCount: frameChecks.length,
    frameHeight: sheet.frameHeight,
    frameWidth: sheet.frameWidth,
    group,
    id: sheet.characterId,
    kind: "spritesheet",
    maxFrameEdgeOpaquePixels: Math.max(
      0,
      ...frameChecks.map((frame) => frame.edge.edgeOpaquePixels),
    ),
    size: actualSize,
    status,
  };
}

function buildChecks(manifest) {
  const fullAssets = [
    ...manifest.tiles.map((asset) => ({
      edgePolicy: "reported",
      expectedSize: asset.size,
      file: asset.file,
      group: "tiles",
      id: asset.id,
    })),
    ...manifest.props.map((asset) => ({
      edgePolicy: "required-transparent",
      expectedSize: asset.size,
      file: asset.file,
      group: "props",
      id: asset.id,
    })),
    ...manifest.portraits.map((asset) => ({
      edgePolicy: "required-transparent",
      file: asset.file,
      group: "portraits",
      id: asset.characterId,
    })),
  ];

  return [
    ...fullAssets.map(checkFullAsset),
    ...manifest.playableProxyMvpSheets.map((sheet) =>
      checkSheet(sheet, "mvp_proxy_sheets"),
    ),
    ...manifest.advancedActionSheets.map((sheet) =>
      checkSheet(sheet, "advanced_action_sheets"),
    ),
  ];
}

function previewItemsFromManifest(manifest) {
  const fullItems = [
    ...manifest.tiles.map((asset) => ({
      file: asset.file,
      group: "tile",
      id: asset.id,
      label: `tile_${asset.id}`,
      sourceType: "full",
    })),
    ...manifest.props.map((asset) => ({
      file: asset.file,
      group: "prop",
      id: asset.id,
      label: `prop_${asset.id}`,
      sourceType: "full",
    })),
    ...manifest.portraits.map((asset) => ({
      file: asset.file,
      group: "portrait",
      id: asset.characterId,
      label: `portrait_${asset.characterId}`,
      sourceType: "full",
    })),
  ];
  const sheetItems = [
    ...manifest.playableProxyMvpSheets.flatMap((sheet) =>
      sheet.actions.map((action) => ({
        action: action.id,
        file: sheet.source,
        frameHeight: sheet.frameHeight,
        frameWidth: sheet.frameWidth,
        group: "mvp_proxy",
        id: sheet.characterId,
        label: `mvp_${sheet.characterId}_${action.id}`,
        row: action.row,
        sourceType: "frame",
      })),
    ),
    ...manifest.advancedActionSheets.flatMap((sheet) =>
      sheet.actions.map((action) => ({
        action: action.id,
        file: sheet.source,
        frameHeight: sheet.frameHeight,
        frameWidth: sheet.frameWidth,
        group: "advanced",
        id: sheet.characterId,
        label: `adv_${sheet.characterId}_${action.id}`,
        row: action.row,
        sourceType: "frame",
      })),
    ),
  ];

  return [...fullItems, ...sheetItems];
}

function sanitizeFilename(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 80);
}

function createPreviewImage(item, size, index) {
  const outputDir = join(tempDir, `scale-${size}`);
  const output = join(
    outputDir,
    `${String(index + 1).padStart(3, "0")}_${sanitizeFilename(item.label)}.png`,
  );
  const input = abs(item.file);
  const args = [input];

  ensureDir(outputDir);

  if (item.sourceType === "frame") {
    args.push(
      "-crop",
      `${item.frameWidth}x${item.frameHeight}+0+${item.row * item.frameHeight}`,
      "+repage",
    );
  }

  args.push(
    "-resize",
    `${size}x${size}>`,
    "-gravity",
    "center",
    "-background",
    "none",
    "-extent",
    `${size}x${size}`,
    `PNG32:${output}`,
  );

  runMagick(args, { stdio: "inherit" });

  return output;
}

function createContactSheet(items, size, outputPath) {
  const previewPaths = items.map((item, index) =>
    createPreviewImage(item, size, index),
  );

  runMagick(
    [
      "montage",
      ...previewPaths,
      "-tile",
      "9x",
      "-geometry",
      `${size}x${size}+10+10`,
      "-background",
      "#f5efe3",
      `PNG32:${outputPath}`,
    ],
    { stdio: "inherit" },
  );
}

function issueRows(checks) {
  const rows = [];

  checks.forEach((check) => {
    if (check.kind === "image") {
      if (check.status === "failed") {
        rows.push({
          file: check.file,
          group: check.group,
          id: check.id,
          issue: check.dimensionPass
            ? `edge opaque pixels: ${check.edge?.edgeOpaquePixels ?? "n/a"}`
            : "dimension mismatch or missing file",
        });
      }
      return;
    }

    if (!check.dimensionPass) {
      rows.push({
        file: check.file,
        group: check.group,
        id: check.id,
        issue: "dimension mismatch or missing file",
      });
    }

    check.frameChecks
      .filter((frame) => !frame.passed)
      .slice(0, 8)
      .forEach((frame) => {
        rows.push({
          file: check.file,
          group: check.group,
          id: check.id,
          issue: `${frame.action} frame ${frame.frame}: edge opaque pixels ${frame.edge.edgeOpaquePixels}`,
        });
      });

    if (check.frameChecks.filter((frame) => !frame.passed).length > 8) {
      rows.push({
        file: check.file,
        group: check.group,
        id: check.id,
        issue: "more frame edge issues omitted from markdown; see JSON",
      });
    }
  });

  return rows;
}

function writeMarkdownReport(report) {
  const summaryRows = Object.entries(report.summary.byGroup)
    .map(
      ([group, summary]) =>
        `| ${group} | ${summary.total} | ${summary.passed} | ${summary.reported} | ${summary.failed} |`,
    )
    .join("\n");
  const issues = issueRows(report.checks);
  const issueTable = issues.length
    ? issues
        .map(
          (issue) =>
            `| ${issue.group} | ${issue.id} | ${issue.issue} | ${issue.file} |`,
        )
        .join("\n")
    : "| none | none | none | none |";

  const markdown = `# E1.4 D Asset Quality Report

Generated at: ${report.generatedAt}

## Summary

- Checked assets: ${report.summary.total}
- Passed: ${report.summary.passed}
- Reported only: ${report.summary.reported}
- Failed: ${report.summary.failed}
- Edge rule: non-tile transparent assets and every spritesheet frame must have ${edgeThresholdPixels} opaque pixels on the outer 1px edge.

| Group | Total | Passed | Reported | Failed |
| --- | ---: | ---: | ---: | ---: |
${summaryRows}

## Scale Preview Outputs

- 64px contact sheet: \`${rel(scale64Path)}\`
- 96px contact sheet: \`${rel(scale96Path)}\`
- Preview item count: ${report.previewItemCount}. Order and labels are stored in \`${rel(reportJsonPath)}\` under \`previewItems\`.

## Edge Issues

| Group | Asset | Issue | File |
| --- | --- | --- | --- |
${issueTable}

## Notes

- Tiles are reported instead of failed because some tile assets are allowed to fill their full 128px frame.
- Spritesheets are checked per action frame, not only around the outer sheet boundary.
- Re-run with \`pnpm asset:quality\`.
`;

  writeFileSync(reportMarkdownPath, markdown);
}

function main() {
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }

  ensureDir(reviewDir);
  rmSync(tempDir, { force: true, recursive: true });
  ensureDir(tempDir);

  const manifest = readManifest();
  const checks = buildChecks(manifest);
  const summary = {
    byGroup: getGroupSummary(checks),
    failed: checks.filter((check) => check.status === "failed").length,
    passed: checks.filter((check) => check.status === "passed").length,
    reported: checks.filter((check) => check.status === "reported").length,
    total: checks.length,
  };
  const previewItems = previewItemsFromManifest(manifest);

  createContactSheet(previewItems, 64, scale64Path);
  createContactSheet(previewItems, 96, scale96Path);

  const report = {
    checkedAt: new Date().toISOString(),
    edgeThresholdPixels,
    generatedAt: "2026-06-01",
    outputs: {
      markdown: rel(reportMarkdownPath),
      reportJson: rel(reportJsonPath),
      scale64ContactSheet: rel(scale64Path),
      scale96ContactSheet: rel(scale96Path),
    },
    previewItemCount: previewItems.length,
    previewItems: previewItems.map((item, index) => ({
      action: item.action,
      file: item.file,
      group: item.group,
      id: item.id,
      index,
      label: item.label,
      sourceType: item.sourceType,
    })),
    checks,
    summary,
  };

  writeJson(reportJsonPath, report);
  writeMarkdownReport(report);
  rmSync(tempDir, { force: true, recursive: true });

  console.log(
    `D asset quality report: ${summary.passed} passed, ${summary.reported} reported, ${summary.failed} failed.`,
  );
  console.log(`Wrote ${rel(reportJsonPath)}`);
  console.log(`Wrote ${rel(reportMarkdownPath)}`);
  console.log(`Wrote ${rel(scale64Path)}`);
  console.log(`Wrote ${rel(scale96Path)}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main();
