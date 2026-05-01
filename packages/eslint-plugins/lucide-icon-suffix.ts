import { ESLintUtils, AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/apollo-ui/eslint-rules/${name}`
)

type MessageIds = 'missingSuffix'

export const lucideIconSuffix = createRule<[], MessageIds>({
  name: 'lucide-icon-suffix',
  meta: {
    type: 'problem',
    fixable: 'code',
    schema: [],
    messages: {
      missingSuffix: "Import '{{name}}' from 'lucide-react' with the 'Icon' suffix as '{{fixed}}'."
    },
    docs: {
      description: "Enforce the 'Icon' suffix on imports from 'lucide-react'."
    }
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value !== 'lucide-react') return

        const importSpecifiers = node.specifiers.filter(
          (s): s is TSESTree.ImportSpecifier => s.type === AST_NODE_TYPES.ImportSpecifier
        )

        const existingLocals = new Set(importSpecifiers.map((s) => s.local.name))
        const existingImported = new Set(
          importSpecifiers
            .filter((s) => s.imported.type === AST_NODE_TYPES.Identifier)
            .map((s) => (s.imported as TSESTree.Identifier).name)
        )

        for (const spec of importSpecifiers) {
          if (spec.imported.type !== AST_NODE_TYPES.Identifier) continue

          const importedName = spec.imported.name
          if (importedName.endsWith('Icon')) continue

          const fixedName = `${importedName}Icon`
          const localName = spec.local.name
          const isAliased = localName !== importedName

          context.report({
            node: spec,
            messageId: 'missingSuffix',
            data: { name: importedName, fixed: fixedName },
            fix(fixer) {
              if (isAliased) {
                return fixer.replaceText(spec.imported, fixedName)
              }

              if (existingLocals.has(fixedName) || existingImported.has(fixedName)) {
                return null
              }

              const scope = context.sourceCode.getScope(node)
              const variable = scope.variables.find((v) => v.name === localName)
              if (!variable) return fixer.replaceText(spec, fixedName)

              const fixes = [fixer.replaceText(spec, fixedName)]
              for (const ref of variable.references) {
                if (ref.identifier === spec.local) continue
                fixes.push(fixer.replaceText(ref.identifier, fixedName))
              }
              return fixes
            }
          })
        }
      }
    }
  }
})
