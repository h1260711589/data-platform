export function getEditDistance(input: string, target: string) {
  const m = input.length + 1;
  const n = target.length + 1;
  if (m === 0) return n - 1;
  if (n === 0) return m - 1;

  const matrix = new Array(m).fill(new Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < n; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++) {
      const t = input[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j - 1] + t,
        Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1)
      );
    }
  return matrix[m - 1][n - 1];
}
