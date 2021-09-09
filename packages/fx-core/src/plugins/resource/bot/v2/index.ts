// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  AzureAccountProvider,
  AzureSolutionSettings,
  FxError,
  Inputs,
  Json,
  QTreeNode,
  Result,
  TokenProvider,
  Void,
} from "@microsoft/teamsfx-api";
import {
  Context,
  DeploymentInputs,
  ProvisionInputs,
  ResourcePlugin,
  ResourceProvisionOutput,
  ResourceTemplate,
} from "@microsoft/teamsfx-api/build/v2";
import { Inject, Service } from "typedi";
import { TeamsBot } from "..";
import {
  ResourcePlugins,
  ResourcePluginsV2,
} from "../../../solution/fx-solution/ResourcePluginContainer";
import {
  configureLocalResourceAdapter,
  configureResourceAdapter,
  deployAdapter,
  generateResourceTemplateAdapter,
  getQuestionsForScaffoldingAdapter,
  provisionLocalResourceAdapter,
  provisionResourceAdapter,
  scaffoldSourceCodeAdapter,
} from "../../utils4v2";

@Service(ResourcePluginsV2.BotPlugin)
export class BotPluginV2 implements ResourcePlugin {
  name = "fx-resource-bot";
  displayName = "Bot";
  @Inject(ResourcePlugins.BotPlugin)
  plugin!: TeamsBot;

  activate(solutionSettings: AzureSolutionSettings): boolean {
    return this.plugin.activate(solutionSettings);
  }
  async getQuestionsForScaffolding(
    ctx: Context,
    inputs: Inputs
  ): Promise<Result<QTreeNode | undefined, FxError>> {
    return await getQuestionsForScaffoldingAdapter(ctx, inputs, this.plugin);
  }
  async scaffoldSourceCode(ctx: Context, inputs: Inputs): Promise<Result<Void, FxError>> {
    return await scaffoldSourceCodeAdapter(ctx, inputs, this.plugin);
  }

  async generateResourceTemplate(
    ctx: Context,
    inputs: Inputs
  ): Promise<Result<ResourceTemplate, FxError>> {
    return await generateResourceTemplateAdapter(ctx, inputs, this.plugin);
  }
  async provisionResource(
    ctx: Context,
    inputs: ProvisionInputs,
    provisionInputConfig: Json,
    tokenProvider: TokenProvider
  ): Promise<Result<ResourceProvisionOutput, FxError>> {
    return await provisionResourceAdapter(
      ctx,
      inputs,
      provisionInputConfig,
      tokenProvider,
      this.plugin
    );
  }

  async configureResource(
    ctx: Context,
    inputs: ProvisionInputs,
    provisionInputConfig: Json,
    provisionOutputs: Json,
    tokenProvider: TokenProvider
  ): Promise<Result<Void, FxError>> {
    return await configureResourceAdapter(
      ctx,
      inputs,
      provisionInputConfig,
      provisionOutputs,
      tokenProvider,
      this.plugin
    );
  }
  async provisionLocalResource(
    ctx: Context,
    inputs: Inputs,
    localSettings: Json,
    tokenProvider: TokenProvider
  ): Promise<Result<Void, FxError>> {
    return await provisionLocalResourceAdapter(
      ctx,
      inputs,
      localSettings,
      tokenProvider,
      this.plugin
    );
  }

  async configureLocalResource(
    ctx: Context,
    inputs: Inputs,
    localSettings: Json,
    tokenProvider: TokenProvider
  ): Promise<Result<Void, FxError>> {
    return await configureLocalResourceAdapter(
      ctx,
      inputs,
      localSettings,
      tokenProvider,
      this.plugin
    );
  }

  async deploy(
    ctx: Context,
    inputs: DeploymentInputs,
    provisionOutput: Json,
    tokenProvider: AzureAccountProvider
  ): Promise<Result<Void, FxError>> {
    return await deployAdapter(ctx, inputs, provisionOutput, tokenProvider, this.plugin);
  }
}
