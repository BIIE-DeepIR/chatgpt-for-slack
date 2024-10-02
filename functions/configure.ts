import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  EventTrigger,
  ModalView,
  SlackAPIClient,
} from "slack-web-api-client/mod.ts";

export const def = DefineFunction({
  callback_id: "configure",
  title: "Manage event triggers for ChatGPT App",
  source_file: "functions/configure.ts",
  input_parameters: {
    properties: {
      discussWorkflowId: { type: Schema.types.string },
    },
    required: [
      "discussWorkflowId",
    ],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

export default SlackFunction(def, async ({ inputs, token, env }) => {
  const client = new SlackAPIClient(token);
  const debugMode = isDebugMode(env);

  try {
  // If the trigger already exists, we update it.
  // Otherwise, we create a new one.
  const messageTriggerToUpdate = await findTriggerToUpdate(
    client,
    "message_posted",
    inputs.discussWorkflowId,
    debugMode,
  );
  // If the trigger already exists, we update it.
  // Otherwise, we create a new one.
  await createOrUpdateDirectMessageTrigger(
    client,
    inputs.discussWorkflowId,
    debugMode,
    messageTriggerToUpdate,
  );
  } catch (e) {
    console.log(e);
    modalMessage = e;
  }

  return {
    // Set this to continue the interaction with this user
    completed: false,
  };
})

// ------------------------------
// Common utilities
// ------------------------------

export function isDebugMode(env: Record<string, string>) {
  if (env.DEBUG_MODE) {
    return env.DEBUG_MODE === "true";
  }
  return true;
}

export async function findTriggerToUpdate(
  client: SlackAPIClient,
  eventType: string,
  workflowCallbackId: string,
  debugMode: boolean,
): Promise<EventTrigger | undefined> {
  // Check the existing triggers for this workflow
  const allTriggers = await client.workflows.triggers.list({ is_owner: true });
  let triggerToUpdate = undefined;

  // find the trigger to update
  if (allTriggers.triggers) {
    for (const trigger of allTriggers.triggers) {
      if (
        trigger.type === "event" &&
        trigger.workflow.callback_id === workflowCallbackId &&
        trigger.event_type === `slack#/events/${eventType}`
      ) {
        triggerToUpdate = trigger;
      }
    }
  }
  if (debugMode) {
    console.log(`The trigger to update: ${JSON.stringify(triggerToUpdate)}`);
  }
  return triggerToUpdate;
}


// ------------------------------
// Direct Message (DM) Trigger
// ------------------------------

// Define inputs for the DM trigger
const dmTriggerInputs = {
  channel_id: { value: "{{data.channel_id}}" },
  user_id: { value: "{{data.user_id}}" },
  message_ts: { value: "{{data.message_ts}}" },
  text: { value: "{{data.text}}" },
};

// Function to create or update the DM trigger
export async function createOrUpdateDirectMessageTrigger(
  client: SlackAPIClient,
  workflowCallbackId: string,
  debugMode: boolean,
  triggerToUpdate?: EventTrigger,
) {
  let userData = await client.users.list();
  let dmChannelIds = [];
  for (const infoSet of userData.members) {
      if (!infoSet.is_bot && infoSet.is_email_confirmed) {
          let response = await client.conversations.open({users: infoSet.id});
          dmChannelIds.push(response.channel.id);
      }
  }
  if (triggerToUpdate === undefined) {
    // Create a new DM trigger
    const creation = await client.workflows.triggers.create({
      type: "event",
      name: "direct_message event trigger",
      workflow: `#/workflows/${workflowCallbackId}`,
      event: {
        event_type: "slack#/events/message_posted",
        channel_ids: dmChannelIds,
        filter: { version: 1, root: { statement: "1 == 1" } },
      },
      inputs: dmTriggerInputs,
    });
    if (creation.error) {
      throw new Error(
        `Failed to create a direct message trigger! (response: ${JSON.stringify(creation)})`,
      );
    }
    console.log(`A new DM trigger created: ${JSON.stringify(creation)}`);
  } else {
    // Update the existing DM trigger
    const update = await client.workflows.triggers.update({
      trigger_id: triggerToUpdate.id,
      type: "event",
      name: "direct_message event trigger",
      workflow: `#/workflows/${workflowCallbackId}`,
      event: {
        event_type: "slack#/events/message_posted",
        channel_ids: dmChannelIds,
        filter: { version: 1, root: { statement: "1 == 1" } },
      },
      inputs: dmTriggerInputs,
    });
    if (update.error) {
      throw new Error(
        `Failed to update the direct message trigger! (response: ${JSON.stringify(update)})`,
      );
    }
    console.log(`The DM trigger updated: ${JSON.stringify(update)}`);
  }
}
