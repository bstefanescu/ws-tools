import { Package } from "./Package.js";

export function bumpVersions(root: Package, version?: "major" | "minor" | "patch" | string, depMod?: string | undefined) {
    if (depMod === undefined) {
        depMod = "^";
    }
    if (!version) {
        const versions = root.content.managed_versions;
        version = versions.bump;
    }
    if (!version) {
        version = "minor"; // default bump strategy
    }
    const workspaces = root.resolveWorkspaces();
    const versionsMap: Record<string, string> = {};
    for (const ws of workspaces) {
        ws.version = version;
        versionsMap[ws.name] = depMod + ws.version;
    }
    root.version = version;
    for (const ws of [root, ...workspaces]) {
        updateAllDepsVersions(ws, versionsMap);
    }
    for (const ws of workspaces) {
        ws.save();
    }
    root.save();
}

function updateAllDepsVersions(pkg: Package, versionsMap: Record<string, string>) {
    updateDepsVersions(pkg, versionsMap, "dependencies");
    updateDepsVersions(pkg, versionsMap, "devDependencies");
    updateDepsVersions(pkg, versionsMap, "optionalDependencies");
    updateDepsVersions(pkg, versionsMap, "peerDependencies");
    updateDepsVersions(pkg, versionsMap, "bundleDependencies");
}

function updateDepsVersions(pkg: Package, versionsMap: Record<string, string>, depsKey: string) {
    const deps = pkg.content[depsKey];
    if (deps) {
        for (const dep in deps) {
            if (versionsMap[dep]) {
                deps[dep] = versionsMap[dep];
            }
        }
    }
}

export function updateDependencies(root: Package, versionsMap: Record<string, string>) {
    const workspaces = root.resolveWorkspaces();
    for (const ws of [root, ...workspaces]) {
        updateAllDepsVersions(ws, versionsMap);
        ws.save();
    }
}
