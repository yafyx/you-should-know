import fs from "fs";
import { parse } from "@babel/parser";
import _t from "@babel/traverse";
import _g from "@babel/generator";
const traverse = _t.default, generate = _g.default;
const src = fs.readFileSync(process.argv[2], "utf8").split("\n");
const start = src.findIndex((l) => l.startsWith("var xt = {"));
const end = src.findIndex((l) => l.startsWith("var Tn = !1;"));
let body = src.slice(start, end).join("\n")
  .replace('var At = { plugin: "cc-plugin-you-should-know", key: "aboutOpen" };', "var At = { plugin: bue, key: \"aboutOpen\" };")
  .replace("var ne = `/plugin disable ${bue}@builtin`;", "var ne = `/plugin disable ${bue}@${MARKETPLACE}`;")
  .replace("h(l, { hotkey: t, plain: !0, dimColor: n, role: i, onPress: r }, o)", "h(l, { key: `choice-${t}`, label: o, hotkey: t, plain: !0, dimColor: n, role: i, onPress: r })");
const head = `const bue = "you-should-know";
const MARKETPLACE = "ysk-clone";
const h = (c, p, ...k) => c({ ...p, children: k.flat().filter((x) => x !== void 0 && x !== null && x !== !1) });
`;
const tail = `\nexport function register(on) {\n  os(on);\n}\n`;
const ast = parse(head + body + tail, { sourceType: "module" });
const tele = new Set(["pe"]);
const teleNodes = new Set();
traverse(ast, {
  VariableDeclarator(p) {
    const i = p.node.init;
    if (i?.type === "ArrowFunctionExpression" && i.body.type === "CallExpression" && i.body.callee.name === "pe") { tele.add(p.node.id.name); teleNodes.add(p.node); }
  },
});
let n = 0;
traverse(ast, {
  CallExpression(p) {
    const c = p.node.callee;
    const isTele = (id) => id.type === "Identifier" && (id.name === "pe" ? !p.scope.hasBinding("pe") || p.scope.getBinding("pe").path.isFunctionDeclaration() : teleNodes.has(p.scope.getBinding(id.name)?.path.node));
    if (isTele(c)) {
      n++;
      const par = p.parentPath;
      if (par.isAwaitExpression()) par.replaceWithSourceString("void 0");
      else p.replaceWithSourceString("void 0");
      return;
    }
    if (c.type === "MemberExpression" && c.property.name === "then" && p.node.arguments.length === 1 && isTele(p.node.arguments[0])) {
      n++; p.replaceWith(c.object);
    }
  },
});
traverse(ast, {
  VariableDeclarator(p) { if (teleNodes.has(p.node)) p.remove(); },
  FunctionDeclaration(p) { if (p.node.id.name === "pe") p.remove(); },
  ExpressionStatement(p) { const e = p.node.expression; if (e.type === "UnaryExpression" && e.operator === "void") p.remove(); },
  SequenceExpression(p) { p.node.expressions = p.node.expressions.filter((e, i, a) => i === a.length - 1 || !(e.type === "UnaryExpression" && e.operator === "void")); if (p.node.expressions.length === 1) p.replaceWith(p.node.expressions[0]); },
});
traverse(ast, {
  ReturnStatement(p) { const a = p.node.argument; if (a?.type === "CallExpression" && a.callee.name === "dr") p.node.argument = null; },
  VariableDeclarator(p) { const i = p.node.init; if (i?.type === "CallExpression" && ["lr", "Mt"].includes(i.callee.name)) { p.remove(); return; } if (p.node.id?.name === "M" && i?.type === "NullLiteral") p.remove(); },
  AssignmentExpression(p) { const r = p.node.right; if (r.type === "CallExpression" && r.callee.name === "Mt") p.parentPath.isExpressionStatement() ? p.parentPath.remove() : p.remove(); },
});
traverse(ast, { ForOfStatement(p) { if (p.node.body.type === "BlockStatement" && p.node.body.body.length === 0) p.remove(); } });
console.error("telemetry calls removed:", n, [...tele]);
fs.writeFileSync("stage.js", generate(ast, { comments: false }).code);
