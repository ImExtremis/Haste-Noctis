/*
 * Copyright (C) 2026 Noctis Contributors
 *
 * This file is part of Noctis.
 *
 * Noctis is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Noctis is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Noctis. If not, see <https://www.gnu.org/licenses/>.
 */

import type {AdminService} from '@noctis/api/src/admin/AdminService';
import type {AdminApiKeyService} from '@noctis/api/src/admin/services/AdminApiKeyService';
import type {AdminArchiveService} from '@noctis/api/src/admin/services/AdminArchiveService';
import type {AlertService} from '@noctis/api/src/alert/AlertService';
import type {AuthRequestService} from '@noctis/api/src/auth/AuthRequestService';
import type {AuthService} from '@noctis/api/src/auth/AuthService';
import type {AuthMfaService} from '@noctis/api/src/auth/services/AuthMfaService';
import type {DesktopHandoffService} from '@noctis/api/src/auth/services/DesktopHandoffService';
import type {SsoService} from '@noctis/api/src/auth/services/SsoService';
import type {UserID} from '@noctis/api/src/BrandedTypes';
import type {IBlueskyOAuthService} from '@noctis/api/src/bluesky/IBlueskyOAuthService';
import type {IChannelRepository} from '@noctis/api/src/channel/IChannelRepository';
import type {ChannelRequestService} from '@noctis/api/src/channel/services/ChannelRequestService';
import type {ChannelService} from '@noctis/api/src/channel/services/ChannelService';
import type {MessageRequestService} from '@noctis/api/src/channel/services/message/MessageRequestService';
import type {ScheduledMessageService} from '@noctis/api/src/channel/services/ScheduledMessageService';
import type {StreamPreviewService} from '@noctis/api/src/channel/services/StreamPreviewService';
import type {StreamService} from '@noctis/api/src/channel/services/StreamService';
import type {ConnectionRequestService} from '@noctis/api/src/connection/ConnectionRequestService';
import type {ConnectionService} from '@noctis/api/src/connection/ConnectionService';
import type {CsamEvidenceRetentionService} from '@noctis/api/src/csam/CsamEvidenceRetentionService';
import type {CsamLegalHoldService} from '@noctis/api/src/csam/CsamLegalHoldService';
import type {NcmecSubmissionService} from '@noctis/api/src/csam/NcmecSubmissionService';
import type {DonationService} from '@noctis/api/src/donation/DonationService';
import type {DownloadService} from '@noctis/api/src/download/DownloadService';
import type {FavoriteMemeRequestService} from '@noctis/api/src/favorite_meme/FavoriteMemeRequestService';
import type {FavoriteMemeService} from '@noctis/api/src/favorite_meme/FavoriteMemeService';
import type {GatewayRequestService} from '@noctis/api/src/gateway/GatewayRequestService';
import type {IGuildDiscoveryService} from '@noctis/api/src/guild/services/GuildDiscoveryService';
import type {GuildService} from '@noctis/api/src/guild/services/GuildService';
import type {EmbedService} from '@noctis/api/src/infrastructure/EmbedService';
import type {EntityAssetService} from '@noctis/api/src/infrastructure/EntityAssetService';
import type {ErrorI18nService} from '@noctis/api/src/infrastructure/ErrorI18nService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {IKlipyService} from '@noctis/api/src/infrastructure/IKlipyService';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import type {IStorageService} from '@noctis/api/src/infrastructure/IStorageService';
import type {ITenorService} from '@noctis/api/src/infrastructure/ITenorService';
import type {KVActivityTracker} from '@noctis/api/src/infrastructure/KVActivityTracker';
import type {LiveKitWebhookService} from '@noctis/api/src/infrastructure/LiveKitWebhookService';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {InstanceConfigRepository} from '@noctis/api/src/instance/InstanceConfigRepository';
import type {InviteRequestService} from '@noctis/api/src/invite/InviteRequestService';
import type {InviteService} from '@noctis/api/src/invite/InviteService';
import type {LimitConfigService} from '@noctis/api/src/limits/LimitConfigService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {AuthSession} from '@noctis/api/src/models/AuthSession';
import type {User} from '@noctis/api/src/models/User';
import type {ApplicationService} from '@noctis/api/src/oauth/ApplicationService';
import type {BotAuthService} from '@noctis/api/src/oauth/BotAuthService';
import type {OAuth2ApplicationsRequestService} from '@noctis/api/src/oauth/OAuth2ApplicationsRequestService';
import type {OAuth2RequestService} from '@noctis/api/src/oauth/OAuth2RequestService';
import type {OAuth2Service} from '@noctis/api/src/oauth/OAuth2Service';
import type {IApplicationRepository} from '@noctis/api/src/oauth/repositories/IApplicationRepository';
import type {IOAuth2TokenRepository} from '@noctis/api/src/oauth/repositories/IOAuth2TokenRepository';
import type {PackRepository} from '@noctis/api/src/pack/PackRepository';
import type {PackRequestService} from '@noctis/api/src/pack/PackRequestService';
import type {PackService} from '@noctis/api/src/pack/PackService';
import type {ReadStateRequestService} from '@noctis/api/src/read_state/ReadStateRequestService';
import type {ReadStateService} from '@noctis/api/src/read_state/ReadStateService';
import type {ReportRequestService} from '@noctis/api/src/report/ReportRequestService';
import type {ReportService} from '@noctis/api/src/report/ReportService';
import type {RpcService} from '@noctis/api/src/rpc/RpcService';
import type {SearchService} from '@noctis/api/src/search/SearchService';
import type {StripeService} from '@noctis/api/src/stripe/StripeService';
import type {ThemeService} from '@noctis/api/src/theme/ThemeService';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import type {EmailChangeService} from '@noctis/api/src/user/services/EmailChangeService';
import type {PasswordChangeService} from '@noctis/api/src/user/services/PasswordChangeService';
import type {UserAccountRequestService} from '@noctis/api/src/user/services/UserAccountRequestService';
import type {UserAuthRequestService} from '@noctis/api/src/user/services/UserAuthRequestService';
import type {UserChannelRequestService} from '@noctis/api/src/user/services/UserChannelRequestService';
import type {UserContactChangeLogService} from '@noctis/api/src/user/services/UserContactChangeLogService';
import type {UserContentRequestService} from '@noctis/api/src/user/services/UserContentRequestService';
import type {UserRelationshipRequestService} from '@noctis/api/src/user/services/UserRelationshipRequestService';
import type {UserService} from '@noctis/api/src/user/services/UserService';
import type {SweegoWebhookService} from '@noctis/api/src/webhook/SweegoWebhookService';
import type {WebhookRequestService} from '@noctis/api/src/webhook/WebhookRequestService';
import type {WebhookService} from '@noctis/api/src/webhook/WebhookService';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import type {IEmailService} from '@noctis/email/src/IEmailService';
import type {IRateLimitService} from '@noctis/rate_limit/src/IRateLimitService';
import type {IWorkerService} from '@noctis/worker/src/contracts/IWorkerService';
import type {Hono} from 'hono';

