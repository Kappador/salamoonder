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

### getBalance()

### solveCaptcha()

### scrapeTwitch()

### checkTwitchIntegrity()

### generateIntegrity()

### registerTwitchAccount()

## Disclaimer

Salamoonder put out a new version, ill be updating everything soon. For now everything is added and working, except the integrity generation via salamoonder, this is still made via solving and then requesting twitch. I will be updating the README as well, when i have more time.
