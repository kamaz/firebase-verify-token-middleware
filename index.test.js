const verifyTokenInit = require('./index');

const adminMock = {
	accept(value) {
		this._expectedToken = value;
		return this;
	},
	reset() {
		delete this._expectedToken;
		delete this._serverError;
	},
	auth() {
		return this;
	},
	serverError() {
		this._serverError = true;
		return this;
	},
	verifyIdToken(token) {
		if (token === undefined) throw 'token has to be there';
		if (this._serverError) {
			return Promise.reject({ code: 'server/error' });
		}
		if (this._expectedToken !== token) {
			return Promise.reject({ code: 'auth/argument-error' });
		}
		return Promise.resolve('decodedToken');
	}
};

const resMock = {

	status(status) {
		this._status = status;
		return this;
	},

	json(data) {
		this._data = data;
		return this;
	},

	reset() {
		delete this._data;
		delete this._status;
	}

};

describe('vefiryTokenInit', () => {

	beforeEach(() => {
		adminMock.reset();
		resMock.reset();
	});

	it('moves to next middleware and adds token to req', async () => {
		const verifyToken = verifyTokenInit(adminMock.accept('idToken'));
		const moveToNext = jest.fn();
		const req = { headers: { authorization: 'idToken' } };

		await verifyToken(req, resMock, moveToNext);

		expect(moveToNext).toBeCalled();
		expect(req.authZToken).toBe('decodedToken');
		expect(resMock._status).toBeUndefined();
	});

	it('returns 401 when token expired', async () => {
		const verifyToken = verifyTokenInit(adminMock.accept('idToken'));
		const moveToNext = jest.fn();
		const req = { headers: { authorization: 'invalidToken' } };

		await verifyToken(req, resMock, moveToNext);

		expect(moveToNext).not.toBeCalled();
		expect(req.authZToken).toBeUndefined();
		expect(resMock._status).toBe(401);
		expect(resMock._data).toEqual({ errors: [{ type: 'Authentication required' }] });
	});

	it('returns 401 when header does not have authorization header', async () => {
		const verifyToken = verifyTokenInit(adminMock.accept('idToken'));
		const moveToNext = jest.fn();
		const req = { headers: {} };

		await verifyToken(req, resMock, moveToNext);

		expect(moveToNext).not.toBeCalled();
		expect(req.authZToken).toBeUndefined();
		expect(resMock._status).toBe(401);
		expect(resMock._data).toEqual({ errors: [{ type: 'Authentication required' }] });
	});

	it('returns 500 on different error then authorization', async () => {
		const verifyToken = verifyTokenInit(adminMock.accept('idToken').serverError());
		const moveToNext = jest.fn();
		const req = { headers: { authorization: 'idToken' } };

		await verifyToken(req, resMock, moveToNext);

		expect(moveToNext).not.toBeCalled();
		expect(req.authZToken).toBeUndefined();
		expect(resMock._status).toBe(500);
		expect(resMock._data).toEqual({ errors: [{ type: 'Server Error' }] });
	});

	describe('customisation', () => {

		it('allows to change error handler', async () => {
			const verifyToken = verifyTokenInit(adminMock.accept('idToken'), {
				errorHandler(res) {
					res.status(418).json({});
				}
			});
			const moveToNext = jest.fn();
			const req = { headers: { authorization: 'invalidToken' } };

			await verifyToken(req, resMock, moveToNext);

			expect(moveToNext).not.toBeCalled();
			expect(req.authZToken).toBeUndefined();
			expect(resMock._status).toBe(418);
			expect(resMock._data).toEqual({});
		});

		it('allows to change extraction of the authorization header', async () => {

			const verifyToken = verifyTokenInit(adminMock.accept('idToken'), {
				extractToken(req) {
					return req.headers.authorization.split(' ')[1];
				}
			});
			const moveToNext = jest.fn();
			const req = { headers: { authorization: 'Bearer idToken' } };

			await verifyToken(req, resMock, moveToNext);

			expect(moveToNext).toBeCalled();
			expect(req.authZToken).toBe('decodedToken');
			expect(resMock._status).toBeUndefined();

		});

		it('allows to change assigning token to request', async () => {
			const verifyToken = verifyTokenInit(adminMock.accept('idToken'), {
				assignTokenToRequest(req, token) {
					req.myToken = token;
				}
			});
			const moveToNext = jest.fn();
			const req = { headers: { authorization: 'idToken' } };

			await verifyToken(req, resMock, moveToNext);

			expect(moveToNext).toBeCalled();
			expect(req.myToken).toBe('decodedToken');
			expect(resMock._status).toBeUndefined();
		});

		it('allows to change missing token response', async () => {
			const verifyToken = verifyTokenInit(adminMock.accept('idToken'), {
				missingToken(res) {
					res.status(418).json({});
				}
			});
			const moveToNext = jest.fn();
			const req = { headers: {} };

			await verifyToken(req, resMock, moveToNext);

			expect(moveToNext).not.toBeCalled();
			expect(req.authZToken).toBeUndefined();
			expect(resMock._status).toBe(418);
			expect(resMock._data).toEqual({});

		});

	});

});