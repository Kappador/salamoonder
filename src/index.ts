import needle, { NeedleResponse } from "needle";

function genString(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export type Request = {
  url: string;
  apiKey: string;
  body?: any;
};

export type Response = {
  status: number;
  data: Solution | Boolean | Error;
};

export type Balance = {
  balance: number;
  currency: string;
};

export type Solution = {
  cd: string;
  st: string;
  ct: string;
  cr: string;
  user_agent: string;
};

export type Integrity = {
  requestId: string;
  sessionId: string;
  deviceId: string;
  userAgent: string;
  clientId: string;
  token: string;
  oauth?: string;
};

export default class Wrapper {
  key: string;
  url: string;

  constructor(key: string, url: string = "https://salamoonder.com/api") {
    this.key = key;
    this.url = url;
  }

  callApi(request: Request): Promise<NeedleResponse | Error> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          request.url,
          {
            api_key: request.apiKey,
            ...request.body,
          },
          { json: true }
        );
        switch (response.statusCode) {
          case 200:
            resolve(response);
            break;
          case 400:
            reject(new Error("Bad request"));
            break;
          case 401:
            reject(new Error("Unauthorized"));
            break;
          case 500:
            reject(new Error("Internal server error"));
            break;
          default:
            reject(new Error("Unknown error"));
            break;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  isTokenFlagged(token: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.callApi({
          url: `${this.url}/twitch/validate_integrity`,
          apiKey: this.key,
          body: {
            token: token,
          },
        });

        if (response instanceof Error) {
          return reject(response);
        }

        if (response.body.success === "TOKEN_NOT_FLAGGED") {
          return resolve({
            status: 200,
            data: false,
          });
        }

        if (response.body.success === "TOKEN_FLAGGED") {
          return resolve({
            status: 200,
            data: true,
          });
        }

        reject(new Error("Unknown error"));
      } catch (error) {
        reject(error);
      }
    });
  }

  solveIntegrity(): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.callApi({
          url: `${this.url}/kasada/solver`,
          apiKey: this.key,
        });
        console.log("weird");
        if (response instanceof Error) {
          return reject(response);
        }

        if (response.body.error) {
          return reject(new Error(response.body.error));
        }

        const solution: Solution = {
          cd: response.body["x-kpsdk-cd"],
          st: response.body["x-kpsdk-st"],
          ct: response.body["x-kpsdk-ct"],
          cr: response.body["x-kpsdk-cr"],
          user_agent: response.body["user-agent"],
        };

        resolve({
          status: 200,
          data: solution,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  generateIntegrity(
    oauth = "",
    clientId = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    deviceId = genString(32),
    sessionId = genString(16),
    requestId = genString(32)
  ): Promise<Integrity> {
    return new Promise(async (resolve, reject) => {
      const solved = await this.solveIntegrity();

      if (
        solved instanceof Error ||
        solved.data instanceof Boolean ||
        solved.data instanceof Error
      ) {
        return reject(solved);
      }

      const response = await needle(
        "post",
        `https://gql.twitch.tv/integrity`,
        {},
        {
          json: true,
          headers: {
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
            Authorization: `OAuth ${oauth}`,
            "Cache-Control": "no-cache",
            "Client-Id": clientId,
            "Client-Request-Id": requestId,
            "Client-Session-Id": sessionId,
            Origin: "https://www.twitch.tv",
            Pragma: "no-cache",
            Referer: "https://www.twitch.tv/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "Sec-GPC": "1",
            "User-Agent": solved.data.user_agent,
            "X-Device-Id": deviceId,
            "sec-ch-ua":
              '"Not/A)Brand";v="99", "Brave";v="115", "Chromium";v="115"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "x-kpsdk-cd": solved.data.cd,
            "x-kpsdk-ct": solved.data.ct,
            "x-kpsdk-v": "j-0.0.0",
          },
        }
      );

      if (response instanceof Error) {
        return reject(response);
      }

      if (response.statusCode !== 200) {
        return reject(new Error("Unknown error"));
      }

      const token = response.body.token;

      const integrity: Integrity = {
        requestId: requestId,
        sessionId: sessionId,
        deviceId: deviceId,

        userAgent: solved.data.user_agent,
        clientId: clientId,
        oauth: oauth,

        token: token,
      };

      resolve(integrity);
    });
  }

  getBalance(): Promise<Balance | Error> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.url}/getbalance`,
          {
            api_key: this.key,
          },
          { json: true }
        );

        const chars = response.body.balance.split("");
        let balance = "";
        let currency = "";

        for (let i = 0; i < chars.length; i++) {
          if (chars[i].match(/[0-9]/) || chars[i] === ".") {
            balance += chars[i];
          } else {
            currency += chars[i];
          }
        }

        switch (response.statusCode) {
          case 200:
            resolve({
              balance: parseFloat(balance),
              currency: currency,
            });
            break;
          case 400:
            reject(new Error("Bad request"));
            break;
          case 401:
            reject(new Error("Unauthorized"));
            break;
          case 500:
            reject(new Error("Internal server error"));
            break;
          default:
            reject(new Error("Unknown error"));
            break;
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
