// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import {
  FxError,
  ok,
  Result,
  TeamsAppManifest,
  err,
  InputsWithProjectPath,
  v3,
  IStaticTab,
} from "@microsoft/teamsfx-api";
import fs from "fs-extra";
import * as path from "path";
import "reflect-metadata";
import { getProjectTemplatesFolderPath } from "../../../common/utils";
import { isV3 } from "../../../core/globalVars";
import { convertManifestTemplateToV2, convertManifestTemplateToV3 } from "../../migrate";
import { AppStudioError } from "../../../plugins/resource/appstudio/errors";
import { AppStudioResultFactory } from "../../../plugins/resource/appstudio/results";
import { cloneDeep } from "lodash";
import {
  BOTS_TPL_EXISTING_APP,
  COMPOSE_EXTENSIONS_TPL_EXISTING_APP,
  CONFIGURABLE_TABS_TPL_EXISTING_APP,
  STATIC_TABS_MAX_ITEMS,
  STATIC_TABS_TPL_EXISTING_APP,
} from "../../../plugins/resource/appstudio/constants";
import {
  BOTS_TPL_FOR_COMMAND_AND_RESPONSE_V3,
  BOTS_TPL_FOR_NOTIFICATION_V3,
  BOTS_TPL_V3,
  COMPOSE_EXTENSIONS_TPL_V3,
  CONFIGURABLE_TABS_TPL_V3,
  STATIC_TABS_TPL_V3,
  WEB_APPLICATION_INFO_V3,
} from "./constants";
import {
  BotScenario,
  CommandAndResponseOptionItem,
  NotificationOptionItem,
} from "../../../plugins/solution/fx-solution/question";
export class ManifestUtils {
  async readAppManifest(projectPath: string): Promise<Result<TeamsAppManifest, FxError>> {
    const filePath = await this.getTeamsAppManifestPath(projectPath);
    if (!(await fs.pathExists(filePath))) {
      return err(
        AppStudioResultFactory.UserError(
          AppStudioError.FileNotFoundError.name,
          AppStudioError.FileNotFoundError.message(filePath)
        )
      );
    }
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    const contentV3 = isV3() ? convertManifestTemplateToV3(content) : content;
    const manifest = JSON.parse(contentV3) as TeamsAppManifest;
    return ok(manifest);
  }

  async writeAppManifest(
    appManifest: TeamsAppManifest,
    projectPath: string
  ): Promise<Result<undefined, FxError>> {
    const filePath = await this.getTeamsAppManifestPath(projectPath);
    const content = JSON.stringify(appManifest, undefined, 4);
    const contentV2 = isV3() ? convertManifestTemplateToV2(content) : content;
    await fs.writeFile(filePath, contentV2);
    return ok(undefined);
  }

  async getTeamsAppManifestPath(projectPath: string): Promise<string> {
    const templateFolder = await getProjectTemplatesFolderPath(projectPath);
    const filePath = path.join(templateFolder, "appPackage", "manifest.template.json");
    return filePath;
  }

