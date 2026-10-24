import { expect, mock, test } from "claude-code/testing";

const BAND = {
  plugin: "you-should-know",
  component: "AbovePrompt",
  requestId: "above",
  surface: "terminal",
  viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const;

const LINE = "learn: The retry loop swallows timeouts, so a hung request looks like success.";
const usage = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

function setup(on: any, reply: string, prompts: string[]) {
  const saved = new Map<string, unknown>();
  on("store.get", (_: any, e: any) => ({ value: saved.get(e.key) }));
  on("store.set", (_: any, e: any) => (saved.set(e.key, e.value), { value: undefined }));
  on("session.id", () => ({ value: "s1" }));
  on("session.surfaces", () => ({ value: ["terminal"] }));
  on("session.version", () => ({ value: "2.1.308" }));
  on("env.get", () => ({ value: undefined }));
  on("prompt.read", () => ({ value: { text: "", cursor: 0 } }));
  on("prompt.fill", () => ({ isFilled: true }));
  on("ui.toast", () => ({ value: undefined }));
  on("ui.render", () => ({ type: "Text", props: {}, children: ["claude"] }));
  on("model.fork", (_: any, e: any) => (prompts.push(e.prompt), { value: { isAnswered: true, text: reply, usage } }));
  on("turn.step", async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: "ok", toolUses: [], stopReason: "tool_use", usage: null };
  });
  mock.clock(on);
  return saved;
}

async function steps($: any, n: number) {
  for (let i = 0; i <= n; i++) {
    const s = $.turn.step({ turnId: "t1", index: i, model: "claude-test", messageCount: 1 });
    for await (const _ of s);
  }
  await new Promise((r) => setTimeout(r, 50));
}

test("checks on step 6 with the verbatim prompt and shows the note with 1/2/0", async ($, on) => {
  const prompts: string[] = [];
  const saved = setup(on, LINE, prompts);
  const ui = await $.ui.mount(BAND);
  await steps($, 5);
  expect(prompts.length).toBe(0);
  await steps($, 6);
  expect(prompts.length).toBe(1);
  expect(prompts[0]).toContain("You should know");
  expect(saved.get("seen")).toEqual(["The retry loop swallows timeouts, so a hung request looks like success."]);
  await ui.unmount();
  const ui2 = await $.ui.mount(BAND);
  expect(await ui2.find({ text: /retry loop swallows timeouts/ })).toBeDefined();
  expect(await ui2.find({ key: "choice-1" })).toBeDefined();
  expect(await ui2.find({ key: "choice-2" })).toBeDefined();
  expect(await ui2.find({ key: "choice-0" })).toBeDefined();
  await ui2.press({ key: "choice-2" });
  expect(saved.get("known")).toEqual(["The retry loop swallows timeouts, so a hung request looks like success."]);
  await ui2.unmount();
});

test("learn: none shows nothing", async ($, on) => {
  const prompts: string[] = [];
  const saved = setup(on, "learn: none", prompts);
  const ui = await $.ui.mount(BAND);
  await steps($, 6);
  expect(prompts.length).toBe(1);
  expect(saved.get("seen")).toBeUndefined();
  await ui.unmount();
});
