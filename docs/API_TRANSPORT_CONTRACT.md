# HTTP transport contract (prototype)

The current prototype is an Express API mounted at `/api/v1` in `server/src/app.js`. Successful endpoints return `{ "data": ... }`; errors returned by `errorHandler` use `{ "error": { "code", "message", "details" } }`. The client Axios interceptor unwraps `data` and converts the error envelope to an `Error` carrying `code`, `details`, and `status`.

This is a current implementation reference, not a durable Android contract. The intended Android direction is local domain operations and persistence; the transport can be retired or replaced. Do not infer authentication or remote multi-user support from the API.

## Routes

| Method and path | Current behavior / success |
| --- | --- |
| `GET /properties` | List properties, 200. |
| `POST /properties` | Insert `name`, `address`, 201. |
| `PATCH /properties/:id` | Replace/update `name`, `address`, 200; missing ID maps `PROPERTY_NOT_FOUND`/404. |
| `GET /properties/:id/occupancy?date=` | Occupancy projection, 200; missing property 404. |
| `POST /floors`, `/rooms`, `/beds` | Create structure item, 201. |
| `DELETE /floors/:id`, `/rooms/:id`, `/beds/:id` | Delete subject to workflow guards, 200 success envelope. |
| `PATCH /beds/:id/toggle-active` | Set active flag, 200; missing bed 404. |
| `GET /tenants` | Tenant directory with query filters, 200. |
| `POST /tenants/move-in` | Move in, 201. |
| `POST /tenants/:id/shift-bed` | Shift assignment, 200. |
| `POST /tenants/:id/checkout` | Checkout, 200. |
| `POST /tenants/:id/collect-payment` | Record collection, 200. |
| `POST /tenants/:id/settle-deposit`, `POST /deposits/:id/settle` | Settle deposit, 200. |
| `GET /tenants/:id/ledger` | Tenant ledger, 200; missing tenant 404. |
| `GET /financials/summary?propertyId=&date=` | Financial projection, 200. |

Unknown routes return 404 `ROUTE_NOT_FOUND`. Known domain errors map through a status-code table in `server/src/middleware/errorHandler.js`; unmapped errors become 500 `INTERNAL_SERVER_ERROR` and hide their original message. The status map is incomplete and currently includes `CHECKOUT_DATE_BEFORE_START_DATE` although the checkout workflow emits `CHECKOUT_DATE_MUST_BE_AFTER_START_DATE`; therefore that checkout validation is presently mapped as 500. This is a transport mapping issue, distinct from domain rejection.

## Client transport

`client/src/api/httpClient.js` uses `/api/v1`, JSON content type, 10-second timeout and unwraps/normalizes the envelopes. Vite proxies `/api` to `http://localhost:4000` in development. `server/src/app.js` currently installs permissive `cors()`; authentication, authorization, tenant isolation and production deployment controls are not implemented here. Their required security boundary depends on whether/when a remote service is intended.