  async addCapabilities(
    inputs: InputsWithProjectPath,
    capabilities: v3.ManifestCapability[]
  ): Promise<Result<undefined, FxError>> {
    const appManifestRes = await this.readAppManifest(inputs.projectPath);
    if (appManifestRes.isErr()) return err(appManifestRes.error);
    const appManifest = appManifestRes.value;
    for (const capability of capabilities) {
      const exceedLimit = this._capabilityExceedLimit(appManifest, capability.name);
      if (exceedLimit) {
        return err(
          AppStudioResultFactory.UserError(
            AppStudioError.CapabilityExceedLimitError.name,
            AppStudioError.CapabilityExceedLimitError.message(capability.name)
          )
        );
      }
      let staticTabIndex = appManifest.staticTabs?.length ?? 0;
      switch (capability.name) {
        case "staticTab":
          appManifest.staticTabs = appManifest.staticTabs || [];
          if (capability.snippet) {
            appManifest.staticTabs.push(capability.snippet);
          } else {
            if (capability.existingApp) {
              const template = cloneDeep(STATIC_TABS_TPL_EXISTING_APP[0]);
              template.entityId = "index" + staticTabIndex;
              appManifest.staticTabs.push(template);
            } else {
              const template = cloneDeep(STATIC_TABS_TPL_V3[0]);
              template.entityId = "index" + staticTabIndex;
              appManifest.staticTabs.push(template);
            }
            staticTabIndex++;
          }
          break;
        case "configurableTab":
          appManifest.configurableTabs = appManifest.configurableTabs || [];
          if (capability.snippet) {
            appManifest.configurableTabs.push(capability.snippet);
          } else {
            if (capability.existingApp) {
              appManifest.configurableTabs = appManifest.configurableTabs.concat(
                CONFIGURABLE_TABS_TPL_EXISTING_APP
              );
            } else {
              appManifest.configurableTabs =
                appManifest.configurableTabs.concat(CONFIGURABLE_TABS_TPL_V3);
            }
          }
          break;
        case "Bot":
          appManifest.bots = appManifest.bots || [];
          if (capability.snippet) {
            appManifest.bots.push(capability.snippet);
          } else {
            if (capability.existingApp) {
              appManifest.bots = appManifest.bots.concat(BOTS_TPL_EXISTING_APP);
            } else {
              // import CoreQuestionNames introduces dependency cycle and breaks the whole program
              // inputs[CoreQuestionNames.Features]
              if (inputs.features) {
                const feature = inputs.features;
                if (feature === CommandAndResponseOptionItem.id) {
                  // command and response bot
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_FOR_COMMAND_AND_RESPONSE_V3);
                } else if (feature === NotificationOptionItem.id) {
                  // notification
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_FOR_NOTIFICATION_V3);
                } else {
                  // legacy bot
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_V3);
                }
              } else if (inputs.scenarios) {
                const scenariosRaw = inputs.scenarios;
                const scenarios = Array.isArray(scenariosRaw) ? scenariosRaw : [];
                if (scenarios.includes(BotScenario.CommandAndResponseBot)) {
                  // command and response bot
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_FOR_COMMAND_AND_RESPONSE_V3);
                } else if (scenarios.includes(BotScenario.NotificationBot)) {
                  // notification
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_FOR_NOTIFICATION_V3);
                } else {
                  // legacy bot
                  appManifest.bots = appManifest.bots.concat(BOTS_TPL_V3);
                }
              } else {
                appManifest.bots = appManifest.bots.concat(BOTS_TPL_V3);
              }
            }
          }
          break;
        case "MessageExtension":
          appManifest.composeExtensions = appManifest.composeExtensions || [];
          if (capability.snippet) {
            appManifest.composeExtensions.push(capability.snippet);
          } else {
            if (capability.existingApp) {
              appManifest.composeExtensions = appManifest.composeExtensions.concat(
                COMPOSE_EXTENSIONS_TPL_EXISTING_APP
              );
            } else {
              appManifest.composeExtensions =
                appManifest.composeExtensions.concat(COMPOSE_EXTENSIONS_TPL_V3);
            }
          }
          break;
        case "WebApplicationInfo":
          if (capability.snippet) {
            appManifest.webApplicationInfo = capability.snippet;
          } else {
            appManifest.webApplicationInfo = WEB_APPLICATION_INFO_V3;
          }
          break;
      }
    }
    if (inputs.validDomain && !appManifest.validDomains?.includes(inputs.validDomain)) {
      appManifest.validDomains?.push(inputs.validDomain);
    }
    const writeRes = await this.writeAppManifest(appManifest, inputs.projectPath);
    if (writeRes.isErr()) return err(writeRes.error);
    return ok(undefined);
  }

  async updateCapability(
    projectPath: string,
    capability: v3.ManifestCapability
  ): Promise<Result<undefined, FxError>> {
    const appManifestRes = await this.readAppManifest(projectPath);
    if (appManifestRes.isErr()) return err(appManifestRes.error);
    const manifest = appManifestRes.value;
    switch (capability.name) {
      case "staticTab":
        // find the corresponding static Tab with entity id
        const entityId = (capability.snippet as IStaticTab).entityId;
        const index = manifest.staticTabs?.map((x) => x.entityId).indexOf(entityId);
        if (index !== undefined && index !== -1) {
          manifest.staticTabs![index] = capability.snippet!;
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.StaticTabNotExistError.name,
              AppStudioError.StaticTabNotExistError.message(entityId)
            )
          );
        }
        break;
      case "configurableTab":
        if (manifest.configurableTabs && manifest.configurableTabs.length) {
          manifest.configurableTabs[0] = capability.snippet!;
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "Bot":
        if (manifest.bots && manifest.bots.length > 0) {
          manifest.bots[0] = capability.snippet!;
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "MessageExtension":
        if (manifest.composeExtensions && manifest.composeExtensions.length > 0) {
          manifest.composeExtensions[0] = capability.snippet!;
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "WebApplicationInfo":
        manifest.webApplicationInfo = capability.snippet;
        break;
    }
    const writeRes = await this.writeAppManifest(manifest, projectPath);
    if (writeRes.isErr()) return err(writeRes.error);
    return ok(undefined);
  }

  async deleteCapability(
    projectPath: string,
    capability: v3.ManifestCapability
  ): Promise<Result<undefined, FxError>> {
    const appManifestRes = await this.readAppManifest(projectPath);
    if (appManifestRes.isErr()) return err(appManifestRes.error);
    const manifest = appManifestRes.value;
    switch (capability.name) {
      case "staticTab":
        // find the corresponding static Tab with entity id
        const entityId = (capability.snippet! as IStaticTab).entityId;
        const index = manifest.staticTabs?.map((x) => x.entityId).indexOf(entityId);
        if (index !== undefined && index !== -1) {
          manifest.staticTabs!.slice(index, 1);
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.StaticTabNotExistError.name,
              AppStudioError.StaticTabNotExistError.message(entityId)
            )
          );
        }
        break;
      case "configurableTab":
        if (manifest.configurableTabs && manifest.configurableTabs.length > 0) {
          manifest.configurableTabs = [];
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "Bot":
        if (manifest.bots && manifest.bots.length > 0) {
          manifest.bots = [];
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "MessageExtension":
        if (manifest.composeExtensions && manifest.composeExtensions.length > 0) {
          manifest.composeExtensions = [];
        } else {
          return err(
            AppStudioResultFactory.SystemError(
              AppStudioError.CapabilityNotExistError.name,
              AppStudioError.CapabilityNotExistError.message(capability.name)
            )
          );
        }
        break;
      case "WebApplicationInfo":
        manifest.webApplicationInfo = undefined;
        break;
    }
    const writeRes = await this.writeAppManifest(manifest, projectPath);
    if (writeRes.isErr()) return err(writeRes.error);
    return ok(undefined);
  }
  async capabilityExceedLimit(
    projectPath: string,
    capability: "staticTab" | "configurableTab" | "Bot" | "MessageExtension" | "WebApplicationInfo"
  ): Promise<Result<boolean, FxError>> {
    const manifestRes = await this.readAppManifest(projectPath);
    if (manifestRes.isErr()) return err(manifestRes.error);
    return ok(this._capabilityExceedLimit(manifestRes.value, capability));
  }
  _capabilityExceedLimit(
    manifest: TeamsAppManifest,
    capability: "staticTab" | "configurableTab" | "Bot" | "MessageExtension" | "WebApplicationInfo"
  ): boolean {
    switch (capability) {
      case "staticTab":
        return (
          manifest.staticTabs !== undefined && manifest.staticTabs!.length >= STATIC_TABS_MAX_ITEMS
        );
      case "configurableTab":
        return manifest.configurableTabs !== undefined && manifest.configurableTabs!.length >= 1;
      case "Bot":
        return manifest.bots !== undefined && manifest.bots!.length >= 1;
      case "MessageExtension":
        return manifest.composeExtensions !== undefined && manifest.composeExtensions!.length >= 1;
      case "WebApplicationInfo":
        return false;
    }
    return false;
  }

  /**
   * Only works for manifest.template.json
   * @param projectRoot
   * @returns
   */
  async getCapabilities(projectRoot: string): Promise<Result<string[], FxError>> {
    const manifestRes = await this.readAppManifest(projectRoot);
    if (manifestRes.isErr()) {
      return err(manifestRes.error);
    }
    const capabilities: string[] = [];
    if (manifestRes.value.staticTabs && manifestRes.value.staticTabs!.length > 0) {
      capabilities.push("staticTab");
    }
    if (manifestRes.value.configurableTabs && manifestRes.value.configurableTabs!.length > 0) {
      capabilities.push("configurableTab");
    }
    if (manifestRes.value.bots && manifestRes.value.bots!.length > 0) {
      capabilities.push("Bot");
    }
    if (manifestRes.value.composeExtensions) {
      capabilities.push("MessageExtension");
    }
    return ok(capabilities);
  }
}

export const manifestUtils = new ManifestUtils();
