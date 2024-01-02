import needle from "needle";
import {
  TaskPjsFile,
  TaskStatus,
  TaskType,
  TwitchIntegrity,
  getTaskResult,
} from "./types";
import { randomString, wait } from "kappa-helper";

export default class Salamoonder {
  private apiKey: string;
  private salamoonderUrl: string = "https://salamoonder.com/api";
  private twitchUrl: string = "https://gql.twitch.tv";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  //#region Salamoonder Api
  public async getBalance(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      // endpoint disabled
      return resolve(0);

      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/getBalance`,
          {
            api_key: this.apiKey,
          }
        );
        console.log(response.body);
        resolve(response.body.balance);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async solveCaptcha(site: TaskPjsFile): Promise<getTaskResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/createTask`,
          {
            api_key: this.apiKey,
            task: {
              type: TaskType.KASADA_CAPTCHA_SOLVER,
              pjs: site,
            },
          },
          {
            json: true,
          }
        );

        const taskId = response.body.taskId;

        if (response.body.error_code !== 0) {
          return reject(response.body.error_description);
        }

        let task = await this.getTask(taskId);

        while (task.status == TaskStatus.PENDING) {
          await wait(1000);

          task = await this.getTask(taskId);
        }

        if (task.solution) task.solution.type = "KasadaCaptchaSolver";

        resolve(task);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async registerTwitchAccount(email: string): Promise<getTaskResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/createTask`,
          {
            api_key: this.apiKey,
            task: {
              type: TaskType.TWITCH_REGISTER_ACCOUNT,
              email: email,
            },
          },
          {
            json: true,
          }
        );

        const taskId = response.body.taskId;

        if (response.body.error_code !== 0) {
          return reject(response.body.error_description);
        }

        let task = await this.getTask(taskId);

        while (task.status == TaskStatus.PENDING) {
          await wait(1000);

          task = await this.getTask(taskId);
        }

        if (task.solution) task.solution.type = "TwitchRegisterAccount";

        resolve(task);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async checkTwitchIntegrity(token: string): Promise<getTaskResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/createTask`,
          {
            api_key: this.apiKey,
            task: {
              type: TaskType.TWITCH_CHECK_INTEGRITY,
              token: token,
            },
          },
          {
            json: true,
          }
        );

        const taskId = response.body.taskId;

        if (response.body.error_code !== 0) {
          return reject(response.body.error_description);
        }

        let task = await this.getTask(taskId);

        while (task.status == TaskStatus.PENDING) {
          await wait(1000);

          task = await this.getTask(taskId);
        }

        if (task.solution) task.solution.type = "TwitchCheckIntegrity";

        resolve(task);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async getTask(taskId: string): Promise<getTaskResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/getTaskResult`,
          {
            taskId: taskId,
          },
          {
            json: true,
          }
        );
        if (response.body.errorId && response.body.errorId !== 0) {
          return reject(response.body.message ?? "Unknown error");
        }

        resolve(response.body);
      } catch (error) {
        reject(error);
      }
    });
  }
  //#endregion

  //#region Twitch Api

  public async generateIntegrity(
    oauth: string = "",
    clientId: string = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    deviceId: string = randomString(32).toString(),
    sessionId: string = randomString(16).toString(),
    requestId: string = randomString(32).toString()
  ): Promise<TwitchIntegrity> {
    return new Promise(async (resolve, reject) => {
      try {
        const solved = await this.solveCaptcha(TaskPjsFile.TWITCH);

        if (solved instanceof Error) {
          return reject(solved);
        }

        if (solved.errorId !== 0) {
          return reject(new Error(solved.message));
        }

        if (!solved.solution) {
          return reject(new Error("No solution"));
        }

        if (solved.solution.type !== "KasadaCaptchaSolver") {
          return reject(new Error("Invalid solution type"));
        }

        const response = await needle(
          "post",
          `${this.twitchUrl}/integrity`,
          {},
          {
            json: true,
            headers: {
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9",
              Authorization: oauth ? `OAuth ${oauth}` : "",
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
              "User-Agent": solved.solution["user-agent"],
              "X-Device-Id": deviceId,
              "sec-ch-ua":
                '"Not/A)Brand";v="99", "Brave";v="115", "Chromium";v="115"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "x-kpsdk-cd": solved.solution["x-kpsdk-cd"],
              "x-kpsdk-ct": solved.solution["x-kpsdk-ct"],
              "x-kpsdk-v": "j-0.0.0",
            },
          }
        );

        if (response instanceof Error) {
          return reject(response);
        }

        const integrity = {
          clientId: clientId,
          token: response.body.token,
          sessionId: sessionId,
          userAgent: solved.solution["user-agent"],
          deviceId: deviceId,
          oauth: oauth,
        };

        resolve(integrity);
      } catch (error) {
        reject(error);
      }
    });
  }

  //#endregion
}
