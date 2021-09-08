import { sortBy } from 'lodash';

export function rank(
  arr: { studentName: string; [x: string]: number | string }[]
): {
  studentName: string;
  [x: string]: number | string;
  total: number;
  rank: number;
  rankPercent: number;
}[] {
  const arrSum = arr.map(({ studentName, ...examMap }) => ({
    studentName,
    ...examMap,
    total: Object.keys(examMap).reduce(
      (sum, subject) => sum + (examMap[subject] as number),
      0
    ),
  }));

  const sortedArr = sortBy(
    arrSum,
    (item) => -item.total,
    (item) => -item['数学'],
    (item) => -item['语文']
  );

  return sortedArr.map((v, index) => ({
    ...v,
    rank: index + 1,
    rankPercent: Number((((index + 1) / sortedArr.length) * 100).toFixed(2)),
  }));
}
