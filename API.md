# API

All routes are under `/api`, and request and response bodies are JSON. Timestamps are ISO 8601 UTC strings. Birth dates are `YYYY-MM-DD`.

## Authentication

Signing up or logging in sets an httpOnly `bt_session` cookie. Routes marked **auth** return `401` without a valid one.

## Errors

Every error has this body. Use the HTTP status to tell errors apart.

```json
{ "error": "Email or password is incorrect" }
```

## Auth

### `POST /auth/signup`

Body: `{ name, email, password }`. The password must be at least 8 characters.

Returns `201 { user }` and sets the cookie.

| Status | When |
|---|---|
| `400` | A field is missing or invalid |
| `409` | The email is already in use |

### `POST /auth/login`

Body: `{ email, password }`.

Returns `200 { user }` and sets the cookie.

| Status | When |
|---|---|
| `400` | A field is missing |
| `401` | The email or password is wrong |

### `POST /auth/logout`

Returns `204` and clears the cookie.

### `GET /auth/user` (auth)

Returns `200 { user }`.

**`user`**

```json
{ "id": "uuid", "name": "Sam", "email": "sam@example.com" }
```

## Children

### `GET /children` (auth)

Lists the children the user has access to, sorted by name.

```json
{
  "children": [
    {
      "id": "uuid",
      "name": "Robin",
      "birthDate": "2026-08-14",
      "role": "owner",
      "lastFeedAt": "2026-10-31T14:05:00.000Z",
      "lastDiaperAt": null
    }
  ]
}
```

`role` is the current user's role for that child: `owner` or `caregiver`. `lastFeedAt` and `lastDiaperAt` are `null` until an event of that type is logged.

### `POST /children` (auth)

Body: `{ name, birthDate }`. `name` is at most 100 characters. `birthDate` is optional.

Creates the child and makes the current user its owner.

Returns `201 { child }`:

```json
{ "child": { "id": "uuid", "name": "Robin", "birthDate": "2026-08-14", "role": "owner" } }
```

| Status | When |
|---|---|
| `400` | The name is missing or too long, or the birth date is invalid |

## Invites

Codes are 8 characters, single use, and expire after 48 hours.

### `POST /children/:id/invites` (auth, owner only)

Returns `201 { invite }`:

```json
{ "invite": { "code": "K7WM2QXP", "expiresAt": "2026-11-02T14:05:00.000Z" } }
```

| Status | When |
|---|---|
| `403` | The user is a caregiver, not an owner |
| `404` | The child doesn't exist, or the user has no access to it |

### `POST /invites/accept` (auth)

Body: `{ code }`. Case-insensitive; surrounding spaces are ignored.

Gives the current user access to the child, with the role set on the invite.

Returns `200 { child }`, in the same shape as `POST /children`.

| Status | When |
|---|---|
| `400` | The code is missing |
| `404` | The code is unknown, expired, revoked or already used |
| `409` | The user already has access to this child. The code stays usable. |
