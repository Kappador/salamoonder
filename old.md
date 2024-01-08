# Salamoonder API Wrapper

## Usage

```js
import Salamoonder, { TwitchIntegrity } from "salamoonder";
const api = new Salamoonder(process.env.SALAMOONDER_API_KEY);

try {
  api.generateIntegrity().then((response: TwitchIntegrity) => {
    console.log(response.token);
  });
} catch (error) {
  console.log(error);
}
```

## API Calls

### generateIntegrity()

Generates a new integrity token for Twitch API calls.

#### Parameters

- oauth (optional): OAuth token for the user. If not provided, none will be used
- clientId (optional): Client Id from Twitch. `kimne78kx3ncx6brgo4mv6wki5h1ko` will be used as default
- deviceId (optional): Device Id for your computer. If not provided, a random one will be generated
- sessionId (optional): Session Id. If not provided, a random one will be generated
- requestId (optional): Request Id. If not provided, a random one will be generated

#### Example

```js
api.generateIntegrity().then((response: TwitchIntegrity) => {
  console.log(response.token);
});
```

#### Returns

```js
{
  clientId: string;
  token: string;
  sessionId: string;
  userAgent: string;
  deviceId: string;
}
```

##

### solveCaptcha()

Solves a kasada captcha for a given site.

#### Parameters

- site: Site to solve the captcha for

#### Example (for Twitch)

```js
api.solveCaptcha(TaskPjsFile.TWITCH).then((response: getTaskResult) => {
  console.log(response);
});
```

#### Returns

```js
{
  errorId: number;
  solution: {
    type: string;
    "user-agent": string;
    "x-kpsdk-cd": string;
    "x-kpsdk-cr": string;
    "x-kpsdk-ct": string;
    "x-kpsdk-r": string;
    "x-kpsdk-st": string;
  };
  status: "ready" | "pending";
}
```

##

### registerTwitchAccount()

Registers a new Twitch account.

#### Parameters

- email: Email address for the account

#### Example

```js
api.registerTwitchAccount("test@test.tk").then((response: getTaskResult) => {
  console.log(response);
});
```

#### Returns

```js
{
  errorId: number;
  solution: {
    type: string;
    access_token: string;
    password: string;
    username: string;
  }
  status: "ready" | "pending";
}
```

### checkTwitchIntegrity()

Checks the integrity of a Integrity Token.

#### Parameters

- token: Integrity Token to check

#### Example

### checkTwitchIntegrity()

Checks the integrity of a Integrity Token.

#### Parameters

- token: Integrity Token to check

#### Example

```js
api.checkTwitchIntegrity("token").then((response: getTaskResult) => {
  console.log(response);
});
```

#### Returns

```js
{
  errorId: number;
  solution: {
    type: string;
    client_id: string;
    client_ip: string;
    device_id: string;
    exp: string;
    iat: string;
    is_bad_bot: string;
    iss: string;
    nbf: string;
    user_id: string;
  }
  status: "ready" | "pending";
}
```
