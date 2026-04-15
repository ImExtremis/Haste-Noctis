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

import type {UserID} from '@noctis/api/src/BrandedTypes';
import {createUserID} from '@noctis/api/src/BrandedTypes';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import {Logger} from '@noctis/api/src/Logger';
import type {GiftCode} from '@noctis/api/src/models/GiftCode';
import type {User} from '@noctis/api/src/models/User';
import type {ProductInfo} from '@noctis/api/src/stripe/ProductRegistry';
import type {StripeCheckoutService} from '@noctis/api/src/stripe/services/StripeCheckoutService';
import type {StripePremiumService} from '@noctis/api/src/stripe/services/StripePremiumService';
import type {StripeSubscriptionService} from '@noctis/api/src/stripe/services/StripeSubscriptionService';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import {mapUserToPrivateResponse} from '@noctis/api/src/user/UserMappers';
import * as RandomUtils from '@noctis/api/src/utils/RandomUtils';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import {UserPremiumTypes} from '@noctis/constants/src/UserConstants';
import {CannotRedeemStellarWithVisionaryError} from '@noctis/errors/src/domains/payment/CannotRedeemStellarWithVisionaryError';
import {GiftCodeAlreadyRedeemedError} from '@noctis/errors/src/domains/payment/GiftCodeAlreadyRedeemedError';
import {StripeError} from '@noctis/errors/src/domains/payment/StripeError';
import {StripeGiftRedemptionInProgressError} from '@noctis/errors/src/domains/payment/StripeGiftRedemptionInProgressError';
import {UnknownGiftCodeError} from '@noctis/errors/src/domains/payment/UnknownGiftCodeError';
import {UnknownUserError} from '@noctis/errors/src/domains/user/UnknownUserError';
import {seconds} from 'itty-time';
import type Stripe from 'stripe';

export class StripeGiftService {
	constructor(
		private stripe: Stripe | null,
		private userRepository: IUserRepository,
		private cacheService: ICacheService,
		private gatewayService: IGatewayService,
		private checkoutService: StripeCheckoutService,
		private premiumService: StripePremiumService,
		private subscriptionService: StripeSubscriptionService,
	) {}

	async getGiftCode(code: string): Promise<GiftCode> {
		const giftCode = await this.userRepository.findGiftCode(code);
		if (!giftCode) {
			throw new UnknownGiftCodeError();
		}
		return giftCode;
	}

	async redeemGiftCode(userId: UserID, code: string): Promise<void> {
		const inflightKey = `gift_redeem_inflight:${code}`;
		const appliedKey = `gift_redeem_applied:${code}`;

		if (await this.cacheService.get<boolean>(appliedKey)) {
			throw new GiftCodeAlreadyRedeemedError();
		}
		if (await this.cacheService.get<boolean>(inflightKey)) {
			throw new StripeGiftRedemptionInProgressError();
		}
		await this.cacheService.set(inflightKey, seconds('1 minute'));

		try {
			const giftCode = await this.userRepository.findGiftCode(code);
			if (!giftCode) {
				throw new UnknownGiftCodeError();
			}

			if (giftCode.redeemedByUserId) {
				await this.cacheService.set(appliedKey, seconds('365 days'));
				throw new GiftCodeAlreadyRedeemedError();
			}

			if (await this.cacheService.get<boolean>(`redeemed_gift_codes:${code}`)) {
				await this.cacheService.set(appliedKey, seconds('365 days'));
				throw new GiftCodeAlreadyRedeemedError();
			}

			const user = await this.userRepository.findUnique(userId);
			if (!user) {
				throw new UnknownUserError();
			}

			this.checkoutService.validateUserCanPurchase(user);

			if (user.premiumType === UserPremiumTypes.LIFETIME) {
				throw new CannotRedeemStellarWithVisionaryError();
			}

			const redeemResult = await this.userRepository.redeemGiftCode(code, userId);
			if (!redeemResult.applied) {
				throw new GiftCodeAlreadyRedeemedError();
			}

			const premiumType = giftCode.durationMonths === 0 ? UserPremiumTypes.LIFETIME : UserPremiumTypes.SUBSCRIPTION;
			if (premiumType === UserPremiumTypes.LIFETIME && user.stripeSubscriptionId && this.stripe) {
				await this.cancelStripeSubscriptionImmediately(user);
			}

			if (premiumType === UserPremiumTypes.SUBSCRIPTION && user.stripeSubscriptionId && this.stripe) {
				await this.subscriptionService.extendSubscriptionWithGiftTrial(user, giftCode.durationMonths, code);
			} else if (premiumType === UserPremiumTypes.LIFETIME && giftCode.visionarySequenceNumber != null) {
				const GIFT_CODE_SENTINEL_USER_ID = createUserID(-1n);
				await this.userRepository.unreserveVisionarySlot(giftCode.visionarySequenceNumber, GIFT_CODE_SENTINEL_USER_ID);
				await this.premiumService.grantPremiumFromGift(
					userId,
					premiumType,
					giftCode.durationMonths,
					giftCode.visionarySequenceNumber,
				);
				await this.userRepository.reserveVisionarySlot(giftCode.visionarySequenceNumber, userId);
			} else {
				await this.premiumService.grantPremium(userId, premiumType, giftCode.durationMonths, null, false);
			}

			await this.cacheService.set(`redeemed_gift_codes:${code}`, seconds('5 minutes'));
			await this.cacheService.set(appliedKey, seconds('365 days'));

			Logger.debug({userId, giftCode: code, durationMonths: giftCode.durationMonths}, 'Gift code redeemed');
		} finally {
			await this.cacheService.delete(inflightKey);
		}
	}

