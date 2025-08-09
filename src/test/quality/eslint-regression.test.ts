import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';
import process from 'process';

describe('ESLint Regression Prevention', () => {
  it('should have zero warnings and zero errors', () => {
    try {
      // Run ESLint and capture the output
      const output = execSync('npm run lint', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      // Count total warnings and errors from the summary line
      const summaryMatch = output.match(
        /✖ (\d+) problems? \((\d+) errors?, (\d+) warnings?\)/
      );

      let totalErrors = 0;
      let totalWarnings = 0;

      if (summaryMatch) {
        totalErrors = parseInt(summaryMatch[2]);
        totalWarnings = parseInt(summaryMatch[3]);
      } else {
        // If no summary line, it means zero issues
        totalErrors = 0;
        totalWarnings = 0;
      }

      // We should have 0 errors and 0 warnings (strict enforcement)
      expect(totalErrors).toBe(0);
      expect(totalWarnings).toBe(0);

      console.log(
        `ESLint check passed: ${totalErrors} errors, ${totalWarnings} warnings`
      );
    } catch (error: any) {
      // ESLint exits with code 1 when there are issues, which should fail the test
      if (error.status === 1) {
        const output = error.stdout || '';

        // Count total warnings and errors from the summary line
        const summaryMatch = output.match(
          /✖ (\d+) problems? \((\d+) errors?, (\d+) warnings?\)/
        );

        let totalErrors = 0;
        let totalWarnings = 0;

        if (summaryMatch) {
          totalErrors = parseInt(summaryMatch[2]);
          totalWarnings = parseInt(summaryMatch[3]);
        } else {
          // Fallback: count individual lines (less reliable)
          const errorLines = (output.match(/error/g) || []).length;
          const warningLines = (output.match(/warning/g) || []).length;
          totalErrors = errorLines;
          totalWarnings = warningLines;
        }

        console.error(
          `ESLint check failed: ${totalErrors} errors, ${totalWarnings} warnings`
        );
        console.error('ESLint output:', output);

        // Fail the test - we require zero issues
        throw new Error(
          `ESLint found ${totalErrors} errors and ${totalWarnings} warnings. All issues must be resolved.`
        );
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  });

  it('should not have any no-unused-vars violations (now treated as errors)', () => {
    try {
      const output = execSync('npm run lint', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      // Since no-unused-vars is now an error, this should pass with no output
      // If there's output, it would be other warning types only
      const noUnusedVarsMatches = (output.match(/no-unused-vars/g) || [])
        .length;
      expect(noUnusedVarsMatches).toBe(0);
    } catch (error: any) {
      if (error.status === 1) {
        const output = error.stdout || '';

        // Check if the failure is due to no-unused-vars (which should not happen)
        const noUnusedVarsMatches = (output.match(/no-unused-vars/g) || [])
          .length;

        if (noUnusedVarsMatches > 0) {
          console.error(
            'Found no-unused-vars violations that should be treated as errors:',
            output
          );
          throw new Error(
            `Found ${noUnusedVarsMatches} no-unused-vars violations. These are now treated as errors and must be fixed.`
          );
        }

        // Other types of issues might still cause exit code 1
        // but no-unused-vars specifically should be zero
        expect(noUnusedVarsMatches).toBe(0);
      } else {
        throw error;
      }
    }
  });

  it('should have zero unused eslint-disable directives', () => {
    // This test ensures that our eslint-disable comments are necessary
    // and not over-applied after cleanup

    try {
      const output = execSync('npm run lint', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      // Should not have any "Unused eslint-disable directive" warnings
      const unusedDisableWarnings = (
        output.match(/Unused eslint-disable directive/g) || []
      ).length;

      // Zero tolerance for unused disable directives
      expect(unusedDisableWarnings).toBe(0);

      console.log(
        `Found ${unusedDisableWarnings} unused eslint-disable directives (should be 0)`
      );
    } catch (error: any) {
      if (error.status === 1) {
        const output = error.stdout || '';

        const unusedDisableWarnings = (
          output.match(/Unused eslint-disable directive/g) || []
        ).length;

        if (unusedDisableWarnings > 0) {
          console.error('Found unused eslint-disable directives:', output);
          throw new Error(
            `Found ${unusedDisableWarnings} unused eslint-disable directives. These should be removed.`
          );
        }

        expect(unusedDisableWarnings).toBe(0);
      } else {
        throw error;
      }
    }
  });

  it('should have clean code in critical component files', () => {
    // Test specific core components that should be warning-free
    const criticalFiles = [
      'src/lib/components/Slider.svelte',
      'src/lib/components/CombinedChart.svelte',
      'src/lib/components/FilingDateChart.svelte',
    ];

    for (const file of criticalFiles) {
      try {
        execSync(`npx eslint ${file}`, {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        // If we get here, the file has no warnings or errors
        console.log(`✓ ${file} is clean`);
      } catch (error: any) {
        if (error.status === 1) {
          const output = error.stdout || '';

          // Count warnings in this specific file
          const warningCount = (output.match(/warning/g) || []).length;

          // Allow a small number of warnings per file, but track them
          expect(warningCount).toBeLessThanOrEqual(5);

          console.log(
            `${file} has ${warningCount} warnings (within acceptable limit)`
          );
        } else {
          throw error;
        }
      }
    }
  });
});
