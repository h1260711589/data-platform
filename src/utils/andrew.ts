import { last, memoize, sortBy, uniqWith } from 'lodash';
import { IsolationForest } from './isolation-forest';

type Point = { x: number; y: number };

const getIndex = (arr: Point[], abnormal = 50) => {
  const tree = new IsolationForest();
  tree.fit(arr);

  const scores = sortBy(
    tree.scores().map((v, i) => ({ index: i, score: v })),
    'score'
  )
    .slice(0, Math.ceil((abnormal / 100) * arr.length))
    .map((i) => i.index);

  return scores;
};

let key = 0;
const weakMap = new WeakMap<any, number>();
export const Andrew = memoize(
  (arr: Point[] = [], abnormal = 50) => {
    const uniqArr = uniqWith(arr, (a, b) => a.x === b.x && a.y === b.y);

    const scores = getIndex(uniqArr, abnormal);

    const filterArr = uniqArr.filter((_, i) => scores.includes(i));
    const sortedArr = sort(filterArr);
    const result: Point[] = [];
    const n = sortedArr.length;
    let tot = 0;

    for (let i = 0; i < n; i++) {
      while (
        tot > 1 &&
        xmul(result[tot - 2], result[tot - 1], sortedArr[i]) < 0
      ) {
        --tot;
      }

      result[tot++] = sortedArr[i];
    }

    const k = tot;
    for (let i = n - 2; i >= 0; --i) {
      while (
        tot > k &&
        xmul(result[tot - 2], result[tot - 1], sortedArr[i]) < 0
      ) {
        --tot;
      }
      result[tot++] = sortedArr[i];
    }

    return {
      result: result.slice(0, tot),
      start: last(sortedArr),
    };
  },
  (arr, abnormal) => {
    if (weakMap.has(arr)) {
      return `${weakMap.get(arr)}:${abnormal}`;
    }

    const current = key++;
    weakMap.set(arr, current);
    return `${current}:${abnormal}`;
  }
);

const xmul = (a: Point, b: Point, c: Point) => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

const sort = (arr: Point[]) => {
  return sortBy(
    arr,
    (i) => i.x,
    (i) => i.y
  );
};

// const data = [
//   [5, 8],
//   [12, 56],
//   [5, 2],
//   [125, 1],
//   [15, 66],
//   [45, 77],
//   [55, 6],
//   [45, 2],
//   [232, 5],
//   [45, 12],
//   [54, 66],
// ];
// console.log(Andrew(data.map((i) => ({ x: i[0], y: i[1] }))));