	async getUserGifts(userId: UserID): Promise<Array<GiftCode>> {
		const gifts = await this.userRepository.findGiftCodesByCreator(userId);
		return gifts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	async prepareGiftCode(
		checkoutSessionId: string,
		purchaser: User,
		productInfo: ProductInfo,
		paymentIntentId: string | null,
	): Promise<string> {
		const payment = await this.userRepository.getPaymentByCheckoutSession(checkoutSessionId);
		if (!payment) {
			Logger.error({checkoutSessionId}, 'Payment not found for gift code creation');
			throw new StripeError('Payment not found for gift code creation');
		}

		if (payment.giftCode) {
			Logger.debug({checkoutSessionId, code: payment.giftCode}, 'Gift code already exists for checkout session');
			return payment.giftCode;
		}
		if (paymentIntentId) {
			const existingGift = await this.userRepository.findGiftCodeByPaymentIntent(paymentIntentId);
			if (existingGift) {
				await this.userRepository.linkGiftCodeToCheckoutSession(existingGift.code, checkoutSessionId);
				Logger.warn(
					{checkoutSessionId, paymentIntentId, code: existingGift.code},
					'Reused existing gift code for checkout session',
				);
				return existingGift.code;
			}
		}

		const code = await this.generateUniqueGiftCode();

		await this.userRepository.createGiftCode({
			code,
			duration_months: productInfo.durationMonths,
			created_at: new Date(),
			created_by_user_id: purchaser.id,
			redeemed_at: null,
			redeemed_by_user_id: null,
			stripe_payment_intent_id: paymentIntentId,
			visionary_sequence_number: null,
			checkout_session_id: checkoutSessionId,
			version: 1,
		});

		await this.userRepository.linkGiftCodeToCheckoutSession(code, checkoutSessionId);

		Logger.debug(
			{code, purchaserId: purchaser.id, durationMonths: productInfo.durationMonths, productType: productInfo.type},
			'Gift code prepared',
		);

		return code;
	}

	async finaliseGiftCode(purchaserId: UserID): Promise<void> {
		const currentUser = await this.userRepository.findUnique(purchaserId);
		if (!currentUser) {
			Logger.error({userId: purchaserId}, 'Purchaser not found for gift finalisation');
			return;
		}
		const updatedUser = await this.userRepository.patchUpsert(
			purchaserId,
			{
				gift_inventory_server_seq: (currentUser.giftInventoryServerSeq ?? 0) + 1,
			},
			currentUser.toRow(),
		);
		await this.dispatchUser(updatedUser);
	}

	private async generateUniqueGiftCode(): Promise<string> {
		let code: string;
		let exists = true;

		while (exists) {
			code = RandomUtils.randomString(32);
			const existing = await this.userRepository.findGiftCode(code);
			exists = !!existing;
		}

		return code!;
	}

	private async cancelStripeSubscriptionImmediately(user: User): Promise<void> {
		if (!this.stripe) {
			throw new StripeError('Stripe client not available for immediate cancellation');
		}
		if (!user.stripeSubscriptionId) {
			throw new StripeError('User missing subscription id for immediate cancellation');
		}
		await this.stripe.subscriptions.cancel(user.stripeSubscriptionId, {invoice_now: false, prorate: false});
		const updatedUser = await this.userRepository.patchUpsert(
			user.id,
			{
				stripe_subscription_id: null,
				premium_billing_cycle: null,
				premium_will_cancel: false,
			},
			user.toRow(),
		);
		await this.dispatchUser(updatedUser);
		Logger.debug({userId: user.id}, 'Canceled active subscription due to lifetime grant');
	}

	private async dispatchUser(user: User): Promise<void> {
		await this.gatewayService.dispatchPresence({
			userId: user.id,
			event: 'USER_UPDATE',
			data: mapUserToPrivateResponse(user),
		});
	}
}
