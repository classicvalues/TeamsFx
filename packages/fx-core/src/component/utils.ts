// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
"use strict";

import {
  Bicep,
  CallServiceEffect,
  CloudResource,
  Component,
  ConfigurationBicep,
  ContextV3,
  err,
  FileEffect,
  FxError,
  Inputs,
  InputsWithProjectPath,
  Json,
  ok,
  Platform,
  ProjectSettingsV3,
  ProvisionBicep,
  Result,
  UserInteraction,
  v3,
} from "@microsoft/teamsfx-api";
import fs from "fs-extra";
import { assign, cloneDeep } from "lodash";
import os from "os";
import * as path from "path";
import { Container } from "typedi";
import { format } from "util";
import * as uuid from "uuid";
import { getLocalizedString } from "../common/localizeUtils";
import { getProjectSettingsVersion } from "../common/projectSettingsHelper";
import { convertToAlphanumericOnly, getProjectTemplatesFolderPath } from "../common/utils";
import { LocalCrypto } from "../core/crypto";
import { environmentManager } from "../core/environment";
import { TOOLS } from "../core/globalVars";
import { BuiltInFeaturePluginNames } from "../plugins/solution/fx-solution/v3/constants";
import { ComponentNames, Scenarios, scenarioToComponent } from "./constants";
import { DefaultManifestProvider } from "./resource/appManifest/manifestProvider";
import { getComponent, getComponentByScenario } from "./workflow";

export async function persistProvisionBicep(
  projectPath: string,
  provisionBicep: ProvisionBicep
): Promise<Result<any, FxError>> {
  const templateRoot = await getProjectTemplatesFolderPath(projectPath);
  const templateFolder = path.join(templateRoot, "azure");
  if (provisionBicep.Modules) {
    for (const module of Object.keys(provisionBicep.Modules)) {
      const value = provisionBicep.Modules[module];
      if (value) {
        const filePath = path.join(templateFolder, "provision", `${module}.bicep`);
        await fs.appendFile(filePath, value.replace(/\r?\n/g, os.EOL).trim());
      }
    }
  }
  if (provisionBicep.Orchestration) {
    const filePath = path.join(templateFolder, "provision.bicep");
    await fs.appendFile(
      filePath,
      os.EOL + os.EOL + provisionBicep.Orchestration.trim().replace(/\r?\n/g, os.EOL)
    );
  }
  return ok(undefined);
}

export async function persistProvisionBicepPlans(
  projectPath: string,
  provisionBicep: ProvisionBicep
): Promise<string[]> {
  const plans: string[] = [];
  const templateRoot = await getProjectTemplatesFolderPath(projectPath);
  const templateFolder = path.join(templateRoot, "azure");
  if (provisionBicep.Modules) {
    for (const module of Object.keys(provisionBicep.Modules)) {
      const value = provisionBicep.Modules[module];
      if (value) {
        const filePath = path.join(templateFolder, "provision", `${module}.bicep`);
        const effect = appendFileEffect(filePath, `provision module bicep for ${module}`);
        const plan = fileEffectPlanString(effect);
        if (plan) {
          plans.push(plan);
        }
      }
    }
  }
  if (provisionBicep.Orchestration) {
    const filePath = path.join(templateFolder, "provision.bicep");
    const effect = appendFileEffect(filePath, "provision orchestration bicep");
    const plan = fileEffectPlanString(effect);
    if (plan) {
      plans.push(plan);
    }
  }
  return plans;
}

export async function persistConfigBicep(
  projectPath: string,
  configBicep: ConfigurationBicep
): Promise<Result<any, FxError>> {
  const templateRoot = await getProjectTemplatesFolderPath(projectPath);
  const templateFolder = path.join(templateRoot, "azure");
  if (configBicep.Modules) {
    for (const module of Object.keys(configBicep.Modules)) {
      const value = configBicep.Modules[module];
      if (value) {
        const filePath = path.join(templateFolder, "teamsFx", `${module}.bicep`);
        fs.writeFileSync(filePath, value.replace(/\r?\n/g, os.EOL).trim(), { encoding: "utf-8" });
      }
    }
  }
  if (configBicep.Orchestration) {
    const filePath = path.join(templateFolder, "config.bicep");
    fs.appendFileSync(
      filePath,
      os.EOL + os.EOL + configBicep.Orchestration.trim().replace(/\r?\n/g, os.EOL)
    );
  }
  return ok(undefined);
}

