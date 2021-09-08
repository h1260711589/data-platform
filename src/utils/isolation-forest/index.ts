/* eslint-disable no-restricted-properties */
import { averagePathLength, ITree } from './iTree';

const shuffle = require('knuth-shuffle').knuthShuffle;

export interface DataObject {
  [key: string]: number;
}

export class IsolationForest {
  public trees: ITree[];

  public X: DataObject[];

  private subsamplingSize: number;

  private numberOfTrees: number;

  constructor(numberOfTrees = 100, subsamplingSize = 256) {
    this.subsamplingSize = subsamplingSize;
    this.numberOfTrees = numberOfTrees;
    this.trees = [];
    this.X = [];
  }

  public fit(X: DataObject[]): ITree[] {
    this.X = X;
    if (this.X.length < this.subsamplingSize) {
      this.subsamplingSize = this.X.length;
    }
    const heightLimit = Math.ceil(Math.log2(this.subsamplingSize));

    for (let i = 0; i < this.numberOfTrees; i++) {
      const subsample = this.getSubsample(this.subsamplingSize);

      const iTree: ITree = new ITree(subsample, heightLimit);
      this.trees.push(iTree);
    }
    return this.trees;
  }

  public scores(): number[] {
    const scoreArray: number[] = [];
    for (let i = 0; i < this.X.length; i++) {
      const x = this.X[i];
      let pathLength = 0;
      for (let j = 0; j < this.numberOfTrees; j++) {
        pathLength += this.trees[j].pathLength(
          x,
          this.trees[j].getRootNode(),
          0
        );
      }
      const meanPathLength = pathLength / this.numberOfTrees;
      const score = Math.pow(
        2,
        -(meanPathLength / averagePathLength(this.subsamplingSize))
      );
      scoreArray.push(score);
    }
    return scoreArray;
  }

  private getSubsample(subsampleSize: number): DataObject[] {
    const subsample = [];
    const data: DataObject[] = shuffle(this.X.slice(0));
    return data.slice(0, subsampleSize);
  }
}
