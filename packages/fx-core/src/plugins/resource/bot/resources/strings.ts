// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { getLocalizedString } from "../../../../common/localizeUtils";
import { BotScenario } from "../../../solution/fx-solution/question";
import { PluginActRoles } from "../enums/pluginActRoles";

export class CommonStrings {
  public static readonly BOT_WORKING_DIR_NAME = "bot";

  public static readonly AAD_APP = getLocalizedString("plugins.bot.AadApp");
  public static readonly AAD_CLIENT_SECRET = getLocalizedString("plugins.bot.AadClientSecret");
  public static readonly APP_STUDIO_BOT_REGISTRATION = getLocalizedString(
    "plugins.bot.AppStudioBotRegistration"
  );
  public static readonly SHORT_APP_NAME = "short app name";
  public static readonly AUTH_REDIRECT_URI_SUFFIX = "/public";
  public static readonly MESSAGE_ENDPOINT_SUFFIX = "/api/messages";
}

export class PluginAAD {
  public static readonly PLUGIN_NAME = "fx-resource-aad-app-for-teams";
  public static readonly CLIENT_ID = "clientId";
  public static readonly CLIENT_SECRET = "clientSecret";
  public static readonly APPLICATION_ID_URIS = "applicationIdUris";
  public static readonly OAUTH_AUTHORITY = "oauthAuthority";
  public static readonly TENANT_ID = "tenantId";
}

export class PluginLocalDebug {
  public static readonly PLUGIN_NAME = "fx-resource-local-debug";
  public static readonly LOCAL_BOT_ENDPOINT = "localBotEndpoint";
  public static readonly LOCAL_DEBUG_SUFFIX = "-local-debug";
}

export class PluginSolution {
  public static readonly PLUGIN_NAME = "solution";
  public static readonly SUBSCRIPTION_ID = "subscriptionId";
  public static readonly RESOURCE_GROUP_NAME = "resourceGroupName";
  public static readonly LOCATION = "location";
  public static readonly M365_TENANT_ID = "teamsAppTenantId";
  public static readonly RESOURCE_NAME_SUFFIX = "resourceNameSuffix";
  public static readonly REMOTE_TEAMS_APPID = "remoteTeamsAppId";
}

export class PluginSql {
  public static readonly PLUGIN_NAME = "fx-resource-azure-sql";
  public static readonly SQL_ENDPOINT = "sqlEndpoint";
  public static readonly SQL_DATABASE_NAME = "databaseName";
  public static readonly SQL_USERNAME = "sqlUsername";
  public static readonly SQL_PASSWORD = "sqlPassword";
}

export class PluginIdentity {
  public static readonly PLUGIN_NAME = "fx-resource-identity";
  public static readonly IDENTITY_ClIENT_ID = "identityClientId";
  public static readonly IDENTITY_RESOURCE_ID = "identityResourceId";
}

export class PluginFunction {
  public static readonly PLUGIN_NAME = "fx-resource-function";
  public static readonly ENDPOINT = "functionEndpoint";
}

export class PluginBot {
  public static readonly PLUGIN_NAME = "fx-resource-bot";
  public static readonly BOT_ID = "botId";
  public static readonly BOT_PASSWORD = "botPassword";
  public static readonly OBJECT_ID = "objectId";
  public static readonly PROGRAMMING_LANGUAGE = "programmingLanguage";
  public static readonly APP_SERVICE_PLAN = "appServicePlan";
  public static readonly SITE_NAME = "siteName";
  public static readonly SKU_NAME = "skuName";
  public static readonly SITE_ENDPOINT = "siteEndpoint";
  public static readonly VALID_DOMAIN = "validDomain";
  public static readonly BOT_CHANNEL_REGISTRATION = "botChannelReg";
  public static readonly BOT_WEB_APP_RESOURCE_ID = "botWebAppResourceId";
  public static readonly RESOURCE_ID = "resourceId";
  public static readonly UNPACK_FLAG = "unPackFlag";
  public static readonly HOST_TYPE = "host-type";
  // Bot capabilities, for example: notification, command-and-response.
  // Don't mix up with Teams capabilities (tab, bot, etc.)
  public static readonly BOT_CAPABILITIES = "capabilities";
}

export class ConfigNames {
  public static readonly PROGRAMMING_LANGUAGE = "programming language";
  public static readonly GRAPH_TOKEN = "graph token";
  public static readonly SUBSCRIPTION_ID = "subscription id";
  public static readonly ENV = "env";
  public static readonly BOT_SERVICE_RESOURCE_ID = "bot service resource id";
  public static readonly RESOURCE_GROUP = "resource group";
  public static readonly LOCAL_ENDPOINT = "local endpoint";

  public static readonly AUTH_CLIENT_ID = "auth client id";
  public static readonly AUTH_CLIENT_SECRET = "auth client secret";
  public static readonly SITE_ENDPOINT = "site endpoint";

  public static readonly BOT_ID = "bot id";
  public static readonly BOT_PASSWORD = "bot password";
  public static readonly LOCAL_BOT_ID = "local bot id";

  public static readonly APPSTUDIO_TOKEN = "app studio token";

  public static readonly MESSAGE_ENDPOINT = "message endpoint";
}

export class Commands {
  public static readonly NPM_INSTALL = "npm install";
  public static readonly NPM_BUILD = "npm run build";
}

export const BotCapabilities = {
  NOTIFICATION: "notification",
  COMMAND_AND_RESPONSE: "command-response",
  BOT: "bot",
  MESSAGE_EXTENSION: "message-extension",
  M365_SEARCH_APP: "m365-search-app",
} as const;

export type BotCapability = typeof BotCapabilities[keyof typeof BotCapabilities];

export const QuestionBotScenarioToPluginActRoles = new Map<BotScenario, PluginActRoles>([
  [BotScenario.NotificationBot, PluginActRoles.Notification],
  [BotScenario.CommandAndResponseBot, PluginActRoles.CommandAndResponse],
]);

export const QuestionBotScenarioToBotCapability = new Map<BotScenario, BotCapability>([
  [BotScenario.NotificationBot, BotCapabilities.NOTIFICATION],
  [BotScenario.CommandAndResponseBot, BotCapabilities.COMMAND_AND_RESPONSE],
]);

export const NotificationTriggers = {
  HTTP: "http",
  TIMER: "timer",
} as const;

export type NotificationTrigger = typeof NotificationTriggers[keyof typeof NotificationTriggers];
export type BotTrigger = NotificationTrigger;