export async function persistConfigBicepPlans(
  projectPath: string,
  provisionBicep: ProvisionBicep
): Promise<string[]> {
  const plans: string[] = [];
  const templateRoot = await getProjectTemplatesFolderPath(projectPath);
  const templateFolder = path.join(templateRoot, "azure");
  if (provisionBicep.Modules) {
    for (const module of Object.keys(provisionBicep.Modules)) {
      const value = provisionBicep.Modules[module];
      if (value) {
        const filePath = path.join(templateFolder, "teamsFx", `${module}.bicep`);
        const effect = createFileEffect(
          filePath,
          "replace",
          `configuration module bicep for ${module}`
        );
        const plan = fileEffectPlanString(effect);
        if (plan) {
          plans.push(plan);
        }
      }
    }
  }
  if (provisionBicep.Orchestration) {
    const filePath = path.join(templateFolder, "provision.bicep");
    const effect = appendFileEffect(filePath, "configuration orchestration bicep");
    const plan = fileEffectPlanString(effect);
    if (plan) {
      plans.push(plan);
    }
  }
  return plans;
}

export function persistParamsBicepPlans(
  projectPath: string,
  params: Record<string, string>
): string[] {
  const plans: string[] = [];
  if (Object.keys(params).length === 0) return [];
  const parameterEnvFolderPath = path.join(projectPath, ".fx", "configs");
  fs.ensureDirSync(parameterEnvFolderPath);
  const configFiles = fs.readdirSync(parameterEnvFolderPath);
  const remoteEnvNames = configFiles
    .map((file) => {
      const match = /^config\.(?<envName>[\w\d-_]+)\.json$/i.exec(file);
      if (match != null && match.groups != null) {
        const envName = match.groups.envName;
        if (envName !== "local") return envName;
      }
      return null;
    })
    .filter((env) => env !== null);
  for (const env of remoteEnvNames) {
    const parameterFileName = `azure.parameters.${env}.json`;
    const parameterEnvFilePath = path.join(parameterEnvFolderPath, parameterFileName);
    const effect = createFileEffect(parameterEnvFilePath, "replace");
    const plan = fileEffectPlanString(effect);
    if (plan) plans.push(plan);
  }
  return plans;
}

export async function readParametersJson(
  projectPath: string,
  env: string
): Promise<Json | undefined> {
  const parameterEnvFolderPath = path.join(projectPath, ".fx", "configs");
  const parameterFileName = `azure.parameters.${env}.json`;
  const parameterEnvFilePath = path.join(parameterEnvFolderPath, parameterFileName);
  if (await fs.pathExists(parameterEnvFilePath)) {
    const json = await fs.readJson(parameterEnvFilePath);
    return json;
  }
  return undefined;
}

export async function writeParametersJson(
  projectPath: string,
  env: string,
  json: Json
): Promise<void> {
  const parameterEnvFolderPath = path.join(projectPath, ".fx", "configs");
  const parameterFileName = `azure.parameters.${env}.json`;
  const parameterEnvFilePath = path.join(parameterEnvFolderPath, parameterFileName);
  let parameterFileContent = JSON.stringify(json, undefined, 2);
  parameterFileContent = parameterFileContent.replace(/\r?\n/g, os.EOL);
  await fs.writeFile(parameterEnvFilePath, parameterFileContent);
}

