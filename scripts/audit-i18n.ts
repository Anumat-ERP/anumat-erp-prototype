import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { km } from '../src/i18n/messages';

// List files with Node itself so the audit runs without ripgrep installed.
const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.tsx')).map((f) => `src/${f.replaceAll('\\', '/')}`);
const uiProps = new Set(['title', 'subtitle', 'heading', 'description', 'label', 'placeholder', 'caption', 'aria-label', 'helperText', 'queryPlaceholder', 'queryLabel', 'emptyLabel', 'content', 'legend', 'header', 'singular', 'plural']);
// Brand names, CSS classes and semantic HTML tags are intentionally not translated.
const literalsToKeep = new Set(['Lotus Logistics', 'text-2xl font-semibold tracking-tight', 'text-xl font-semibold', 'text-lg font-semibold', 'text-md font-medium', 'h2', 'h3', 'h4']);
const uncovered = new Map<string, string[]>();
for (const file of files) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function record(value: string, node: ts.Node) {
    const key = value.replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-z]/.test(key) || literalsToKeep.has(key) || Object.hasOwn(km, key)) return;
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    uncovered.set(key, [...(uncovered.get(key) ?? []), `${file}:${line}`]);
  }
  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) record(node.getText(source), node);
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && uiProps.has(node.name.getText(source))) record(node.initializer.text, node);
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && uiProps.has(node.name.getText(source))) record(node.initializer.text, node);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'tr' && node.arguments[0]) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first)) record(first.text, node);
      if (ts.isConditionalExpression(first)) {
        if (ts.isStringLiteral(first.whenTrue)) record(first.whenTrue.text, node);
        if (ts.isStringLiteral(first.whenFalse)) record(first.whenFalse.text, node);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const [key, locations] of uncovered) console.log(JSON.stringify({ key, locations }));
if (uncovered.size) process.exitCode = 1;
