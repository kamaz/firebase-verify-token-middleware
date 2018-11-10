# Purpose

Because there always has to be a purpose and repeating the same code is lame. Idea behind it simple tool is to make it simple to reject request that don't have id token provided by firebase.

# Support

At the moment NodeJS >= 8

# Under the hood

Nothing sophisticated it extracts token from a request and uses firebase `admin.auth().verifyToken(...)` to verify token.

By default it will use `Authorization` header to get token but this can be changed by created a custom function to extract token. See examples below.

# Example

## Default
```js
const verifyToken = verifyTokenInit(admin)

app.post('/', verifyToken, (req, res) => res.send('All OK'));
```

## Customisation

It has been written using open/close principle so hopefully you should be able to change anything.

|Option| Description|
| ---- | -----------|
| errorHandler| Overrides error handling when token validation fails. See also `missingToken` | 
| missingToken | Override response returned when token is missing. See also `errorHandler`|
| assignTokenToRequest| Overrides how token is assign to a request object. By default uses `authZToken` token. Maybe that is not the best name and probably will change in future. |
| extractToken | Overrides how token is extracted from a request object. | 

Example:
```js
const verifyToken = verifyTokenInit(admin, {
	extractToken(req) {
		return req.headers.authorization.split(' ')[1];
	}
});

app.post('/', verifyToken, (req, res) => res.send('All OK'));
```

For more details refer to `index.test.js` under `customisation` describe.


# Custom Request Property

After a verification of an id token the token in put on a `authZToken` property of a request. 


# TODO

- [ ] Add rollup.js
