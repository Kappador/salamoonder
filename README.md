# Salamoonder API Wrapper

## Usage

```js
import Wrapper, { Integrity } from "./index";
const api = new Wrapper(process.env.SALAMOONDER_API_KEY);

try {
  api.generateIntegrity().then((response: Integrity) => {
    console.log(response.token);
  });
} catch (error) {
  console.log(error);
}
```
