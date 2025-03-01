// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @author Ivan Jobs <ruhe@microsoft.com>
 */

import path from "path";
import "mocha";
import * as chai from "chai";
import { getTestFolder, getUniqueAppName, cleanUp } from "../commonUtils";
import { CliHelper } from "../../commonlib/cliHelper";
import { Capability } from "../../commonlib/constants";
import { getTemplatesFolder } from "@microsoft/teamsfx-core";
import Mustache from "mustache";
import { CICDProviderFactory } from "@microsoft/teamsfx-core/src/plugins/resource/cicd/providers/factory";
import { ProviderKind } from "@microsoft/teamsfx-core/src/plugins/resource/cicd/providers/enums";
import * as fs from "fs-extra";
import mockedEnv from "mocked-env";
describe("Verify generated templates & readme V3", function () {
  const testFolder = getTestFolder();
  const appName = getUniqueAppName();
  const projectPath = path.resolve(testFolder, appName);
  let mockedEnvRestore: () => void;
  before(async () => {
    mockedEnvRestore = mockedEnv({
      TEAMSFX_APIV3: "true",
    });
  });
  after(async () => {
    await cleanUp(appName, projectPath, false, false, false);
    mockedEnvRestore();
  });

  it(`Verify generated templates & readme`, async function () {
    await CliHelper.createProjectWithCapability(appName, testFolder, Capability.Bot);

    // Add CICD Workflows.
    for (const provider of ["github", "azdo", "jenkins"]) {
      await CliHelper.addCICDWorkflows(
        projectPath,
        ` --env dev --provider ${provider} --template ci cd provision publish --interactive false`
      );
    }

    const providerPromises = ["github", "azdo", "jenkins"].map(async (providerName) => {
      const provider = CICDProviderFactory.create(providerName as ProviderKind);
      const localTemplatePath = path.join(
        getTemplatesFolder(),
        "plugins",
        "resource",
        "cicd",
        providerName
      );
      const templatePromises = ["ci", "cd", "provision", "publish"].map(async (template) => {
        const replacements = {
          env_name: "dev",
          build_script: "cd bot; npm ci; cd -;",
          hosting_type_contains_spfx: false,
          hosting_type_contains_azure: true,
          cloud_resources_contains_sql: false,
        };
        const sourceTemplatePath = path.join(
          localTemplatePath,
          provider.sourceTemplateName!(template)
        );
        const renderedContent = Mustache.render(
          fs.readFileSync(sourceTemplatePath).toString(),
          replacements
        );

        return [
          (
            await fs.readFile(
              path.join(
                projectPath,
                provider.scaffoldTo,
                provider.targetTemplateName!(template, "dev")
              )
            )
          ).toString(),
          renderedContent,
        ];
      });

      // Add promises for README.
      templatePromises.push(
        Promise.resolve([
          (await fs.readFile(path.join(projectPath, provider.scaffoldTo, "README.md"))).toString(),
          (await fs.readFile(path.join(localTemplatePath, "README.md"))).toString(),
        ])
      );

      return templatePromises;
    });

    // Assert
    for (const contentsToBeComparedPromises of await Promise.all(providerPromises)) {
      for (const contents of await Promise.all(contentsToBeComparedPromises)) {
        chai.assert(contents[0] == contents[1]);
      }
    }
  });
});
