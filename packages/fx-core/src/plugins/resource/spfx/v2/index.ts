// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  AzureSolutionSettings,
  FxError,
  Inputs,
  Json,
  QTreeNode,
  Result,
  Void,
  TokenProvider,
  ProjectSettings,
  Func,
} from "@microsoft/teamsfx-api";
import {
  Context,
  DeploymentInputs,
  DeepReadonly,
  ResourcePlugin,
  EnvInfoV2,
} from "@microsoft/teamsfx-api/build/v2";
import { Inject, Service } from "typedi";
import { SpfxPlugin } from "../..";
import {
  ResourcePlugins,
  ResourcePluginsV2,
} from "../../../solution/fx-solution/ResourcePluginContainer";
import {
  deployAdapter,
  getQuestionsForScaffoldingAdapter,
  getQuestionsForUserTaskAdapter,
  scaffoldSourceCodeAdapter,
} from "../../utils4v2";

@Service(ResourcePluginsV2.SpfxPlugin)
export class SpfxPluginV2 implements ResourcePlugin {
  name = "fx-resource-spfx";
  displayName = "SharePoint Framework (SPFx)";
  @Inject(ResourcePlugins.SpfxPlugin)
  plugin!: SpfxPlugin;

  activate(projectSettings: ProjectSettings): boolean {
    const solutionSettings = projectSettings.solutionSettings as AzureSolutionSettings;
    return this.plugin.activate(solutionSettings);
  }

  async getQuestionsForScaffolding(
    ctx: Context,
    inputs: Inputs
  ): Promise<Result<QTreeNode | undefined, FxError>> {
    return await getQuestionsForScaffoldingAdapter(ctx, inputs, this.plugin);
  }

  async getQuestionsForUserTask(
    ctx: Context,
    inputs: Inputs,
    func: Func,
    envInfo: DeepReadonly<EnvInfoV2>,
    tokenProvider: TokenProvider
  ): Promise<Result<QTreeNode | undefined, FxError>> {
    return await getQuestionsForUserTaskAdapter(
      ctx,
      inputs,
      func,
      envInfo,
      tokenProvider,
      this.plugin
    );
  }

  async scaffoldSourceCode(ctx: Context, inputs: Inputs): Promise<Result<Void, FxError>> {
    return await scaffoldSourceCodeAdapter(ctx, inputs, this.plugin);
  }

  async deploy(
    ctx: Context,
    inputs: DeploymentInputs,
    envInfo: DeepReadonly<EnvInfoV2>,
    tokenProvider: TokenProvider
  ): Promise<Result<Void, FxError>> {
    return await deployAdapter(ctx, inputs, envInfo, tokenProvider, this.plugin);
  }
}
