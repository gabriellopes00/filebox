import type { ESLint, Rule } from 'eslint'
import { lucideIconSuffix } from './lucide-icon-suffix'

export const localPlugin = {
  rules: {
    'lucide-icon-suffix': lucideIconSuffix as unknown as Rule.RuleModule
  }
} satisfies ESLint.Plugin
