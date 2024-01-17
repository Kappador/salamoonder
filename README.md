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

### Disclaimer

By default you are supporting me through the usage of my app id. This can be disabled by simply adding `false` as a second parameter when initiating the salamoonder class.

```js
const api = new Salamoonder(process.env.SALAMOONDER_API_KEY, false);
```


## API Calls

### getBalance()

#### Example

```js
api.getBalance().then((bal: number) => {
  console.log(bal);
});
```

#### Returns

```js
number;
```

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

### scrapeTwitch()

Scrapes Twitch for meta data

#### Example

```js
api.scrapeTwitch().then((response: TwitchScraperSolution) => {
  console.log(response);
});
```

#### Returns

```js
{
  errorId: number;
  solution: {
    biography: string;
    profile_picture: string;
    username: string;
  }
  status: "ready" | "pending";
}
```

### generateIntegrity()

Generates an Integrity token.  
Both Salamoonder versions require a proxy with the format `user:password@host:port`

#### Generation methods

##### API_Public

Generation via Salamoonder, with token

##### API_Local

Generation via Salamoonder, no token

##### Self

Generation locally, optionally token & proxy

#### Parameters

- type: Generation Method
- data: Data for each method

#### Example

```js
api
  .generateIntegrity(IntegrityGenerateType.API_PUBLIC, {
    proxy: "test:123@test:3000",
    access_token: "jneapaw1pr0ob83fievedqpi1jqzb4",
  })
  .then((response: TwitchIntegrity) => {
    console.log(response);
  });
```

#### Returns

```js
{
  clientId: string;
  token: string;
  sessionId?: string;
  userAgent: string;
  deviceId: string;
}
```
