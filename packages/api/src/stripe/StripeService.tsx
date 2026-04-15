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

import type {AuthService} from '@noctis/api/src/auth/AuthService';
import type {UserID} from '@noctis/api/src/BrandedTypes';
import {Config} from '@noctis/api/src/Config';
import type {IDonationRepository} from '@noctis/api/src/donation/IDonationRepository';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import type {GuildService} from '@noctis/api/src/guild/services/GuildService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {GiftCode} from '@noctis/api/src/models/GiftCode';
import type {User} from '@noctis/api/src/models/User';
import {ProductRegistry} from '@noctis/api/src/stripe/ProductRegistry';
import type {CreateCheckoutSessionParams} from '@noctis/api/src/stripe/services/StripeCheckoutService';
import {StripeCheckoutService} from '@noctis/api/src/stripe/services/StripeCheckoutService';
import {StripeGiftService} from '@noctis/api/src/stripe/services/StripeGiftService';
import {StripePremiumService} from '@noctis/api/src/stripe/services/StripePremiumService';
import {StripeSubscriptionService} from '@noctis/api/src/stripe/services/StripeSubscriptionService';
import type {HandleWebhookParams} from '@noctis/api/src/stripe/services/StripeWebhookService';
import {StripeWebhookService} from '@noctis/api/src/stripe/services/StripeWebhookService';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import type {Currency} from '@noctis/api/src/utils/CurrencyUtils';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import type {IEmailService} from '@noctis/email/src/IEmailService';
import Stripe from 'stripe';

export class StripeService {
	private stripe: Stripe | null = null;
	private productRegistry: ProductRegistry;
	private checkoutService: StripeCheckoutService;
	private subscriptionService: StripeSubscriptionService;
	private giftService: StripeGiftService;
	private premiumService: StripePremiumService;
	private webhookService: StripeWebhookService;

	constructor(
		private userRepository: IUserRepository,
		private userCacheService: UserCacheService,
		private authService: AuthService,
		private gatewayService: IGatewayService,
		private emailService: IEmailService,
		private guildRepository: IGuildRepositoryAggregate,
		private guildService: GuildService,
		private cacheService: ICacheService,
		private donationRepository: IDonationRepository,
	) {
		this.productRegistry = new ProductRegistry();

		if (Config.stripe.enabled && Config.stripe.secretKey) {
			this.stripe = new Stripe(Config.stripe.secretKey, {
				apiVersion: '2026-01-28.clover',
				httpClient: Config.dev.testModeEnabled ? Stripe.createFetchHttpClient() : undefined,
			});
		}

		this.premiumService = new StripePremiumService(
			this.userRepository,
			this.gatewayService,
			this.guildRepository,
			this.guildService,
		);

		this.checkoutService = new StripeCheckoutService(this.stripe, this.userRepository, this.productRegistry);

		this.subscriptionService = new StripeSubscriptionService(
			this.stripe,
			this.userRepository,
			this.cacheService,
			this.gatewayService,
		);

		this.giftService = new StripeGiftService(
			this.stripe,
			this.userRepository,
			this.cacheService,
			this.gatewayService,
			this.checkoutService,
			this.premiumService,
			this.subscriptionService,
		);

		this.webhookService = new StripeWebhookService(
			this.stripe,
			this.userRepository,
			this.userCacheService,
			this.authService,
			this.emailService,
			this.gatewayService,
			this.productRegistry,
			this.giftService,
			this.premiumService,
			this.donationRepository,
		);
	}

	getStripe(): Stripe | null {
		return this.stripe;
	}

	async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
		return this.checkoutService.createCheckoutSession(params);
	}

	async createCustomerPortalSession(userId: UserID): Promise<string> {
		return this.checkoutService.createCustomerPortalSession(userId);
	}

	getPriceIds(countryCode?: string): {
		monthly: string | null;
		yearly: string | null;
		gift_1_month: string | null;
		gift_1_year: string | null;
		currency: Currency;
	} {
		return this.checkoutService.getPriceIds(countryCode);
	}

	async cancelSubscriptionAtPeriodEnd(userId: UserID): Promise<void> {
		return this.subscriptionService.cancelSubscriptionAtPeriodEnd(userId);
	}

	async reactivateSubscription(userId: UserID): Promise<void> {
		return this.subscriptionService.reactivateSubscription(userId);
	}

	async extendSubscriptionWithGiftTrial(user: User, durationMonths: number, idempotencyKey: string): Promise<void> {
		return this.subscriptionService.extendSubscriptionWithGiftTrial(user, durationMonths, idempotencyKey);
	}

	async getGiftCode(code: string): Promise<GiftCode> {
		return this.giftService.getGiftCode(code);
	}

	async redeemGiftCode(userId: UserID, code: string): Promise<void> {
		return this.giftService.redeemGiftCode(userId, code);
	}

	async getUserGifts(userId: UserID): Promise<Array<GiftCode>> {
		return this.giftService.getUserGifts(userId);
	}

	async rejoinVisionariesGuild(userId: UserID): Promise<void> {
		return this.premiumService.rejoinVisionariesGuild(userId);
	}

	async rejoinOperatorsGuild(userId: UserID): Promise<void> {
		return this.premiumService.rejoinOperatorsGuild(userId);
	}

	async handleWebhook(params: HandleWebhookParams): Promise<void> {
		return this.webhookService.handleWebhook(params);
	}
}
