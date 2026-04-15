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

import {AdminRepository} from '@noctis/api/src/admin/AdminRepository';
import {AdminArchiveRepository} from '@noctis/api/src/admin/repositories/AdminArchiveRepository';
import {SystemDmJobRepository} from '@noctis/api/src/admin/repositories/SystemDmJobRepository';
import {Config} from '@noctis/api/src/Config';
import {ChannelRepository} from '@noctis/api/src/channel/ChannelRepository';
import {ChannelService} from '@noctis/api/src/channel/services/ChannelService';
import {ConnectionRepository} from '@noctis/api/src/connection/ConnectionRepository';
import {ConnectionService} from '@noctis/api/src/connection/ConnectionService';
import {CsamEvidenceRetentionService} from '@noctis/api/src/csam/CsamEvidenceRetentionService';
import {CsamScanJobService} from '@noctis/api/src/csam/CsamScanJobService';
import {createEmailProvider} from '@noctis/api/src/email/EmailProviderFactory';
import {FavoriteMemeRepository} from '@noctis/api/src/favorite_meme/FavoriteMemeRepository';
import {GuildAuditLogService} from '@noctis/api/src/guild/GuildAuditLogService';
import {GuildRepository} from '@noctis/api/src/guild/repositories/GuildRepository';
import {ExpressionAssetPurger} from '@noctis/api/src/guild/services/content/ExpressionAssetPurger';
import {GuildService} from '@noctis/api/src/guild/services/GuildService';
import {AssetDeletionQueue} from '@noctis/api/src/infrastructure/AssetDeletionQueue';
import {AvatarService} from '@noctis/api/src/infrastructure/AvatarService';
import {CloudflarePurgeQueue, NoopPurgeQueue} from '@noctis/api/src/infrastructure/CloudflarePurgeQueue';
import {DisabledLiveKitService} from '@noctis/api/src/infrastructure/DisabledLiveKitService';
import {DiscriminatorService} from '@noctis/api/src/infrastructure/DiscriminatorService';
import {EmbedService} from '@noctis/api/src/infrastructure/EmbedService';
import {EntityAssetService} from '@noctis/api/src/infrastructure/EntityAssetService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {ILiveKitService} from '@noctis/api/src/infrastructure/ILiveKitService';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import {InMemoryVoiceRoomStore} from '@noctis/api/src/infrastructure/InMemoryVoiceRoomStore';
import type {IStorageService} from '@noctis/api/src/infrastructure/IStorageService';
import type {IVoiceRoomStore} from '@noctis/api/src/infrastructure/IVoiceRoomStore';
import {KVAccountDeletionQueueService} from '@noctis/api/src/infrastructure/KVAccountDeletionQueueService';
import {KVActivityTracker} from '@noctis/api/src/infrastructure/KVActivityTracker';
import {KVBulkMessageDeletionQueueService} from '@noctis/api/src/infrastructure/KVBulkMessageDeletionQueueService';
import {LiveKitService} from '@noctis/api/src/infrastructure/LiveKitService';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import {createStorageService} from '@noctis/api/src/infrastructure/StorageServiceFactory';
import {UnfurlerService} from '@noctis/api/src/infrastructure/UnfurlerService';
import {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import {VirusScanService} from '@noctis/api/src/infrastructure/VirusScanService';
import {VoiceRoomStore} from '@noctis/api/src/infrastructure/VoiceRoomStore';
import {InstanceConfigRepository} from '@noctis/api/src/instance/InstanceConfigRepository';
import {InviteRepository} from '@noctis/api/src/invite/InviteRepository';
import {InviteService} from '@noctis/api/src/invite/InviteService';
import {Logger} from '@noctis/api/src/Logger';
import {LimitConfigService} from '@noctis/api/src/limits/LimitConfigService';
import {
	getGatewayService,
	getInjectedS3Service,
	getKVClient,
	getMediaService,
	getWorkerService,
} from '@noctis/api/src/middleware/ServiceRegistry';
import {ApplicationRepository} from '@noctis/api/src/oauth/repositories/ApplicationRepository';
import {OAuth2TokenRepository} from '@noctis/api/src/oauth/repositories/OAuth2TokenRepository';
import {PackRepository} from '@noctis/api/src/pack/PackRepository';
import {PackService} from '@noctis/api/src/pack/PackService';
import {ReadStateRepository} from '@noctis/api/src/read_state/ReadStateRepository';
import {ReadStateService} from '@noctis/api/src/read_state/ReadStateService';
import {ReportRepository} from '@noctis/api/src/report/ReportRepository';
import {PaymentRepository} from '@noctis/api/src/user/repositories/PaymentRepository';
import {UserContactChangeLogRepository} from '@noctis/api/src/user/repositories/UserContactChangeLogRepository';
import {UserRepository} from '@noctis/api/src/user/repositories/UserRepository';
import {UserContactChangeLogService} from '@noctis/api/src/user/services/UserContactChangeLogService';
import {UserDeletionEligibilityService} from '@noctis/api/src/user/services/UserDeletionEligibilityService';
import {UserHarvestRepository} from '@noctis/api/src/user/UserHarvestRepository';
import {UserPermissionUtils} from '@noctis/api/src/utils/UserPermissionUtils';
import {VoiceRepository} from '@noctis/api/src/voice/VoiceRepository';
import {VoiceTopology} from '@noctis/api/src/voice/VoiceTopology';
import {WebhookRepository} from '@noctis/api/src/webhook/WebhookRepository';
import {KVCacheProvider} from '@noctis/cache/src/providers/KVCacheProvider';
import {EmailI18nService} from '@noctis/email/src/EmailI18nService';
import type {EmailConfig, UserBouncedEmailChecker} from '@noctis/email/src/EmailProviderTypes';
import {EmailService} from '@noctis/email/src/EmailService';
import type {IEmailService} from '@noctis/email/src/IEmailService';
import {TestEmailService} from '@noctis/email/src/TestEmailService';
import type {IKVProvider} from '@noctis/kv_client/src/IKVProvider';
import {RateLimitService} from '@noctis/rate_limit/src/RateLimitService';
import type {IWorkerService} from '@noctis/worker/src/contracts/IWorkerService';
import Stripe from 'stripe';

let _workerTestEmailService: TestEmailService | null = null;
function getWorkerTestEmailService(): TestEmailService {
	if (!_workerTestEmailService) {
		_workerTestEmailService = new TestEmailService();
	}
	return _workerTestEmailService;
}

export interface WorkerDependencies {
	kvClient: IKVProvider;
	snowflakeService: SnowflakeService;
	limitConfigService: LimitConfigService;

	userRepository: UserRepository;
	channelRepository: ChannelRepository;
	guildRepository: GuildRepository;
	favoriteMemeRepository: FavoriteMemeRepository;
	applicationRepository: ApplicationRepository;
	oauth2TokenRepository: OAuth2TokenRepository;
	readStateRepository: ReadStateRepository;
	adminRepository: AdminRepository;
	reportRepository: ReportRepository;
	paymentRepository: PaymentRepository;
	userHarvestRepository: UserHarvestRepository;
	adminArchiveRepository: AdminArchiveRepository;
	systemDmJobRepository: SystemDmJobRepository;
	voiceRepository: VoiceRepository | null;
	connectionRepository: ConnectionRepository;
	connectionService: ConnectionService;

	cacheService: KVCacheProvider;
	userCacheService: UserCacheService;
	storageService: IStorageService;
	assetDeletionQueue: AssetDeletionQueue;
	purgeQueue: CloudflarePurgeQueue | NoopPurgeQueue;

	gatewayService: IGatewayService;
	mediaService: IMediaService;
	discriminatorService: DiscriminatorService;
	avatarService: AvatarService;
	virusScanService: VirusScanService;
	rateLimitService: RateLimitService;
	emailService: IEmailService;
	inviteService: InviteService;

	workerService: IWorkerService;
	unfurlerService: UnfurlerService;
	embedService: EmbedService;
	readStateService: ReadStateService;
	userPermissionUtils: UserPermissionUtils;
	activityTracker: KVActivityTracker;
	deletionQueueService: KVAccountDeletionQueueService;
	bulkMessageDeletionQueueService: KVBulkMessageDeletionQueueService;
	deletionEligibilityService: UserDeletionEligibilityService;

	voiceRoomStore: IVoiceRoomStore;
	liveKitService: ILiveKitService;
	voiceTopology: VoiceTopology | null;

	channelService: ChannelService;
	guildAuditLogService: GuildAuditLogService;
	contactChangeLogService: UserContactChangeLogService;
	csamEvidenceRetentionService: CsamEvidenceRetentionService;

	stripe: Stripe | null;
	csamScanJobService: CsamScanJobService;
}

export async function initializeWorkerDependencies(snowflakeService: SnowflakeService): Promise<WorkerDependencies> {
	Logger.info('Initializing worker dependencies...');

	const kvClient = getKVClient();

	const userRepository = new UserRepository();
	const channelRepository = new ChannelRepository();
	const guildRepository = new GuildRepository();
	const favoriteMemeRepository = new FavoriteMemeRepository();
	const applicationRepository = new ApplicationRepository();
	const oauth2TokenRepository = new OAuth2TokenRepository();
	const readStateRepository = new ReadStateRepository();
	const adminRepository = new AdminRepository();
	const adminArchiveRepository = new AdminArchiveRepository();
	const systemDmJobRepository = new SystemDmJobRepository();
	const reportRepository = new ReportRepository();
	const paymentRepository = new PaymentRepository();
	const userHarvestRepository = new UserHarvestRepository();
	const contactChangeLogRepository = new UserContactChangeLogRepository();
	const contactChangeLogService = new UserContactChangeLogService(contactChangeLogRepository);
	const connectionRepository = new ConnectionRepository();

	const cacheService = new KVCacheProvider({client: kvClient});
	const instanceConfigRepository = new InstanceConfigRepository();
	const limitConfigSubscriber = getKVClient();
	const limitConfigService = new LimitConfigService(instanceConfigRepository, cacheService, limitConfigSubscriber);
	await limitConfigService.initialize();
	limitConfigService.setAsGlobalInstance();
	const userCacheService = new UserCacheService(cacheService, userRepository);
	const storageService = createStorageService({s3Service: getInjectedS3Service()});
	const csamEvidenceRetentionService = new CsamEvidenceRetentionService(storageService);
	const assetDeletionQueue = new AssetDeletionQueue(kvClient);
	const purgeQueue = Config.cloudflare.purgeEnabled ? new CloudflarePurgeQueue(kvClient) : new NoopPurgeQueue();

	const gatewayService = getGatewayService();
	const connectionService = new ConnectionService(connectionRepository, gatewayService, null);
	const mediaService = getMediaService();
	const discriminatorService = new DiscriminatorService(userRepository, cacheService, limitConfigService);
	const avatarService = new AvatarService(storageService, mediaService, limitConfigService);
	const entityAssetService = new EntityAssetService(
		storageService,
		mediaService,
		assetDeletionQueue,
		limitConfigService,
	);
	const virusScanService = new VirusScanService(cacheService);
	const rateLimitService = new RateLimitService(cacheService);
	const packRepository = new PackRepository();
	const packAssetPurger = new ExpressionAssetPurger(assetDeletionQueue);
	const packService = new PackService(
		packRepository,
		guildRepository,
		avatarService,
		snowflakeService,
		packAssetPurger,
		userRepository,
		userCacheService,
		limitConfigService,
	);
	const emailConfig: EmailConfig = {
		enabled: Config.email.enabled,
		fromEmail: Config.email.fromEmail,
		fromName: Config.email.fromName,
		appBaseUrl: Config.endpoints.webApp,
		marketingBaseUrl: Config.endpoints.marketing,
	};

	const bouncedEmailChecker: UserBouncedEmailChecker = {
		isEmailBounced: async (email: string) => {
			const user = await userRepository.findByEmail(email);
			return user?.emailBounced ?? false;
		},
	};

	const emailI18n = new EmailI18nService();
	const emailProvider = createEmailProvider(Config.email);
	const emailService: IEmailService = Config.dev.testModeEnabled
		? getWorkerTestEmailService()
		: new EmailService(emailConfig, emailI18n, emailProvider, bouncedEmailChecker);

	const workerService = getWorkerService();
	const guildAuditLogService = new GuildAuditLogService(guildRepository, snowflakeService, workerService);
	const unfurlerService = new UnfurlerService(cacheService, mediaService);
	const embedService = new EmbedService(channelRepository, cacheService, unfurlerService, mediaService, workerService);
	const readStateService = new ReadStateService(readStateRepository, gatewayService);
	const userPermissionUtils = new UserPermissionUtils(userRepository, guildRepository);
	const activityTracker = new KVActivityTracker(kvClient);
	const deletionQueueService = new KVAccountDeletionQueueService(kvClient, userRepository);
	const bulkMessageDeletionQueueService = new KVBulkMessageDeletionQueueService(kvClient);
	const deletionEligibilityService = new UserDeletionEligibilityService(kvClient);
	const csamScanJobService = new CsamScanJobService();

	let voiceRepository: VoiceRepository | null = null;
	let voiceTopology: VoiceTopology | null = null;
	let voiceRoomStore: IVoiceRoomStore;
	let liveKitService: ILiveKitService;

	if (Config.voice.enabled) {
		voiceRepository = new VoiceRepository();
		voiceTopology = new VoiceTopology(voiceRepository, null);
		await voiceTopology.initialize();
		voiceRoomStore = new VoiceRoomStore(kvClient);
		liveKitService = new LiveKitService(voiceTopology);
		Logger.info('Voice services initialized');
	} else {
		voiceRoomStore = new InMemoryVoiceRoomStore();
		liveKitService = new DisabledLiveKitService();
	}

	const inviteRepository = new InviteRepository();
	const webhookRepository = new WebhookRepository();

	const channelService = new ChannelService(
		channelRepository,
		userRepository,
		guildRepository,
		packService,
		userCacheService,
		embedService,
		readStateService,
		cacheService,
		storageService,
		gatewayService,
		mediaService,
		avatarService,
		workerService,
		virusScanService,
		snowflakeService,
		rateLimitService,
		purgeQueue,
		favoriteMemeRepository,
		guildAuditLogService,
		voiceRoomStore,
		liveKitService,
		inviteRepository,
		webhookRepository,
		limitConfigService,
		undefined,
	);
	const guildService = new GuildService(
		guildRepository,
		channelRepository,
		inviteRepository,
		channelService,
		userCacheService,
		gatewayService,
		entityAssetService,
		avatarService,
		assetDeletionQueue,
		userRepository,
		mediaService,
		cacheService,
		snowflakeService,
		rateLimitService,
		workerService,
		webhookRepository,
		guildAuditLogService,
		limitConfigService,
	);
	const inviteService = new InviteService(
		inviteRepository,
		guildService,
		channelService,
		gatewayService,
		guildAuditLogService,
		userRepository,
		packRepository,
		packService,
		limitConfigService,
	);

	let stripe: Stripe | null = null;
	if (Config.stripe.enabled && Config.stripe.secretKey) {
		stripe = new Stripe(Config.stripe.secretKey, {
			apiVersion: '2026-01-28.clover',
			httpClient: Config.dev.testModeEnabled ? Stripe.createFetchHttpClient() : undefined,
		});
		Logger.info('Stripe initialized');
	}

	Logger.info('Worker dependencies initialized successfully');

	return {
		kvClient,
		snowflakeService,
		limitConfigService,
		userRepository,
		channelRepository,
		guildRepository,
		favoriteMemeRepository,
		applicationRepository,
		oauth2TokenRepository,
		readStateRepository,
		adminRepository,
		reportRepository,
		paymentRepository,
		userHarvestRepository,
		adminArchiveRepository,
		systemDmJobRepository,
		voiceRepository,
		connectionRepository,
		connectionService,
		cacheService,
		userCacheService,
		storageService,
		assetDeletionQueue,
		purgeQueue,
		gatewayService,
		mediaService,
		discriminatorService,
		avatarService,
		virusScanService,
		rateLimitService,
		emailService,
		inviteService,
		workerService,
		unfurlerService,
		embedService,
		readStateService,
		userPermissionUtils,
		activityTracker,
		deletionQueueService,
		bulkMessageDeletionQueueService,
		deletionEligibilityService,
		voiceRoomStore,
		liveKitService,
		voiceTopology,
		channelService,
		guildAuditLogService,
		contactChangeLogService,
		csamEvidenceRetentionService,
		stripe,
		csamScanJobService,
	};
}

export async function shutdownWorkerDependencies(_deps: WorkerDependencies): Promise<void> {
	Logger.info('Shutting down worker dependencies...');
	Logger.info('Worker dependencies shut down successfully');
}
