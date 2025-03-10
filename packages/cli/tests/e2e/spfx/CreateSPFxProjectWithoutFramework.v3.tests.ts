// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @author Huihui Wu <huihuiwu@microsoft.com>
 */

import * as fs from "fs-extra";
import * as path from "path";
import { expect } from "chai";
import { cleanUpLocalProject, execAsync, getTestFolder, getUniqueAppName } from "../commonUtils";
import mockedEnv from "mocked-env";
describe("Start a new project", function () {
  const testFolder = getTestFolder();
  const appName = getUniqueAppName();
  const projectPath = path.resolve(testFolder, appName);
  let mockedEnvRestore: () => void;
  before(async () => {
    mockedEnvRestore = mockedEnv({
      TEAMSFX_APIV3: "true",
    });
  });
  it("Create SPFx project without framework", async function () {
    const command = `teamsfx new --interactive false --app-name ${appName} --capabilities tab-spfx --spfx-framework-type none --spfx-webpart-name helloworld --programming-language typescript`;
    const result = await execAsync(command, {
      cwd: testFolder,
      env: process.env,
      timeout: 0,
    });

    // check specified files
    const files: string[] = [
      "config/config.json",
      "config/deploy-azure-storage.json",
      "config/package-solution.json",
      "config/serve.json",
      "config/write-manifests.json",
      "src/webparts/helloworld/HelloworldWebPart.manifest.json",
      "src/webparts/helloworld/HelloworldWebPart.module.scss",
      "src/webparts/helloworld/HelloworldWebPart.ts",
      "src/webparts/helloworld/loc/en-us.js",
      "src/webparts/helloworld/loc/mystrings.d.ts",
      "src/webparts/helloworld/assets/welcome-dark.png",
      "src/webparts/helloworld/assets/welcome-light.png",
      "src/index.ts",
      ".gitignore",
      ".npmignore",
      ".yo-rc.json",
      "gulpfile.js",
      "package.json",
      "README.md",
      "tsconfig.json",
    ];
    for (const file of files) {
      const filePath = path.join(testFolder, appName, `SPFx`, file);
      expect(fs.existsSync(filePath), `${filePath} must exist.`).to.eq(true);
    }
    expect(result.stderr).to.eq("");
  });

  after(async () => {
    // clean up
    await cleanUpLocalProject(projectPath);
    mockedEnvRestore();
  });
});