export interface HonoEnv {
	Variables: {
		user: User;
		responseSchema: unknown;
		adminService: AdminService;
		adminArchiveService: AdminArchiveService;
		adminApiKeyService: AdminApiKeyService;
		adminApiKey?: {keyId: bigint; createdById: UserID};
		adminApiKeyAcls: Set<string> | null;
		adminUserId: UserID;
		adminUserAcls: Set<string>;
		authTokenType?: 'session' | 'bearer' | 'bot' | 'admin_api_key';
		authViaCookie?: boolean;
		authToken?: string;
		authUserId?: string;
		oauthBearerAllowed?: boolean;
		oauthBearerToken?: string;
		oauthBearerScopes?: Set<string>;
		oauthBearerUserId?: UserID;
		auditLogReason: string | null;
		authMfaService: AuthMfaService;
		authService: AuthService;
		authRequestService: AuthRequestService;
		ssoService: SsoService;
		authSession: AuthSession;
		desktopHandoffService: DesktopHandoffService;
		cacheService: ICacheService;
		channelService: ChannelService;
		channelRequestService: ChannelRequestService;
		messageRequestService: MessageRequestService;
		channelRepository: IChannelRepository;
		connectionService: ConnectionService;
		connectionRequestService: ConnectionRequestService;
		blueskyOAuthService: IBlueskyOAuthService | null;
		donationService: DonationService;
		downloadService: DownloadService;
		streamPreviewService: StreamPreviewService;
		streamService: StreamService;
		emailService: IEmailService;
		emailChangeService: EmailChangeService;
		passwordChangeService: PasswordChangeService;
		embedService: EmbedService;
		entityAssetService: EntityAssetService;
		favoriteMemeService: FavoriteMemeService;
		favoriteMemeRequestService: FavoriteMemeRequestService;
		gatewayService: IGatewayService;
		gatewayRequestService: GatewayRequestService;
		alertService: AlertService;
		discoveryService: IGuildDiscoveryService;
		guildService: GuildService;
		packService: PackService;
		packRequestService: PackRequestService;
		packRepository: PackRepository;
		inviteService: InviteService;
		inviteRequestService: InviteRequestService;
		liveKitWebhookService?: LiveKitWebhookService;
		mediaService: IMediaService;
		rateLimitService: IRateLimitService;
		readStateService: ReadStateService;
		readStateRequestService: ReadStateRequestService;
		kvActivityTracker: KVActivityTracker;
		reportService: ReportService;
		reportRequestService: ReportRequestService;
		csamEvidenceRetentionService: CsamEvidenceRetentionService;
		contactChangeLogService: UserContactChangeLogService;
		csamLegalHoldService: CsamLegalHoldService;
		ncmecSubmissionService: NcmecSubmissionService;
		requestCache: RequestCache;
		rpcService: RpcService;
		searchService: SearchService;
		snowflakeService: SnowflakeService;
		storageService: IStorageService;
		klipyService: IKlipyService;
		tenorService: ITenorService;
		themeService: ThemeService;
		userCacheService: UserCacheService;
		userRepository: IUserRepository;
		userService: UserService;
		userAccountRequestService: UserAccountRequestService;
		userAuthRequestService: UserAuthRequestService;
		userChannelRequestService: UserChannelRequestService;
		userContentRequestService: UserContentRequestService;
		userRelationshipRequestService: UserRelationshipRequestService;
		sweegoWebhookService: SweegoWebhookService;
		webhookService: WebhookService;
		webhookRequestService: WebhookRequestService;
		workerService: IWorkerService;
		scheduledMessageService: ScheduledMessageService;
		stripeService: StripeService;
		applicationService: ApplicationService;
		oauth2Service: OAuth2Service;
		oauth2RequestService: OAuth2RequestService;
		oauth2ApplicationsRequestService: OAuth2ApplicationsRequestService;
		applicationRepository: IApplicationRepository;
		oauth2TokenRepository: IOAuth2TokenRepository;
		botAuthService: BotAuthService;
		sudoModeValid: boolean;
		sudoModeToken: string | null;
		instanceConfigRepository: InstanceConfigRepository;
		limitConfigService: LimitConfigService;
		requestLocale: string;
		errorI18nService: ErrorI18nService;
		channelUpdateType?: number;
	};
}

export type HonoApp = Hono<HonoEnv>;
