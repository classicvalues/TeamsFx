## API Report File for "@microsoft/teamsfx"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="node" />

import { AccessToken } from '@azure/identity';
import { Activity } from 'botbuilder-core';
import { Activity as Activity_2 } from 'botbuilder';
import { Attachment } from 'botbuilder';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { AxiosInstance } from 'axios';
import { AxiosRequestConfig } from 'axios';
import { BotFrameworkAdapter } from 'botbuilder';
import { CardAction } from 'botbuilder';
import { CardImage } from 'botbuilder';
import { ChannelInfo } from 'botbuilder';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConnectionConfig } from 'tedious';
import { ConversationReference } from 'botbuilder';
import { Dialog } from 'botbuilder-dialogs';
import { DialogContext } from 'botbuilder-dialogs';
import { DialogTurnResult } from 'botbuilder-dialogs';
import { GetTokenOptions } from '@azure/identity';
import { HeroCard } from 'botbuilder';
import { O365ConnectorCard } from 'botbuilder';
import { ReceiptCard } from 'botbuilder';
import { SecureContextOptions } from 'tls';
import { TeamsChannelAccount } from 'botbuilder';
import { ThumbnailCard } from 'botbuilder';
import { TokenCredential } from '@azure/identity';
import { TokenResponse } from 'botframework-schema';
import { TurnContext } from 'botbuilder-core';
import { TurnContext as TurnContext_2 } from 'botbuilder';
import { WebRequest } from 'botbuilder';
import { WebResponse } from 'botbuilder';

// @public
export enum ApiKeyLocation {
    Header = 0,
    QueryParams = 1
}