export async function persistParams(
  projectPath: string,
  appName: string,
  params?: Record<string, string>
): Promise<Result<any, FxError>> {
  const envListResult = await environmentManager.listRemoteEnvConfigs(projectPath);
  if (envListResult.isErr()) {
    return err(envListResult.error);
  }
  const parameterEnvFolderPath = path.join(projectPath, ".fx", "configs");
  await fs.ensureDir(parameterEnvFolderPath);
  for (const env of envListResult.value) {
    let json = await readParametersJson(projectPath, env);
    if (json) {
      json.parameters = json.parameters || {};
      json.parameters.provisionParameters = json.parameters.provisionParameters || {};
      json.parameters.provisionParameters.value = json.parameters.provisionParameters.value || {};
      const existingParams = json.parameters.provisionParameters.value;
      Object.assign(existingParams, params);
      if (!existingParams.resourceBaseName) {
        existingParams.resourceBaseName = generateResourceBaseName(appName, "");
      }
      json.parameters.provisionParameters.value = existingParams;
    } else {
      params = params || {};
      if (!params.resourceBaseName) {
        params.resourceBaseName = generateResourceBaseName(appName, "");
      }
      json = {
        $schema:
          "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
        contentVersion: "1.0.0.0",
        parameters: { provisionParameters: { value: params } },
      };
    }
    await writeParametersJson(projectPath, env, json);
  }
  return ok(undefined);
}

export class BicepUtils {
  async persistBiceps(
    projectPath: string,
    appName: string,
    biceps: Bicep[]
  ): Promise<Result<any, FxError>> {
    for (const bicep of biceps) {
      const res = await persistBicep(projectPath, appName, bicep);
      if (res.isErr()) return res;
    }
    return ok(undefined);
  }
}

export const bicepUtils = new BicepUtils();

export async function persistBicep(
  projectPath: string,
  appName: string,
  bicep: Bicep
): Promise<Result<any, FxError>> {
  if (bicep.Provision) {
    const res = await persistProvisionBicep(projectPath, bicep.Provision);
    if (res.isErr()) return err(res.error);
  }
  if (bicep.Configuration) {
    const res = await persistConfigBicep(projectPath, bicep.Configuration);
    if (res.isErr()) return err(res.error);
  }
  // if (bicep.Parameters) {
  const res = await persistParams(projectPath, appName, bicep.Parameters);
  if (res.isErr()) return err(res.error);
  // }
  return ok(undefined);
}

export async function persistBicepPlans(projectPath: string, bicep: Bicep): Promise<string[]> {
  let plans: string[] = [];
  if (bicep.Provision) {
    const res = await persistProvisionBicepPlans(projectPath, bicep.Provision);
    plans = plans.concat(res);
  }
  if (bicep.Configuration) {
    const res = await persistConfigBicepPlans(projectPath, bicep.Configuration);
    plans = plans.concat(res);
  }
  if (bicep.Parameters) {
    const res = persistParamsBicepPlans(projectPath, bicep.Parameters);
    plans = plans.concat(res);
  }
  return plans.filter(Boolean);
}

export function fileEffectPlanStrings(fileEffect: FileEffect): string[] {
  const plans = [];
  if (typeof fileEffect.filePath === "string") {
    plans.push(fileEffectPlanString(fileEffect));
  } else {
    for (const file of fileEffect.filePath) {
      plans.push(
        fileEffectPlanString({
          ...fileEffect,
          filePath: file,
          remarks: undefined,
        })
      );
    }
  }
  return plans.filter((p) => p !== undefined) as string[];
}

export function serviceEffectPlanString(serviceEffect: CallServiceEffect): string {
  return `call cloud service: ${serviceEffect.name} (${serviceEffect.remarks})`;
}

export function createFilesEffects(
  files: string[],
  operateIfExists: "replace" | "skip" = "replace",
  remarks?: string
): FileEffect[] {
  const effects: FileEffect[] = [];
  for (const file of files) {
    if (fs.pathExistsSync(file)) {
      if (operateIfExists === "replace") {
        effects.push({
          type: "file",
          filePath: file,
          operate: "replace",
          remarks: remarks,
        });
      } else {
        effects.push({
          type: "file",
          filePath: file,
          operate: "skipCreate",
          remarks: remarks,
        });
      }
    } else {
      effects.push({
        type: "file",
        filePath: file,
        operate: "create",
        remarks: remarks,
      });
    }
  }
  return effects;
}

