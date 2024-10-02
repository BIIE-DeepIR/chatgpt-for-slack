import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { def as configure } from "../functions/configure.ts";
import { default as discuss } from "./discuss.ts";

/**
 * A workflow for configuring where to run the ChatGPT workflow.
 * End-users can easily update the channel list in the Slack UI.
 */
const workflow = DefineWorkflow({
  callback_id: "configurator",
  title: "Configure ChatGPT app in channels",
});

// Handle the interaction with the end-user who invoked this workflow
// This app's trigger information will be updated runtime
workflow.addStep(configure, {
  discussWorkflowId: discuss.definition.callback_id,
});

export default workflow;
