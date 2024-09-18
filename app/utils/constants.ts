import dotenv from "dotenv";

dotenv.config();

export const prideEmail = "processautomationig@gmail.com";

export const SENDER_EMAIL = "processcordinator28@gmail.com";
// export const SENDER_EMAIL = "base8087@gmail.com";

export const proxyList = [
  `${process.env.PROXY_URL}:10001`,
  `${process.env.PROXY_URL}:10002`,
  `${process.env.PROXY_URL}:10003`,
  `${process.env.PROXY_URL}:10004`,
  `${process.env.PROXY_URL}:10005`,
  `${process.env.PROXY_URL}:10006`,
  `${process.env.PROXY_URL}:10007`,
  `${process.env.PROXY_URL}:10008`,
  `${process.env.PROXY_URL}:10009`,
  `${process.env.PROXY_URL}:10010`,
];
