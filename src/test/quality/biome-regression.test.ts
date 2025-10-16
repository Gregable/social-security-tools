import { execSync } from 'node:child_process';
import process from 'node:process';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Extend timeout for slower Biome runs (CI environments especially)
const BIOME_TIMEOUT = 60000; // 60s

describe('Biome Regression Prevention', () => {
  let logSpy: ReturnType<typeof vi.spyOn> | undefined;
  let errorSpy: ReturnType<typeof vi.spyOn> | undefined;
  let warnSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeAll(() => {
    // Silence console output during these quality tests unless explicitly enabled.
    if (!process.env.SHOW_TEST_LOGS) {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    }
  });

  afterAll(() => {
    logSpy?.mockRestore();
    errorSpy?.mockRestore();
    warnSpy?.mockRestore();
  });
  it(
    'should have zero warnings and zero errors',
    () => {
      try {
        // Run Biome and capture the output
        const output = execSync('npm run lint', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        // Count total warnings and errors from the summary line
        const summaryMatch = output.match(
          /Found (\d+) errors?\.\s+Found (\d+) warnings?\./
        );

        let totalErrors = 0;
        let totalWarnings = 0;

        if (summaryMatch) {
          totalErrors = parseInt(summaryMatch[1], 10);
          totalWarnings = parseInt(summaryMatch[2], 10);
        } else {
          // If no summary line, it means zero issues
          totalErrors = 0;
          totalWarnings = 0;
        }

        // We should have 0 errors and 0 warnings (strict enforcement)
        expect(totalErrors).toBe(0);
        expect(totalWarnings).toBe(0);

        console.log(
          `Biome check passed: ${totalErrors} errors, ${totalWarnings} warnings`
        );
      } catch (error: any) {
        // Biome exits with code 1 when there are issues, which should fail the test
        if (error.status === 1) {
          const output = error.stdout || '';

          // Count total warnings and errors from the summary line
          const summaryMatch = output.match(
            /Found (\d+) errors?\.\s+Found (\d+) warnings?\./
          );

          let totalErrors = 0;
          let totalWarnings = 0;

          if (summaryMatch) {
            totalErrors = parseInt(summaryMatch[1], 10);
            totalWarnings = parseInt(summaryMatch[2], 10);
          } else {
            // Fallback: count individual lines (less reliable)
            const errorLines = (output.match(/✖/g) || []).length;
            const warningLines = (output.match(/⚠/g) || []).length;
            totalErrors = errorLines;
            totalWarnings = warningLines;
          }

          console.error(
            `Biome check failed: ${totalErrors} errors, ${totalWarnings} warnings`
          );
          console.error('Biome output:', output);

          // Fail the test - we require zero issues
          throw new Error(
            `Biome found ${totalErrors} errors and ${totalWarnings} warnings. All issues must be resolved.`
          );
        } else {
          // Re-throw unexpected errors
          throw error;
        }
      }
    },
    BIOME_TIMEOUT
  );

  it(
    'should not have any unused variable violations',
    () => {
      try {
        const output = execSync('npm run lint', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        // Check for unused variables/imports (Biome's noUnusedVariables/noUnusedImports)
        const unusedMatches = (output.match(/noUnusedVariables|noUnusedImports/g) || [])
          .length;
        expect(unusedMatches).toBe(0);
      } catch (error: any) {
        if (error.status === 1) {
          const output = error.stdout || '';

          // Check if the failure is due to unused variables
          const unusedMatches = (output.match(/noUnusedVariables|noUnusedImports/g) || [])
            .length;

          if (unusedMatches > 0) {
            console.error(
              'Found unused variable/import violations:',
              output
            );
            throw new Error(
              `Found ${unusedMatches} unused variable/import violations. These must be fixed.`
            );
          }

          expect(unusedMatches).toBe(0);
        } else {
          throw error;
        }
      }
    },
    BIOME_TIMEOUT
  );

  it(
    'should have clean code in critical component files',
    () => {
      // Test specific core components that should be warning-free
      const criticalFiles = [
        'src/lib/components/Slider.svelte',
        'src/lib/components/CombinedChart.svelte',
        'src/lib/components/FilingDateChart.svelte',
      ];

      for (const file of criticalFiles) {
        try {
          execSync(`npx biome lint ${file}`, {
            encoding: 'utf8',
            cwd: process.cwd(),
            stdio: 'pipe',
          });

          // If we get here, the file has no warnings or errors
          console.log(`✓ ${file} is clean`);
        } catch (error: any) {
          if (error.status === 1) {
            const output = error.stdout || '';

            // Count warnings in this specific file (Biome uses ⚠ symbol)
            const warningCount = (output.match(/⚠/g) || []).length;

            // Should have zero warnings in critical files
            expect(warningCount).toBe(0);

            if (warningCount > 0) {
              console.error(`${file} has ${warningCount} warnings:`, output);
            }
          } else {
            throw error;
          }
        }
      }
    },
    BIOME_TIMEOUT
  );
});
