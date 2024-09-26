import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPIClient } from "slack-web-api-client/mod.ts";
import {
  API_KEY_ERROR,
  buildSystemMessage,
  calculateNumTokens,
  callOpenAI,
  Message,
  OpenAIModel,
} from "./openai.ts";

export const def = DefineFunction({
  callback_id: "answer",
  title: "Answer a question",
  source_file: "functions/quick_reply.ts",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      user_id: { type: Schema.slack.types.user_id },
      question: { type: Schema.types.string },
      message_ts: { type: Schema.types.string },
    },
    required: ["channel_id", "user_id", "question"],
  },
  output_parameters: {
    properties: { answer: { type: Schema.types.string } },
    required: ["answer"],
  },
});

export default SlackFunction(def, async ({ inputs, env, token }) => {
  const client = new SlackAPIClient(token);
  const authTest = await client.auth.test();
  const thisAppBotUserId = authTest.user_id;
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(API_KEY_ERROR);
    return { error: API_KEY_ERROR };
  }
  const messages: Message[] = [];
//   messages.push({ role: "user", content: "You're helping out scientists over Slack. Please format your answers in Slack-compatible markdown (e.g. no headers, tables, footnotes, HTML tags. Bold works with single asterisk.)." });
  messages.push({
      "role": "user",
      "content": inputs.question.replaceAll("<@[^>]+>\s*", ""),
    })

  const model = env.OPENAI_MODEL
    ? env.OPENAI_MODEL as OpenAIModel
    : OpenAIModel.GPT_3_5_TURBO;
  const maxTokensForThisReply = 1024;
  const modelLimit = model === OpenAIModel.GPT_4 ? 6000 : 4000;
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
    text: `${answer}`,
    thread_ts: inputs.message_ts,
    mrkdwn: true,
    metadata: {
      "event_type": "chat-gpt-convo",
      "event_payload": { "question": inputs.question },
    },
  });
  if (replyResponse.error) {
    const error =
      `Failed to post ChatGPT's reply due to ${replyResponse.error}`;
    return { error };
  }
  return { outputs: { answer } };
});
