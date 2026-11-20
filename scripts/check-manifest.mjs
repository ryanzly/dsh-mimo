/**
 * Release sanity check: every manifest claim must match the files on disk and
 * the Host row must reference this package name.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const errors = [];

if (!pkg.name?.startsWith("dsh-")) errors.push("package name must start with dsh-");
if (!pkg.version) errors.push("version missing");
if (pkg.type !== "module") errors.push('type must be "module"');
if (!pkg.exports?.["."]) errors.push('exports["."] missing');
if (!pkg.exports?.["./client"]) errors.push('exports["./client"] missing');
if (!pkg.dsh?.bundle?.patch) errors.push("dsh.bundle.patch missing");
if (pkg.dsh?.client?.platform !== "web") errors.push("dsh.client.platform must be web");

for (const file of ["lib/index.js", "lib/client.js", "cordis.patch.yml", "README.md", "LICENSE"]) {
  if (!existsSync(join(root, file))) errors.push(`missing file: ${file}`);
}

const patch = readFileSync(join(root, "cordis.patch.yml"), "utf-8");
if (!patch.includes(`name: ${pkg.name}`)) errors.push(`cordis.patch.yml must reference ${pkg.name}`);

const host = readFileSync(join(root, "lib/index.js"), "utf-8");
if (!host.includes('export const name = "dsh-mimo"')) errors.push("lib/index.js must export name");

if (errors.length > 0) {
  console.error("check-manifest failed:");
  for (const error of errors) console.error(" -", error);
  process.exit(1);
}
console.log(`check-manifest ok: ${pkg.name}@${pkg.version}`);
