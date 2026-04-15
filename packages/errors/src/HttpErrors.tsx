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

import {APIErrorCodes} from '@noctis/constants/src/ApiErrorCodes';
import {HttpStatus} from '@noctis/constants/src/HttpConstants';
import {NoctisError, type NoctisErrorData} from '@noctis/errors/src/NoctisError';

interface HttpErrorOptions {
	code?: string;
	message?: string;
	data?: NoctisErrorData;
	headers?: Record<string, string>;
	cause?: Error;
}

export class BadRequestError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.BAD_REQUEST,
			message: options.message ?? 'Bad Request',
			status: HttpStatus.BAD_REQUEST,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'BadRequestError';
	}
}

export class UnauthorizedError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.UNAUTHORIZED,
			message: options.message ?? 'Unauthorized',
			status: HttpStatus.UNAUTHORIZED,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'UnauthorizedError';
	}
}

export class ForbiddenError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.FORBIDDEN,
			message: options.message ?? 'Forbidden',
			status: HttpStatus.FORBIDDEN,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'ForbiddenError';
	}
}

export class NotFoundError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.NOT_FOUND,
			message: options.message ?? 'Not Found',
			status: HttpStatus.NOT_FOUND,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'NotFoundError';
	}
}

export class MethodNotAllowedError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.METHOD_NOT_ALLOWED,
			message: options.message ?? 'Method Not Allowed',
			status: HttpStatus.METHOD_NOT_ALLOWED,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'MethodNotAllowedError';
	}
}

export class ConflictError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.CONFLICT,
			message: options.message ?? 'Conflict',
			status: HttpStatus.CONFLICT,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'ConflictError';
	}
}

export class GoneError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.GONE,
			message: options.message ?? 'Gone',
			status: HttpStatus.GONE,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'GoneError';
	}
}

export class InternalServerError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.INTERNAL_SERVER_ERROR,
			message: options.message ?? 'Internal Server Error',
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'InternalServerError';
	}
}

export class NotImplementedError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.NOT_IMPLEMENTED,
			message: options.message ?? 'Not Implemented',
			status: HttpStatus.NOT_IMPLEMENTED,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'NotImplementedError';
	}
}

export class ServiceUnavailableError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.SERVICE_UNAVAILABLE,
			message: options.message ?? 'Service Unavailable',
			status: HttpStatus.SERVICE_UNAVAILABLE,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'ServiceUnavailableError';
	}
}

export class BadGatewayError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.BAD_GATEWAY,
			message: options.message ?? 'Bad Gateway',
			status: HttpStatus.BAD_GATEWAY,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'BadGatewayError';
	}
}

export class GatewayTimeoutError extends NoctisError {
	constructor(options: HttpErrorOptions = {}) {
		super({
			code: options.code ?? APIErrorCodes.GATEWAY_TIMEOUT,
			message: options.message ?? 'Gateway Timeout',
			status: HttpStatus.GATEWAY_TIMEOUT,
			data: options.data,
			headers: options.headers,
			cause: options.cause,
		});
		this.name = 'GatewayTimeoutError';
	}
}
