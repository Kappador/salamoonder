import needle from "needle";
import { randomString, wait } from "kappa-helper";
import {
  CreateTaskResponse,
  GetTaskResponse,
  PjsFile,
  Task,
  TaskType,
  KasadaCaptchaSolverSolution,
  ExtendedCreateTaskResponse,
  TwitchScraperSolution,
  TwitchCheckIntegritySolution,
  TwitchRegisterAccountSolution,
  Solution,
  TwitchIntegrity,
} from "./types";

export default class Salamoonder {
  private apiKey: string;
  private salamoonderUrl: string = "https://salamoonder.com/api";
  private twitchUrl: string = "https://gql.twitch.tv";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private createTask(task: Task): Promise<CreateTaskResponse> {
    return new Promise<CreateTaskResponse>(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/createTask`,
          {
            api_key: this.apiKey,
            task,
          },
          {
            json: true,
          }
        );
        resolve(response.body);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getTaskResult(taskId: string): Promise<GetTaskResponse> {
    return new Promise<GetTaskResponse>(async (resolve, reject) => {
      try {
        const response = await needle(
          "post",
          `${this.salamoonderUrl}/getTaskResult`,
          {
            api_key: this.apiKey,
            taskId,
          },
          {
            json: true,
          }
        );
        resolve(response.body);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getTaskResultFinal(taskId: string): Promise<GetTaskResponse> {
    return new Promise<GetTaskResponse>(async (resolve, reject) => {
      let retries = 0;

      let response = await this.getTaskResult(taskId);
      while (response.status != "ready") {
        if (retries > 5) {
          return reject("Too many retries");
        }

        await wait(1000);
        response = await this.getTaskResult(taskId);

        retries++;
      }
      resolve(response);
    });
  }

  private getSolution(task: Task): Promise<Solution> {
    return new Promise<Solution>(async (resolve, reject) => {
      const response = await this.createTask(task);

      if (response.error_code !== 0) {
        return reject(response.error_description);
      }

      const result = await this.getTaskResultFinal(response.taskId);

      if (result.errorId != 0) {
        return reject(result.solution);
      }

      if (result.solution.type == "Error") {
        return reject(result.solution);
      }

      resolve(result.solution);
    });
  }

  public getBalance(): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      try {
        const response = (await this.createTask({
          type: TaskType.GET_BALANCE,
        })) as ExtendedCreateTaskResponse;
        resolve(parseFloat(response.wallet));
      } catch (error) {
        reject(error);
      }
    });
  }

  public solveCaptcha(
    pjs: PjsFile,
    url?: string
  ): Promise<KasadaCaptchaSolverSolution> {
    return new Promise<KasadaCaptchaSolverSolution>(async (resolve, reject) => {
      let file = pjs.toString();
      if (pjs === PjsFile.CUSTOM && url) {
        file = url;
      }

      const task: Task = {
        type: TaskType.KASADA_CAPTCHA_SOLVER,
        pjs: file,
      };

      const response = await this.getSolution(task);

      response.type = "KasadaCaptchaSolver";
      if (response.type != "KasadaCaptchaSolver") {
        return reject("Wrong solution type");
      }

      resolve(response);
    });
  }

  public scrapeTwitch(): Promise<TwitchScraperSolution> {
    return new Promise<TwitchScraperSolution>(async (resolve, reject) => {
      const task: Task = {
        type: TaskType.TWITCH_SCRAPER,
      };

      const response = await this.createTask(task);

      if (response.error_code !== 0) {
        return reject(response.error_description);
      }

      const result = await this.getTaskResultFinal(response.taskId);

      if (result.errorId != 0) {
        return reject(result.solution);
      }

      if (result.solution.type == "Error") {
        return reject(result.solution);
      }

      result.solution.type = "Twitch_Scraper";

      if (result.solution.type != "Twitch_Scraper") {
        return reject("Wrong solution type");
      }

      resolve(result.solution);
    });
  }

  public checkTwitchIntegrity(
    token: string
  ): Promise<TwitchCheckIntegritySolution> {
    return new Promise<TwitchCheckIntegritySolution>(
      async (resolve, reject) => {
        const task: Task = {
          type: TaskType.TWITCH_CHECKINTEGRITY,
          token,
        };

        const result = await this.getSolution(task);

        result.type = "Twitch_CheckIntegrity";

        if (result.type != "Twitch_CheckIntegrity") {
          return reject("Wrong solution type");
        }

        resolve(result);
      }
    );
  }

  // implement integrity generation via salamoonder
  public async generateIntegrity(
    oauth: string = "",
    clientId: string = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    deviceId: string = randomString(32).toString(),
    sessionId: string = randomString(16).toString(),
    requestId: string = randomString(32).toString()
  ): Promise<TwitchIntegrity> {
    return new Promise(async (resolve, reject) => {
      try {

        const solved = await this.solveCaptcha(PjsFile.TWITCH);

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
              "User-Agent": solved["user-agent"],
              "X-Device-Id": deviceId,
              "sec-ch-ua":
                '"Not/A)Brand";v="99", "Brave";v="115", "Chromium";v="115"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "x-kpsdk-cd": solved["x-kpsdk-cd"],
              "x-kpsdk-ct": solved["x-kpsdk-ct"],
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
          userAgent: solved["user-agent"],
          deviceId: deviceId,
          oauth: oauth,
        };

        resolve(integrity);
      } catch (error) {
        reject(error);
      }
    });
  }

  public registerTwitchAccount(
    email: string
  ): Promise<TwitchRegisterAccountSolution> {
    return new Promise<TwitchRegisterAccountSolution>(
      async (resolve, reject) => {
        const task: Task = {
          type: TaskType.TWITCH_REGISTERACCOUNT,
          email,
        };

        const result = await this.getSolution(task);

        result.type = "Twitch_RegisterAccount";

        if (result.type != "Twitch_RegisterAccount") {
          return reject("Wrong solution type");
        }

        resolve(result);
      }
    );
  }
}