export function createFileEffect(
  file: string,
  operateIfExists: "replace" | "skip" | "append" = "replace",
  remarks?: string
): FileEffect {
  if (fs.pathExistsSync(file)) {
    if (operateIfExists === "replace") {
      return {
        type: "file",
        filePath: file,
        operate: "replace",
        remarks: remarks,
      };
    } else if (operateIfExists === "skip") {
      return {
        type: "file",
        filePath: file,
        operate: "skipCreate",
        remarks: remarks,
      };
    } else {
      return {
        type: "file",
        filePath: file,
        operate: "append",
        remarks: remarks,
      };
    }
  } else {
    return {
      type: "file",
      filePath: file,
      operate: "create",
      remarks: remarks,
    };
  }
}

export function appendFileEffect(file: string, remarks?: string): FileEffect {
  if (fs.pathExistsSync(file)) {
    return {
      type: "file",
      filePath: file,
      operate: "append",
      remarks: remarks,
    };
  } else {
    return {
      type: "file",
      filePath: file,
      operate: "create",
      remarks: remarks,
    };
  }
}

export function fileEffectPlanString(effect: FileEffect): string | undefined {
  if (effect.operate.startsWith("skip")) return undefined;
  return effect.remarks
    ? `${effect.operate} file: '${effect.filePath}' (${effect.remarks})`
    : `${effect.operate} file: '${effect.filePath}'`;
}

export function newProjectSettingsV3(): ProjectSettingsV3 {
  const projectSettings: ProjectSettingsV3 = {
    appName: "test",
    projectId: uuid.v4(),
    version: getProjectSettingsVersion(),
    components: [],
  };
  return projectSettings;
}

export function createContextV3(projectSettings?: ProjectSettingsV3): ContextV3 {
  if (!projectSettings) projectSettings = newProjectSettingsV3();
  const context: ContextV3 = {
    userInteraction: TOOLS.ui,
    logProvider: TOOLS.logProvider,
    telemetryReporter: TOOLS.telemetryReporter!,
    cryptoProvider: new LocalCrypto(projectSettings?.projectId),
    permissionRequestProvider: TOOLS.permissionRequest,
    projectSetting: projectSettings,
    manifestProvider: new DefaultManifestProvider(),
    tokenProvider: TOOLS.tokenProvider,
  };
  return context;
}

export function normalizeName(appName: string): string {
  const normalizedAppName = appName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return normalizedAppName;
}

export function generateResourceBaseName(appName: string, envName: string): string {
  const maxAppNameLength = 10;
  const maxEnvNameLength = 4;
  const normalizedAppName = appName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const normalizedEnvName = envName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return (
    normalizedAppName.substr(0, maxAppNameLength) +
    normalizedEnvName.substr(0, maxEnvNameLength) +
    uuid.v4().substr(0, 6)
  );
}

export function isInComponentConnection(component: Component, item: string): boolean {
  if (component.connections?.includes(item)) {
    return true;
  }
  return false;
}

export function getHostingComponent(
  component: Component,
  projectSettings: ProjectSettingsV3
): Component | undefined {
  if (component.hosting) {
    return getComponent(projectSettings, component.hosting);
  }
  return undefined;
}

// TODO:implement after V3 project setting update
export function isHostedByAzure(context: ContextV3): boolean {
  return true;
}

export async function generateConfigBiceps(
  context: ContextV3,
  inputs: InputsWithProjectPath
): Promise<Result<undefined, FxError>> {
  ensureComponentConnections(context.projectSetting);
  for (const config of context.projectSetting.components) {
    if (
      config.name === ComponentNames.AzureWebApp ||
      config.name === ComponentNames.Function ||
      config.name === ComponentNames.APIM
    ) {
      const scenario = config.scenario;
      const clonedInputs = cloneDeep(inputs);
      assign(clonedInputs, {
        componentId: config.name === ComponentNames.APIM ? "" : scenarioToComponent.get(scenario),
        scenario: config.name === ComponentNames.APIM ? "" : scenario,
      });
      const component = Container.get<CloudResource>(config.name + "-config");
      const res = await component.generateBicep!(context, clonedInputs);
      if (res.isErr()) return err(res.error);
      const persistRes = await bicepUtils.persistBiceps(
        inputs.projectPath,
        convertToAlphanumericOnly(context.projectSetting.appName),
        res.value
      );
      if (persistRes.isErr()) return persistRes;
    }
  }
  return ok(undefined);
}

