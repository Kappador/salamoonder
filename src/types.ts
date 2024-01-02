export enum TaskType {
  KASADA_CAPTCHA_SOLVER = "KasadaCaptchaSolver",
  TWITCH_REGISTER_ACCOUNT = "TwitchRegisterAccount",
  TWITCH_CHECK_INTEGRITY = "TwitchCheckIntegrity",
}

export enum TaskPjsFile {
  TWITCH = "https://k.twitchcdn.net/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  NIKE = "https://www.nike.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  KICK = "https://kick.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  CANADAGOOSE = "https://www.canadagoose.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
}

// debugging to see which actually exist lol
export enum TaskStatus {
  READY = "ready",
  PENDING = "PENDING",
}

export type KasadaCaptchaSolverSolution = {
  type: "KasadaCaptchaSolver";
  "user-agent": string;
  "x-kpsdk-cd": string;
  "x-kpsdk-cr": string;
  "x-kpsdk-ct": string;
  "x-kpsdk-r": string;
  "x-kpsdk-st": string;
};

export type TwitchRegisterAccountSolution = {
  type: "TwitchRegisterAccount";
  access_token: string;
  password: string;
  username: string;
};

export type TwitchCheckIntegritySolution = {
  type: "TwitchCheckIntegrity";
  client_id: string;
  client_ip: string;
  device_id: string;
  exp: string;
  iat: string;
  is_bad_bot: string;
  iss: string;
  nbf: string;
  user_id: string;
};

export type ErrorSolution = {
  type: "Error";
  failed: string;
};

export type createTaskRequest = {
  api_key: string;
  task: {
    type: TaskType;

    // kasada captcha solver
    pjs?: TaskPjsFile;

    // twitch register account
    email?: string;

    // twitch check integrity
    token?: string;
  };
};

export type createTaskResult = {
  error_code: number;
  error_description: string;
  taskId: string;
};

export type getTaskRequest = {
  api_key: string;
  taskId: string;
};

export type getTaskResult = {
  errorId?: number;
  solution?:
    | KasadaCaptchaSolverSolution
    | TwitchRegisterAccountSolution
    | TwitchCheckIntegritySolution
    | ErrorSolution;

  message?: string;

  status: TaskStatus;
};

// Twitch Stuff

export type TwitchIntegrity = {
  clientId: string;
  token: string;
  sessionId: string;
  userAgent: string;
  deviceId: string;
};
