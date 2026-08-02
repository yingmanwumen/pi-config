import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const Params = Type.Object({
  question: Type.String({ description: "Question to ask the user" }),
  options: Type.Array(Type.String(), {
    description: "Options the user can choose from",
    minItems: 1,
  }),
  allowOther: Type.Optional(
    Type.Boolean({ description: "Allow free-form input" }),
  ),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "ask_question",
    label: "Ask Question",
    description:
      "Ask the user a question and wait for an answer. Use this when a decision or missing requirement needs user input.",
    promptSnippet: "Ask the user a question when input is needed to proceed",
    parameters: Params,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!ctx.hasUI) {
        return {
          content: [
            { type: "text", text: "User interaction is unavailable in this mode." },
          ],
          details: { question: params.question, answer: null },
        };
      }

      const options = params.allowOther
        ? [...params.options, "Other..."]
        : params.options;
      const selected = await ctx.ui.select(params.question, options);

      if (selected === undefined) {
        return {
          content: [{ type: "text", text: "The user cancelled the question." }],
          details: { question: params.question, answer: null },
        };
      }

      const answer =
        selected === "Other..."
          ? await ctx.ui.input("Your answer:")
          : selected;
      if (answer === undefined || answer.trim() === "") {
        return {
          content: [{ type: "text", text: "The user cancelled the question." }],
          details: { question: params.question, answer: null },
        };
      }

      return {
        content: [{ type: "text", text: `User answered: ${answer}` }],
        details: { question: params.question, answer },
      };
    },
  });
}
