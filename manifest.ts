import { Manifest } from "deno-slack-sdk/mod.ts";
import Configure from "./workflows/configure.ts";
import QuickReply from "./workflows/quick_reply.ts";
import Discuss from "./workflows/discuss.ts";

export default Manifest({
  name: "ScienceBot",
  description: "Advanced AI assistant to help with science and coding challenges",
  icon: "assets/openai.png",
  workflows: [Configure, QuickReply, Discuss],
  outgoingDomains: ["api.openai.com"],
  features: {
    appHome: {
      messagesTabEnabled: true,
      messagesTabReadOnlyEnabled: false,
    },
  },
  botScopes: [
    "commands",
    "app_mentions:read",
    "chat:write",
    "chat:write.public",
    "channels:join",
    "channels:history",
    "triggers:read",
    "triggers:write",
    "channels:read",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
    "im:write",
    "mpim:history",
    "mpim:read",
    "mpim:write",
    "users:read"
  ],
});
