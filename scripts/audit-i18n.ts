import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { km } from '../src/i18n/messages';

// List product files with Node itself. Storybook docs and illustrative fixtures are not product copy.
const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter((f) => (/\.tsx?$/.test(f) && !f.endsWith('.d.ts') && !f.replaceAll('\\', '/').startsWith('stories/'))).map((f) => `src/${f.replaceAll('\\', '/')}`);
const uiProps = new Set(['title', 'subtitle', 'heading', 'description', 'label', 'placeholder', 'caption', 'aria-label', 'helperText', 'helpText', 'queryPlaceholder', 'queryLabel', 'emptyLabel', 'content', 'legend', 'header', 'singular', 'plural']);
// Brand names, CSS classes and semantic HTML tags are intentionally not translated.
const literalsToKeep = new Set(['Lotus Logistics', '⌘K', 'text-2xl font-semibold tracking-tight', 'text-xl font-semibold', 'text-lg font-semibold', 'text-md font-medium', 'h2', 'h3', 'h4']);
const uncovered = new Map<string, string[]>();
for (const file of files) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function record(value: string, node: ts.Node) {
    const key = value.replace(/\s+/g, ' ').trim();
    if (/^(?:PR|CT|LV|EX)-\d+$/.test(key)) return;
    if (!key || !/[A-Za-z]/.test(key) || literalsToKeep.has(key) || Object.hasOwn(km, key)) return;
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    uncovered.set(key, [...(uncovered.get(key) ?? []), `${file}:${line}`]);
  }
  function recordLiteralBranches(node: ts.Node) {
    if (ts.isStringLiteral(node)) record(node.text, node);
    if (ts.isConditionalExpression(node)) {
      recordLiteralBranches(node.whenTrue);
      recordLiteralBranches(node.whenFalse);
    }
  }
  function visit(node: ts.Node) {
    if (file === 'src/hr/JobDescription.tsx' && ts.isCallExpression(node) && ['text', 'number'].includes(node.expression.getText(source)) && node.arguments[1] && ts.isStringLiteral(node.arguments[1])) record(node.arguments[1].text, node);
    if (file === 'src/hr/CandidateProfile.tsx' && ts.isCallExpression(node) && ['text', 'section'].includes(node.expression.getText(source)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) record(node.arguments[0].text, node);
    if (file.includes('Recruitment') && ts.isCallExpression(node) && ['text', 'select'].includes(node.expression.getText(source)) && node.arguments[1] && ts.isStringLiteral(node.arguments[1])) record(node.arguments[1].text, node);
    if (file === 'src/hr/RecruitmentWorkspace.tsx' && ts.isVariableDeclaration(node) && node.name.getText(source) === 'tabs') {
      const value = ts.isAsExpression(node.initializer!) ? node.initializer.expression : node.initializer;
      if (value && ts.isArrayLiteralExpression(value)) for (const item of value.elements) if (ts.isArrayLiteralExpression(item) && ts.isStringLiteral(item.elements[1])) record(item.elements[1].text, item);
    }
    // HR schemas and lifecycle validators use indirect translation keys.
    if ((file.startsWith('src/hr/') || ['src/lib/meetings.ts','src/lib/workflowCompletion.ts','src/lib/commercial.ts'].includes(file)) && ts.isReturnStatement(node) && node.expression && ts.isStringLiteral(node.expression)) record(node.expression.text, node.expression);
    if (file.startsWith('src/hr/') && ts.isNewExpression(node) && node.expression.getText(source) === 'Error' && node.arguments?.[0] && ts.isStringLiteral(node.arguments[0])) record(node.arguments[0].text, node.arguments[0]);
    if (['src/hr/catalog.ts', 'src/hr/engine.ts', 'src/hr/presentation.ts'].includes(file) && ts.isVariableDeclaration(node) && ['COLLECTION_NAMES', 'NEW_NAMES', 'STATUS_NAMES', 'OP_NAMES', 'REPORT_DEFINITIONS', 'HR_COLLECTION_HELP'].includes(node.name.getText(source)) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) record(property.initializer.text, property.initializer);
    if (ts.isJsxText(node)) record(node.getText(source), node);
    if (ts.isJsxAttribute(node) && node.initializer && uiProps.has(node.name.getText(source))) {
      if (ts.isStringLiteral(node.initializer)) record(node.initializer.text, node);
      if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const expression = node.initializer.expression;
        if (ts.isStringLiteral(expression)) record(expression.text, expression);
        if (ts.isConditionalExpression(expression)) {
          if (ts.isStringLiteral(expression.whenTrue)) record(expression.whenTrue.text, expression.whenTrue);
          if (ts.isStringLiteral(expression.whenFalse)) record(expression.whenFalse.text, expression.whenFalse);
        }
      }
    }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && uiProps.has(node.name.getText(source))) record(node.initializer.text, node);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'tr' && node.arguments[0]) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first)) record(first.text, node);
      if (ts.isConditionalExpression(first)) recordLiteralBranches(first);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const [key, locations] of uncovered) console.log(JSON.stringify({ key, locations }));
if (uncovered.size) process.exitCode = 1;
