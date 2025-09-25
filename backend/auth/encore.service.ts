import { Service } from "encore.dev/service";
import { Gateway } from "encore.dev/api";
import { auth } from "./auth";

export default new Service("auth");

// Configure the API gateway to use the auth handler
export const gateway = new Gateway({ authHandler: auth });
