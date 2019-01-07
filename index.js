const errorHandler = (res, err, req) => {
	if (err.code === 'auth/argument-error') {
		res.status(401).json({ errors: [{ type: 'Authentication required' }] });
	} else {
		res.status(500).json({ errors: [{ type: 'Server Error' }] });
	}
};

const extractToken = function (req) {
	return req.headers.authorization;
};

const missingToken = function (res) {
	res.status(401).json({ errors: [{ type: 'Authentication required' }] });
	return Promise.resolve();
};

let assignTokenToRequest = function (req, token) {
	req.authZToken = token;
};

const getFunction = function (options, defaultFunction) {
	const functionName = defaultFunction.name;
	if (options !== undefined
		&& options !== null
		&& functionName in options
		&& typeof options[functionName] === 'function') {

		return options[functionName]
	} else {
		return defaultFunction;
	}
};

const verification = (idToken, admin) => admin.auth().verifyIdToken(idToken);

module.exports = function (admin, options) {

	const errorHandlerFn = getFunction(options, errorHandler);
	const extractTokenFn = getFunction(options, extractToken);
	const assignTokenToRequestFn = getFunction(options, assignTokenToRequest);
	const missingTokenFn = getFunction(options, missingToken);
	const verificationFn = getFunction(options, verification);

	return function verifyToken(req, res, next) {
		const authZToken = extractTokenFn(req);
		if (!authZToken) {
			return missingTokenFn(res);
		}

		return verificationFn(authZToken, admin)
			.then(token => {
				assignTokenToRequestFn(req, token);
				next();
			})
			.catch(err => errorHandlerFn(res, err, req));
	}
};