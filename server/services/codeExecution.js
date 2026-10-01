import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export function executePythonCode(code, stdinInput = '', timeoutMs = 3000) {
  const startTime = Date.now();
  
  // Create a temporary script file in a safe temp directory
  const tempDir = os.tmpdir();
  const filename = `upskill_run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.py`;
  const filePath = path.join(tempDir, filename);

  try {
    fs.writeFileSync(filePath, code, 'utf8');

    const result = spawnSync('python', [filePath], {
      input: stdinInput,
      timeout: timeoutMs,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 5, // 5MB buffer limit
      windowsHide: true
    });

    const executionTimeMs = Date.now() - startTime;

    if (result.error && result.error.code === 'ETIMEDOUT') {
      return {
        status: 'TIME_LIMIT_EXCEEDED',
        stdout: '',
        stderr: `Time Limit Exceeded (${timeoutMs}ms limit). Check for infinite loops.`,
        executionTimeMs
      };
    }

    if (result.status !== 0) {
      return {
        status: 'RUNTIME_ERROR',
        stdout: result.stdout || '',
        stderr: result.stderr || 'Execution terminated with non-zero exit code.',
        executionTimeMs
      };
    }

    return {
      status: 'SUCCESS',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      executionTimeMs
    };
  } catch (err) {
    return {
      status: 'RUNTIME_ERROR',
      stdout: '',
      stderr: err.message || 'Error occurred during sandboxed execution.',
      executionTimeMs: Date.now() - startTime
    };
  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}

export function normalizeOutput(str) {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

export function evaluateTestCases(code, testCases, timeoutMs = 3000) {
  let passedCount = 0;
  let totalTime = 0;
  const results = [];
  let overallStatus = 'ACCEPTED';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = executePythonCode(code, tc.input, timeoutMs);
    totalTime += execRes.executionTimeMs;

    const actual = normalizeOutput(execRes.stdout);
    const expected = normalizeOutput(tc.expected_output);
    const passed = execRes.status === 'SUCCESS' && actual === expected;

    if (passed) {
      passedCount++;
    } else if (overallStatus === 'ACCEPTED') {
      if (execRes.status === 'TIME_LIMIT_EXCEEDED') {
        overallStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (execRes.status === 'RUNTIME_ERROR') {
        overallStatus = 'RUNTIME_ERROR';
      } else {
        overallStatus = 'WRONG_ANSWER';
      }
    }

    // Public test cases include input & expected output; hidden test cases mask input & expected output!
    results.push({
      testCaseIndex: i + 1,
      isHidden: !!tc.is_hidden,
      passed,
      executionTimeMs: execRes.executionTimeMs,
      status: execRes.status === 'SUCCESS' ? (passed ? 'PASSED' : 'WRONG_ANSWER') : execRes.status,
      error: execRes.stderr || null,
      input: tc.is_hidden ? '[Hidden Test Case]' : tc.input,
      expectedOutput: tc.is_hidden ? '[Hidden]' : tc.expected_output,
      actualOutput: tc.is_hidden ? (passed ? '[Passed]' : '[Wrong Output]') : actual
    });
  }

  const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

  return {
    status: passedCount === testCases.length ? 'ACCEPTED' : overallStatus,
    score,
    passedCount,
    totalCount: testCases.length,
    executionTimeMs: Math.round(totalTime / Math.max(1, testCases.length)),
    results
  };
}
