export enum TaskType {
  GET_BALANCE = "getBalance",
  KASADA_CAPTCHA_SOLVER = "KasadaCaptchaSolver",
  TWITCH_SCRAPER = "Twitch_Scraper",
  TWITCH_CHECKINTEGRITY = "Twitch_CheckIntegrity",
  TWITCH_PUBLICINTEGRITY = "Twitch_PublicIntegrity",
  TWITCH_LOCALINTEGRITY = "Twitch_LocalIntegrity",
  TWITCH_REGISTERACCOUNT = "Twitch_RegisterAccount",
}

export enum PjsFile {
  TWITCH = "https://k.twitchcdn.net/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  NIKE = "https://www.nike.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  KICK = "https://kick.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  CANADAGOOSE = "https://www.canadagoose.com/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/p.js",
  CUSTOM = "custom",
}

export type Task = {
  type: TaskType;

  // KasadaCaptchaSolver
  pjs?: string;

  // CheckIntegrity
  token?: string;

  // PublicIntegrity
  access_token?: string;
  proxy?: string; // LocalIntegrity

  // RegisterAccount
  email?: string;
};

export type CreateTaskResponse = {
  error_code: number;
  error_description: string;
  taskId: string;
};

// only to be used for getBalance, since there is no taskId
export type ExtendedCreateTaskResponse = {
  wallet: string;
  taskId?: string;
} & CreateTaskResponse;

export type KasadaCaptchaSolverSolution = {
  type: "KasadaCaptchaSolver";
  "user-agent": string;
  "x-kpsdk-cd": string;
  "x-kpsdk-cr": string;
  "x-kpsdk-ct": string;
  "x-kpsdk-r": string;
  "x-kpsdk-st": string;
};

export type TwitchScraperSolution = {
  type: "Twitch_Scraper";
  biography: string;
  profile_picture: string;
  username: string;
};

export type TwitchCheckIntegritySolution = {
  type: "Twitch_CheckIntegrity";
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

export type TwitchPublicIntegritySolution = {
  type: "Twitch_PublicIntegrity";
  device_id: string;
  integrity_token: string;
  proxy: string;
  "user-agent": string;
};

export type TwitchLocalIntegritySolution = {
  type: "Twitch_LocalIntegrity";
  device_id: string;
  integrity_token: string;
  proxy: string;
  "user-agent": string;
};

export type TwitchRegisterAccountSolution = {
  type: "Twitch_RegisterAccount";
  access_token: string;
  password: string;
  username: string;
};

export type ErrorSolution = {
  type: "Error";
  failed: string;
};

export type Solution =
  | KasadaCaptchaSolverSolution
  | TwitchScraperSolution
  | TwitchCheckIntegritySolution
  | TwitchPublicIntegritySolution
  | TwitchLocalIntegritySolution
  | TwitchRegisterAccountSolution
  | ErrorSolution;

export type GetTaskResponse = {
  type: TaskType;
  errorId: number;
  solution: Solution;
  status: string;
};

export type TwitchIntegrity = {
    clientId: string;
    token: string;
    sessionId: string;
    userAgent: string;
    deviceId: string;
  };
  
