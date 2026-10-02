import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files=execFileSync('rg',['--files','src/pages','src/components','src/layout','-g','*.tsx'],{encoding:'utf8'}).trim().split('\n');
const allowed=new Set(['title','subtitle','heading','description','label','placeholder','caption','aria-label','helperText','queryPlaceholder','queryLabel','emptyLabel','content','legend','header','primaryAction','secondaryActions','action','filters','appliedFilters']);
for(const file of files){
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node:ts.Node){
  if(ts.isJsxExpression(node)&&node.expression){
   const attr=ts.isJsxAttribute(node.parent)?node.parent.name.getText(source):null;
   if(attr===null||allowed.has(attr)){
    const scan=(part:ts.Node)=>{
     if(ts.isCallExpression(part)&&part.expression.getText(source)==='tr')return;
     if(ts.isConditionalExpression(part))for(const branch of [part.whenTrue,part.whenFalse]) if(ts.isStringLiteral(branch)&&/[A-Za-z]/.test(branch.text)){
      const line=source.getLineAndCharacterOfPosition(branch.getStart(source)).line+1;
      console.log(JSON.stringify({file,line,type:'literal',key:branch.text}));
     }
     if(ts.isTemplateExpression(part)&&/[A-Za-z]/.test(part.head.text+part.templateSpans.map(s=>s.literal.text).join(''))){
      const line=source.getLineAndCharacterOfPosition(part.getStart(source)).line+1;
      console.log(JSON.stringify({file,line,type:'template',key:part.getText(source)}));
     }
     ts.forEachChild(part,scan);
    };
    scan(node.expression);
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(source);
}
