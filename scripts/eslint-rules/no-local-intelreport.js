/**
 * no-local-intelreport ESLint Rule
 *
 * Flags local/deprecated definitions of Intel report shapes (e.g., interfaces named IntelReport or NetRunnerIntelReport)
 * outside the canonical types in src/types/intel/IntelReportUI.ts
 *
 * Phase 0 -> 5 guardrail: migrate all local report interfaces to IntelReportUI / CreateIntelReportInput.
 *
 * Autofix strategy (non-destructive):
 *  1. Suggest replacing the declaration with a comment (preserves file history) – safe default.
 *  2. Alternative: replace with a type alias to IntelReportUI (developer can refine / narrow later).
 *  3. (Future) Inject import automatically if absent.
 */

import path from 'node:path';

const CANONICAL_FILE = path.normalize('src/types/intel/IntelReportUI.ts');

/** Utility: test if filename appears to be canonical intel type file */
function isCanonical(fileName) {
  return fileName.endsWith('IntelReportUI.ts');
}

export const rules = {
  'no-local-intelreport': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow local Intel report interface/type declarations; use IntelReportUI instead',
        recommended: false,
      },
      hasSuggestions: true,
      schema: [],
      messages: {
        localInterface: 'Local Intel report interface "{{name}}" detected. Use IntelReportUI (see integration cookbook).',
        localTypeAlias: 'Local Intel report type alias "{{name}}" detected. Use IntelReportUI (see integration cookbook).',
      }
    },
    create(context) {
      const fileName = context.getFilename();
      if (fileName.includes('node_modules')) return {};
      // Allow canonical file
  if (isCanonical(fileName)) return {};
  // Transitional allowlist: legacy aggregate model scheduled for Phase 5 removal
  if (fileName.replace(/\\/g,'/').includes('/src/models/Intel/IntelReport.ts')) return {};

      function alreadyHasIntelImport(sourceCode) {
        return /\bIntelReportUI\b/.test(sourceCode.getText());
      }

      function buildImportInsertionFix(fixer, sourceCode) {
        if (alreadyHasIntelImport(sourceCode)) return null;
        // Insert after last existing import or at top
        const allText = sourceCode.getText();
        const importMatches = [...allText.matchAll(/^import .*;$/gm)];
        let insertPos = 0;
        if (importMatches.length) {
          const last = importMatches[importMatches.length - 1];
            insertPos = last.index + last[0].length + 1; // newline after
        }
        return fixer.insertTextAfterRange([0, insertPos], `import { IntelReportUI } from 'src/types/intel/IntelReportUI.ts';\n`);
      }

      function reportIfIntelInterface(node, name) {
        if (/^(IntelReport|NetRunnerIntelReport|LegacyIntelReport)$/.test(name)) {
          const sourceCode = context.getSourceCode();
          context.report({
            node,
            messageId: 'localInterface',
            data: { name },
            suggest: [
              {
                desc: 'Comment out local declaration (safest) and migrate to IntelReportUI',
                fix(fixer) {
                  return fixer.replaceText(node, `// Replaced local ${name}; use IntelReportUI (no-local-intelreport autofix)\n// interface ${name} { /* removed */ }`);
                }
              },
              {
                desc: 'Replace with a type alias referencing IntelReportUI',
                fix(fixer) {
                  return fixer.replaceText(node, `type ${name} = IntelReportUI; // TODO: remove once usages updated`);
                }
              },
              {
                desc: 'Insert IntelReportUI import (if missing)',
                fix(fixer) {
                  const importFix = buildImportInsertionFix(fixer, sourceCode);
                  return importFix || null;
                }
              }
            ]
          });
        }
      }

      return {
        TSInterfaceDeclaration(node) {
          if (node.id && node.id.name) {
            reportIfIntelInterface(node, node.id.name);
          }
        },
        TSTypeAliasDeclaration(node) {
          if (node.id && node.id.name && /^(IntelReport|NetRunnerIntelReport|LegacyIntelReport)$/.test(node.id.name)) {
            const sourceCode = context.getSourceCode();
            context.report({
              node,
              messageId: 'localTypeAlias',
              data: { name: node.id.name },
              suggest: [
                {
                  desc: 'Comment out local alias and import IntelReportUI',
                  fix(fixer) {
                    return fixer.replaceText(node, `// Replaced local type ${node.id.name}; use IntelReportUI`);
                  }
                },
                {
                  desc: 'Rewrite alias to IntelReportUI',
                  fix(fixer) {
                    return fixer.replaceText(node, `type ${node.id.name} = IntelReportUI;`);
                  }
                },
                {
                  desc: 'Insert IntelReportUI import (if missing)',
                  fix(fixer) {
                    const importFix = buildImportInsertionFix(fixer, sourceCode);
                    return importFix || null;
                  }
                }
              ]
            });
          }
        }
      };
    }
  }
};

export default { rules };