export const ComponentConnections = {
  [ComponentNames.AzureWebApp]: [
    ComponentNames.Identity,
    ComponentNames.AzureSQL,
    ComponentNames.KeyVault,
    ComponentNames.AadApp,
    ComponentNames.TeamsTab,
    ComponentNames.TeamsBot,
    ComponentNames.TeamsApi,
  ],
  [ComponentNames.Function]: [
    ComponentNames.Identity,
    ComponentNames.AzureSQL,
    ComponentNames.KeyVault,
    ComponentNames.AadApp,
    ComponentNames.TeamsTab,
    ComponentNames.TeamsBot,
    ComponentNames.TeamsApi,
  ],
  [ComponentNames.APIM]: [ComponentNames.TeamsTab, ComponentNames.TeamsBot],
};

export function ensureComponentConnections(settingsV3: ProjectSettingsV3): void {
  const exists = (c: string) => getComponent(settingsV3, c) !== undefined;
  const existingConfigNames = Object.keys(ComponentConnections).filter(exists);
  for (const configName of existingConfigNames) {
    const existingResources = (ComponentConnections[configName] as string[]).filter(exists);
    const configs = settingsV3.components.filter((c) => c.name === configName);
    for (const config of configs) {
      config.connections = cloneDeep(existingResources);
    }
  }
  if (
    getComponent(settingsV3, ComponentNames.TeamsApi) &&
    getComponent(settingsV3, ComponentNames.APIM)
  ) {
    const functionConfig = getComponentByScenario(
      settingsV3,
      ComponentNames.Function,
      Scenarios.Api
    );
    functionConfig?.connections?.push(ComponentNames.APIM);
  }
}

// clear resources related info in envInfo so that we could provision successfully using new M365 tenant.
export function resetEnvInfoWhenSwitchM365(envInfo: v3.EnvInfoV3): void {
  const keysToClear = [
    BuiltInFeaturePluginNames.appStudio,
    BuiltInFeaturePluginNames.aad,
    ComponentNames.AppManifest,
    ComponentNames.AadApp,
  ];

  const apimKeys = [BuiltInFeaturePluginNames.apim, ComponentNames.APIM];
  const botKeys = [BuiltInFeaturePluginNames.bot, ComponentNames.TeamsBot];
  const keys = Object.keys(envInfo.state);

  for (const key of keys) {
    if (keysToClear.includes(key)) {
      delete envInfo.state[key];
    }
    if (apimKeys.includes(key)) {
      delete envInfo.state[key]["apimClientAADObjectId"];
      delete envInfo.state[key]["apimClientAADClientId"];
      delete envInfo.state[key]["apimClientAADClientSecret"];
    }

    if (botKeys.includes(key)) {
      delete envInfo.state[key]["resourceId"];
      delete envInfo.state[key]["botId"];
      delete envInfo.state[key]["botPassword"];
      delete envInfo.state[key]["objectId"];
    }
  }
}

export function addFeatureNotify(
  inputs: Inputs,
  ui: UserInteraction,
  type: "Capability" | "Resource",
  features: string[]
) {
  const addNames = features.map((c) => `'${c}'`).join(" and ");
  const single = features.length === 1;
  const template =
    inputs.platform === Platform.CLI
      ? single
        ? type === "Capability"
          ? getLocalizedString("core.addCapability.addCapabilityNoticeForCli")
          : getLocalizedString("core.addResource.addResourceNoticeForCli")
        : type === "Capability"
        ? getLocalizedString("core.addCapability.addCapabilitiesNoticeForCli")
        : getLocalizedString("core.addResource.addResourcesNoticeForCli")
      : single
      ? type === "Capability"
        ? getLocalizedString("core.addCapability.addCapabilityNotice")
        : getLocalizedString("core.addResource.addResourceNotice")
      : type === "Capability"
      ? getLocalizedString("core.addCapability.addCapabilitiesNotice")
      : getLocalizedString("core.addResource.addResourcesNotice");
  const msg = format(template, addNames);
  ui.showMessage("info", msg, false);
}
