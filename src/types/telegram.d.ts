declare module "telegram/sessions/index.js" {
  export { StringSession } from "telegram/sessions";
}

declare module "telegram/client/uploads.js" {
  export { CustomFile } from "telegram/client/uploads";
}

declare module "telegram/events/index.js" {
  export { NewMessage, NewMessageEvent } from "telegram/events";
}

declare module "telegram/extensions/Logger" {
  export { LogLevel } from "../../node_modules/telegram/extensions/Logger";
}
