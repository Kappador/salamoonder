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
  IntegrityGenerateType,
  IntegrityLocal,
  IntegrityPublic,
  IntegritySelf,
} from "./types";

export default class Salamoonder {
  private apiKey: string;
  private salamoonderUrl: string = "https://salamoonder.com/api";
  private twitchUrl: string = "https://gql.twitch.tv";
  private support: boolean = false;
  private appId: string = "appsr-kappador-c209-deda-055d-49b7a498";

  constructor(apiKey: string, support: boolean = true) {
    this.apiKey = apiKey;
    this.support = support;
  }

  private createTask(task: Task): Promise<CreateTaskResponse> {
    return new Promise<CreateTaskResponse>(async (resolve, reject) => {
      try {
        const body: {
          api_key: string;
          task: Task;
          app_id?: string;
        } = {
          api_key: this.apiKey,
          task,
        };

        if (this.support) {
          body["app_id"] = this.appId;
        }

        const response = await needle(
          "post",
          `${this.salamoonderUrl}/createTask`,
          body,
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

  private getTaskResultFinal(
    taskId: string,
    retries: number
  ): Promise<GetTaskResponse> {
    return new Promise<GetTaskResponse>(async (resolve, reject) => {
      let nowRetries = 0;

      let response = await this.getTaskResult(taskId);
      while (response.status != "ready") {
        if (nowRetries > retries) {
          return reject("Too many retries");
        }

        await wait(1000);
        response = await this.getTaskResult(taskId);

        nowRetries++;
      }
      resolve(response);
    });
  }

  private getSolution(task: Task, retries: number = 10): Promise<Solution> {
    return new Promise<Solution>(async (resolve, reject) => {
      const response = await this.createTask(task);

      if (response.error_code !== 0) {
        return reject(response.error_description);
      }

      const result = await this.getTaskResultFinal(response.taskId, 15);

      if (result.errorId != 0) {
        return reject(result.solution);
      }

      if (result.solution.type == "Error") {
        return reject(result.solution);
      }

      resolve(result.solution);
    });
  }

  private checkProxy(proxy: string): boolean {
    const regex = /[A-Za-z0-9]+:[A-Za-z0-9]+@[A-Za-z0-9.]+:[0-9]+/i;
    return regex.test(proxy);
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
    url?: string,
    retries: number = 10
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

      const response = await this.getSolution(task, retries);

      response.type = TaskType.KASADA_CAPTCHA_SOLVER;
      if (response.type != TaskType.KASADA_CAPTCHA_SOLVER) {
        return reject("Wrong solution type");
      }

      resolve(response);
    });
  }

  public scrapeTwitch(retries: number = 10): Promise<TwitchScraperSolution> {
    return new Promise<TwitchScraperSolution>(async (resolve, reject) => {
      const task: Task = {
        type: TaskType.TWITCH_SCRAPER,
      };

      const response = await this.createTask(task);

      if (response.error_code !== 0) {
        return reject(response.error_description);
      }

      const result = await this.getTaskResultFinal(response.taskId, retries);

      if (result.errorId != 0) {
        return reject(result.solution);
      }

      if (result.solution.type == "Error") {
        return reject(result.solution);
      }

      result.solution.type = TaskType.TWITCH_SCRAPER;

      if (result.solution.type != TaskType.TWITCH_SCRAPER) {
        return reject("Wrong solution type");
      }

      resolve(result.solution);
    });
  }

  public checkTwitchIntegrity(
    token: string,
    retries: number = 10
  ): Promise<TwitchCheckIntegritySolution> {
    return new Promise<TwitchCheckIntegritySolution>(
      async (resolve, reject) => {
        const task: Task = {
          type: TaskType.TWITCH_CHECKINTEGRITY,
          token,
        };

        const result = await this.getSolution(task, retries);

        result.type = TaskType.TWITCH_CHECKINTEGRITY;

        if (result.type != TaskType.TWITCH_CHECKINTEGRITY) {
          return reject("Wrong solution type");
        }

        resolve(result);
      }
    );
  }

  public generateIntegrity(
    type: IntegrityGenerateType,
    data: IntegrityPublic | IntegrityLocal | IntegritySelf,
    retries: number = 10
  ): Promise<TwitchIntegrity> {
    if (data.proxy && !this.checkProxy(data.proxy)) {
      return Promise.reject("Invalid proxy | Use user:pass@ip:port");
    }

    switch (type) {
      case IntegrityGenerateType.API_PUBLIC:
        let pub = data as IntegrityPublic;
        return this.generatePublicIntegrity(
          pub.proxy,
          pub.access_token,
          pub.deviceId ?? randomString(16).toString(),
          pub.clientId,
          retries
        );
      case IntegrityGenerateType.API_LOCAL:
        let loc = data as IntegrityLocal;
        return this.generateLocalIntegrity(
          loc.proxy,
          loc.deviceId ?? randomString(16).toString(),
          loc.clientId,
          retries
        );
      case IntegrityGenerateType.SELF:
        let self = data as IntegritySelf;
        return this.generateSelfIntegrity(
          self.proxy,
          self.access_token,
          self.deviceId,
          self.clientId,
          retries
        );
    }
  }

  private generateSelfIntegrity(
    proxy: string = "",
    oauth: string = "",
    deviceId: string = randomString(32).toString(),
    clientId: string = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    retries: number = 10
  ): Promise<TwitchIntegrity> {
    return new Promise(async (resolve, reject) => {
      try {
        const solved = await this.solveCaptcha(PjsFile.TWITCH, undefined, retries);

        const sessionId: string = randomString(16).toString();
        const requestId: string = randomString(32).toString();

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
            proxy: proxy ? "http://" + proxy : "",
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

  private generatePublicIntegrity(
    proxy: string,
    accessToken: string,
    deviceId: string,
    clientId: string = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    retries: number = 10
  ) {
    return new Promise<TwitchIntegrity>(async (resolve, reject) => {
      try {
        const task: Task = {
          type: TaskType.TWITCH_PUBLICINTEGRITY,
          proxy: proxy,
          access_token: accessToken,
          deviceId,
          clientId,
        };

        const response = await this.getSolution(task, retries);

        response.type = TaskType.TWITCH_PUBLICINTEGRITY;
        if (response.type != TaskType.TWITCH_PUBLICINTEGRITY) {
          return reject("Wrong solution type");
        }

        const integrity: TwitchIntegrity = {
          clientId: response["client-id"],
          token: response["integrity_token"],
          userAgent: response["user-agent"],
          deviceId: deviceId,
        };

        resolve(integrity);
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateLocalIntegrity(
    proxy: string,
    deviceId: string,
    clientId: string = "kimne78kx3ncx6brgo4mv6wki5h1ko",
    retries: number = 10
  ) {
    return new Promise<TwitchIntegrity>(async (resolve, reject) => {
      try {
        const task: Task = {
          type: TaskType.TWITCH_LOCALINTEGRITY,
          proxy: proxy,
          deviceId,
          clientId,
        };

        const response = await this.getSolution(task, retries);

        response.type = TaskType.TWITCH_LOCALINTEGRITY;
        if (response.type != TaskType.TWITCH_LOCALINTEGRITY) {
          return reject("Wrong solution type");
        }

        const integrity: TwitchIntegrity = {
          clientId: response["client-id"],
          token: response["integrity_token"],
          userAgent: response["user-agent"],
          deviceId: deviceId,
        };

        resolve(integrity);
      } catch (error) {
        reject(error);
      }
    });
  }

  public registerTwitchAccount(
    email: string,
    retries: number = 10
  ): Promise<TwitchRegisterAccountSolution> {
    return new Promise<TwitchRegisterAccountSolution>(
      async (resolve, reject) => {
        const task: Task = {
          type: TaskType.TWITCH_REGISTERACCOUNT,
          email,
        };

        const result = await this.getSolution(task, retries);

        result.type = TaskType.TWITCH_REGISTERACCOUNT;

        if (result.type != TaskType.TWITCH_REGISTERACCOUNT) {
          return reject("Wrong solution type");
        }

        resolve(result);
      }
    );
  }
}
