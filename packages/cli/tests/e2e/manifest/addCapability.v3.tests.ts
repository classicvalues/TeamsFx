// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @author Huihui Wu <huihuiwu@microsoft.com>
 */

import path from "path";
import { getTestFolder, getUniqueAppName, cleanUp } from "../commonUtils";
import { describe } from "mocha";
import { CliHelper } from "../../commonlib/cliHelper";
import { Capability } from "../../commonlib/constants";
import * as fs from "fs-extra";
import { TeamsAppManifest } from "@microsoft/teamsfx-api";
import { it } from "../../commonlib/it";
import * as chai from "chai";
import { isPreviewFeaturesEnabled } from "@microsoft/teamsfx-core";
import mockedEnv from "mocked-env";
describe("Add capabilities", function () {
  const testFolder = getTestFolder();
  let appName: string;
  let projectPath: string;
  let mockedEnvRestore: () => void;
  beforeEach(() => {
    appName = getUniqueAppName();
    projectPath = path.resolve(testFolder, appName);
    mockedEnvRestore = mockedEnv({
      TEAMSFX_APIV3: "true",
    });
  });

  afterEach(async () => {
    await cleanUp(appName, projectPath, false, false, false);
    mockedEnvRestore();
  });

  it("tab project can add tab capability with correct manifest template", async function () {
    await CliHelper.createProjectWithCapability(appName, testFolder, Capability.Tab);

    if (isPreviewFeaturesEnabled()) {
      await CliHelper.addCapabilityToProject(projectPath, Capability.SSOTab);
    } else {
      await CliHelper.addCapabilityToProject(projectPath, Capability.Tab);
    }

    const manifest: TeamsAppManifest = await fs.readJSON(
      `${projectPath}/templates/appPackage/manifest.template.json`
    );
    chai.assert.equal(manifest.staticTabs!.length, 2);
  });

  it("tab project can add bot capability with correct manifest template", async function () {
    await CliHelper.createProjectWithCapability(appName, testFolder, Capability.Tab);

    await CliHelper.addCapabilityToProject(projectPath, Capability.Bot);

    const manifest: TeamsAppManifest = await fs.readJSON(
      `${projectPath}/templates/appPackage/manifest.template.json`
    );
    chai.assert.equal(manifest.staticTabs!.length, 1);
    chai.assert.equal(manifest.bots!.length, 1);
  });
});