// @public
export class ApiKeyProvider implements AuthProvider {
    constructor(keyName: string, keyValue: string, keyLocation: ApiKeyLocation);
    AddAuthenticationInfo(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
}

// @public
export class AppCredential implements TokenCredential {
    constructor(authConfig: AuthenticationConfiguration);
    getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null>;
}

// @public
export interface AuthenticationConfiguration {
    readonly applicationIdUri?: string;
    readonly authorityHost?: string;
    readonly certificateContent?: string;
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly initiateLoginEndpoint?: string;
    readonly tenantId?: string;
}

// @public
export interface AuthProvider {
    AddAuthenticationInfo: (config: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
}

export { AxiosInstance }

// @public
export class BasicAuthProvider implements AuthProvider {
    constructor(userName: string, password: string);
    AddAuthenticationInfo(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
}

// @public
export class BearerTokenAuthProvider implements AuthProvider {
    constructor(getToken: () => Promise<string>);
    AddAuthenticationInfo(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
}

// @public
export class CertificateAuthProvider implements AuthProvider {
    constructor(certOption: SecureContextOptions);
    AddAuthenticationInfo(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
}

// @public
export class Channel implements NotificationTarget {
    constructor(parent: TeamsBotInstallation, info: ChannelInfo);
    readonly info: ChannelInfo;
    readonly parent: TeamsBotInstallation;
    sendAdaptiveCard(card: unknown): Promise<MessageResponse>;
    // Warning: (ae-forgotten-export) The symbol "MessageResponse" needs to be exported by the entry point index.d.ts
    sendMessage(text: string): Promise<MessageResponse>;
    readonly type: NotificationTargetType;
}

// @public
export class CommandBot {
    constructor(adapter: BotFrameworkAdapter, options?: CommandOptions);
    registerCommand(command: TeamsFxBotCommandHandler): void;
    registerCommands(commands: TeamsFxBotCommandHandler[]): void;
}

// @public
export interface CommandMessage {
    matches?: RegExpMatchArray;
    text: string;
}

// @public
export interface CommandOptions {
    commands?: TeamsFxBotCommandHandler[];
}

// @public
export class ConversationBot {
    constructor(options: ConversationOptions);
    readonly adapter: BotFrameworkAdapter;
    readonly command?: CommandBot;
    readonly notification?: NotificationBot;
    requestHandler(req: WebRequest, res: WebResponse, logic?: (context: TurnContext_2) => Promise<any>): Promise<void>;
}

// @public
export interface ConversationOptions {
    adapter?: BotFrameworkAdapter;
    adapterConfig?: {
        [key: string]: unknown;
    };
    command?: CommandOptions & {
        enabled?: boolean;
    };
    notification?: NotificationOptions_2 & {
        enabled?: boolean;
    };
}

// @public
export function createApiClient(apiEndpoint: string, authProvider: AuthProvider): AxiosInstance;

// Warning: (ae-forgotten-export) The symbol "TeamsFxConfiguration" needs to be exported by the entry point index.d.ts
//
// @public
export function createMicrosoftGraphClient(teamsfx: TeamsFxConfiguration, scopes?: string | string[]): Client;

// @public
export function createPemCertOption(cert: string | Buffer, key: string | Buffer, options?: {
    passphrase?: string;
    ca?: string | Buffer;
}): SecureContextOptions;

// @public
export function createPfxCertOption(pfx: string | Buffer, options?: {
    passphrase?: string;
}): SecureContextOptions;

// @public
export enum ErrorCode {
    AuthorizationInfoAlreadyExists = "AuthorizationInfoAlreadyExists",
    ChannelNotSupported = "ChannelNotSupported",
    ConsentFailed = "ConsentFailed",
    FailedOperation = "FailedOperation",
    IdentityTypeNotSupported = "IdentityTypeNotSupported",
    InternalError = "InternalError",
    InvalidCertificate = "InvalidCertificate",
    InvalidConfiguration = "InvalidConfiguration",
    InvalidParameter = "InvalidParameter",
    InvalidResponse = "InvalidResponse",
    RuntimeNotSupported = "RuntimeNotSupported",
    ServiceError = "ServiceError",
    TokenExpiredError = "TokenExpiredError",
    UiRequiredError = "UiRequiredError"
}

// @public
export class ErrorWithCode extends Error {
    constructor(message?: string, code?: ErrorCode);
    code: string | undefined;
}

// @public
export function getLogLevel(): LogLevel | undefined;

// @public
export function getTediousConnectionConfig(teamsfx: TeamsFx, databaseName?: string): Promise<ConnectionConfig>;

// @public
export enum IdentityType {
    App = "Application",
    User = "User"
}

// @public
export type LogFunction = (level: LogLevel, message: string) => void;

// @public
export interface Logger {
    error(message: string): void;
    info(message: string): void;
    verbose(message: string): void;
    warn(message: string): void;
}

// @public
export enum LogLevel {
    Error = 3,
    Info = 1,
    Verbose = 0,
    Warn = 2
}

// @public
export class Member implements NotificationTarget {
    constructor(parent: TeamsBotInstallation, account: TeamsChannelAccount);
    readonly account: TeamsChannelAccount;
    readonly parent: TeamsBotInstallation;
    sendAdaptiveCard(card: unknown): Promise<MessageResponse>;
    sendMessage(text: string): Promise<MessageResponse>;
    readonly type: NotificationTargetType;
}

// @public
export class MessageBuilder {
    static attachAdaptiveCard<TData extends object>(cardTemplate: unknown, data: TData): Partial<Activity_2>;
    static attachAdaptiveCardWithoutData(card: unknown): Partial<Activity_2>;
    static attachContent(attachement: Attachment): Partial<Activity_2>;
    static attachHeroCard(title: string, images?: (CardImage | string)[], buttons?: (CardAction | string)[], other?: Partial<HeroCard>): Partial<Activity_2>;
    static attachO365ConnectorCard(card: O365ConnectorCard): Partial<Activity_2>;
    static AttachReceiptCard(card: ReceiptCard): Partial<Activity_2>;
    static attachSigninCard(title: string, url: string, text?: string): Partial<Activity_2>;
    // (undocumented)
    static attachThumbnailCard(title: string, images?: (CardImage | string)[], buttons?: (CardAction | string)[], other?: Partial<ThumbnailCard>): Partial<Activity_2>;
}

// @public
export class MsGraphAuthProvider implements AuthenticationProvider {
    constructor(teamsfx: TeamsFxConfiguration, scopes?: string | string[]);
    getAccessToken(): Promise<string>;
}

// @public
export class NotificationBot {
    constructor(adapter: BotFrameworkAdapter, options?: NotificationOptions_2);
    installations(): Promise<TeamsBotInstallation[]>;
}

// @public
interface NotificationOptions_2 {
    storage?: NotificationTargetStorage;
}
export { NotificationOptions_2 as NotificationOptions }

// @public
export interface NotificationTarget {
    sendAdaptiveCard(card: unknown): Promise<MessageResponse>;
    sendMessage(text: string): Promise<MessageResponse>;
    readonly type?: NotificationTargetType;
}

// @public
export interface NotificationTargetStorage {
    delete(key: string): Promise<void>;
    list(): Promise<{
        [key: string]: unknown;
    }[]>;
    read(key: string): Promise<{
        [key: string]: unknown;
    } | undefined>;
    write(key: string, object: {
        [key: string]: unknown;
    }): Promise<void>;
}

// @public
export enum NotificationTargetType {
    Channel = "Channel",
    Group = "Group",
    Person = "Person"
}

// @public
export class OnBehalfOfUserCredential implements TokenCredential {
    constructor(ssoToken: string, config: AuthenticationConfiguration);
    getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null>;
    getUserInfo(): UserInfo;
}

// @public
export function sendAdaptiveCard(target: NotificationTarget, card: unknown): Promise<MessageResponse>;

// @public
export function sendMessage(target: NotificationTarget, text: string): Promise<MessageResponse>;

// @public
export function setLogFunction(logFunction?: LogFunction): void;

// @public
export function setLogger(logger?: Logger): void;

// @public
export function setLogLevel(level: LogLevel): void;

// @public
export class TeamsBotInstallation implements NotificationTarget {
    constructor(adapter: BotFrameworkAdapter, conversationReference: Partial<ConversationReference>);
    readonly adapter: BotFrameworkAdapter;
    channels(): Promise<Channel[]>;
    readonly conversationReference: Partial<ConversationReference>;
    members(): Promise<Member[]>;
    sendAdaptiveCard(card: unknown): Promise<MessageResponse>;
    sendMessage(text: string): Promise<MessageResponse>;
    readonly type?: NotificationTargetType;
}

// @public
export class TeamsBotSsoPrompt extends Dialog {
    constructor(teamsfx: TeamsFx, dialogId: string, settings: TeamsBotSsoPromptSettings);
    beginDialog(dc: DialogContext): Promise<DialogTurnResult>;
    continueDialog(dc: DialogContext): Promise<DialogTurnResult>;
}

// @public
export interface TeamsBotSsoPromptSettings {
    endOnInvalidMessage?: boolean;
    scopes: string[];
    timeout?: number;
}

// @public
export interface TeamsBotSsoPromptTokenResponse extends TokenResponse {
    ssoToken: string;
    ssoTokenExpiration: string;
}

// @public
export class TeamsFx implements TeamsFxConfiguration {
    constructor(identityType?: IdentityType, customConfig?: Record<string, string>);
    getConfig(key: string): string;
    getConfigs(): Record<string, string>;
    getCredential(): TokenCredential;
    getIdentityType(): IdentityType;
    getUserInfo(): Promise<UserInfo>;
    hasConfig(key: string): boolean;
    login(scopes: string | string[]): Promise<void>;
    setSsoToken(ssoToken: string): TeamsFx;
}

// @public
export interface TeamsFxBotCommandHandler {
    handleCommandReceived(context: TurnContext, message: CommandMessage): Promise<string | Partial<Activity> | void>;
    triggerPatterns: TriggerPatterns;
}

// @public
export class TeamsUserCredential implements TokenCredential {
    constructor(authConfig: AuthenticationConfiguration);
    getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null>;
    getUserInfo(): Promise<UserInfo>;
    login(scopes: string | string[]): Promise<void>;
}

// @public
export type TriggerPatterns = string | RegExp | (string | RegExp)[];

// @public
export interface UserInfo {
    displayName: string;
    objectId: string;
    preferredUserName: string;
    tenantId: string;
}

// (No @packageDocumentation comment for this package)

```
