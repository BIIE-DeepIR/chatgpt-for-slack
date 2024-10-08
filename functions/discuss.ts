import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "slack-web-api-client/mod.ts";
import { replyFunction } from "./quick_reply.ts";

import {
  API_KEY_ERROR,
  buildSystemMessage,
  calculateNumTokens,
  callOpenAI,
  Message,
  OpenAIModel,
} from "./openai.ts";

export const def = DefineFunction({
  callback_id: "discuss",
  title: "Discuss a topic in a Slack thread",
  source_file: "functions/discuss.ts",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      user_id: { type: Schema.slack.types.user_id },
      message_ts: { type: Schema.types.string },
      thread_ts: { type: Schema.types.string },
    },
    required: ["channel_id", "message_ts", "user_id"],
  },
  output_parameters: {
    properties: { answer: { type: Schema.types.string } },
    required: [],
  },
});

export default SlackFunction(def, async ({ inputs, env, token }) => {
  const client = new SlackAPIClient(token);

  const authTest = await client.auth.test();
  const thisAppBotUserId = authTest.user_id;
  if (inputs.user_id === thisAppBotUserId) {
    return { outputs: {} };
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(API_KEY_ERROR);
    return { error: API_KEY_ERROR };
  }

  if (!inputs.thread_ts) {
      const original_question = await client.conversations.history({
            channel: inputs.channel_id,
            ts: inputs.message_ts,
            include_all_metadata: true,
            inclusive: true,
            limit: 1,
      });
      if (original_question.messages[0].thread_ts == null) {
          return replyFunction(
              inputs.channel_id,
              inputs.user_id,
              original_question.messages[0].text,
              inputs.message_ts,
              env,
              client
          );
      } else {
          inputs.thread_ts = original_question.messages[0].thread_ts;
      }
  }
  const replies = await client.conversations.replies({
    channel: inputs.channel_id,
    ts: inputs.thread_ts,
    include_all_metadata: true,
    limit: 1000,
  });

  if (replies.error) {
    const error = `Failed to fetch replies in a thread due to ${replies.error}`;
    return { error };
  }
  const messages: Message[] = [];

  let isDiscussion = false;
  for (const message of replies.messages || []) {
    if (
      message.metadata &&
      message.metadata.event_type === "chat-gpt-convo" &&
      message.metadata.event_payload
    ) {
      const question = message.metadata.event_payload.question;
      if (message.user !== thisAppBotUserId) {
        // the top message by a different app such as another dev app
        return { outputs: {} };
      }
      // Append the first question from the user
      isDiscussion = true;
    }
    messages.push({
      role: message.user === thisAppBotUserId ? "assistant" : "user",
      content: message.text || "",
    });
  }

  if (!isDiscussion) {
    return { outputs: {} };
  }

  const model = env.OPENAI_MODEL
    ? env.OPENAI_MODEL as OpenAIModel
    : OpenAIModel.GPT_3_5_TURBO;
  const maxTokensForThisReply = 1024;
  const modelLimit = model === OpenAIModel.GPT_4 ? 100000 : 30000;
  while (calculateNumTokens(messages) > modelLimit - maxTokensForThisReply) {
    messages.shift();
  }

  const body = JSON.stringify({
    "model": model,
    "messages": messages,
  });
  console.log(body);

  let answer = await callOpenAI(apiKey, 60, body);
  answer = answer.replace(/#/g, '*');
  answer = answer.replace(/\*\*/g, '*');
  answer = answer.replace(/\*\s\*/g, '*');
  answer = answer.replace(/\*\*/g, '*');
  const replyResponse = await client.chat.postMessage({
    channel: inputs.channel_id,
    thread_ts: inputs.thread_ts,
    text: answer,
  });
  if (replyResponse.error) {
    const error =
      `Failed to post ChatGPT's reply due to ${replyResponse.error}`;
    return { error };
  }
  return { outputs: { answer } };
});
