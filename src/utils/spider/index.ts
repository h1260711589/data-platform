/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { SchoolType, useSchoolList } from '@/database';
import axios from 'axios';
import cheerio from 'cheerio';
import { pick, trim } from 'lodash';

type Result = Record<
  string,
  | {
      canCorrect: true;
      correctTarget: 'dataSource' | 'database'; // 是数据有问题还是数据库有问题
      correctType: 'add' | 'update';
      correctValue: string;
    }
  | {
      canCorrect: false;
    }
>;

export const checkSchoolInfo = async (
  schoolsMayErr: string[],
  onProgress: (
    finished: number,
    info: {
      rawName: string;
      baseInfo: null | object;
      extra: null | object;
      link?: string;
    },
    sourceName: string
  ) => void
): Promise<Result> => {
  const res: Result = {};
  for (let i = 0; i < schoolsMayErr.length; i++) {
    const sourceName = schoolsMayErr[i];
    const info = await getSchoolInfo(sourceName);

    onProgress(
      i,
      info ?? { rawName: sourceName, baseInfo: null, extra: null },
      sourceName
    );

    if (!info) {
      res[sourceName] = { canCorrect: false };
    } else if (info.baseInfo.中文名 && info.baseInfo.中文名 !== sourceName) {
      res[sourceName] = {
        canCorrect: true,
        correctTarget: 'database',
        correctType: 'add',
        correctValue: info.baseInfo.中文名,
      };
    }

    await delay(500);
  }

  return res;
};

// 对学校进行更名
export const correctSchoolInfo = (
  info: Record<string, { name: string; city: string; schoolType: SchoolType }>
) => {
  useSchoolList.data?.changeList?.((list) => {
    const l = list.concat();
    l.forEach((school) => {
      if (info[school.name]) {
        const { name, schoolType, city } = info[school.name];
        school.name = name;
        school.schoolType = schoolType;
        school.city = city;

        delete info[school.name];
      }
    });

    Object.keys(info).forEach((oldName) => {
      if (info[oldName]) {
        l.push(info[oldName]);
      }
    });

    return l;
  });
};

const baikeInstance = axios.create({
  baseURL: 'https://baike.baidu.com/item/',
  timeout: 3000,
  headers: {},
});

const infoInstance = axios.create({
  baseURL: `https://api.eol.cn/gkcx/api/`,
});

const getSchoolInfo = async (schoolName: string) => {
  try {
    const res = await baikeInstance.get(encodeURIComponent(schoolName));
    const $ = cheerio.load(res.data);

    const record: Record<string, string> = {};

    let key: string | null;

    const name = $('.lemmaWgt-lemmaTitle-title > h1').first().text();

    $('.basicInfo-item').each((_i, e) => {
      const el = $(e);
      if (el.hasClass('name')) {
        key = el.text().trim();
      } else if (el.hasClass('value')) {
        if (key) {
          record[key] = el.text().trim();
        }
      }
    });

    // 排除非大学的结果
    if (Object.keys(record).length === 0 || !record['办学性质']) {
      return null;
    }

    record['中文名'] = trim(name);

    const queryResult = (
      await infoInstance.post(
        `?access_token=&keyword=${record['中文名']}&page=1&signsafe=&size=20&sort=view_total&uri=apidata/api/gk/school/lists`
      )
    ).data;

    let extraInfo: any = null;
    if (
      queryResult.message === '成功' &&
      queryResult.data?.item?.length === 1
    ) {
      extraInfo = pick(queryResult.data.item[0], ['level_name', 'nature_name']);
    }

    return {
      baseInfo: pick(record, ['中文名', '简称', '办学性质', '地址']),
      extra: extraInfo,
      rawName: schoolName,
      link: `https://baike.baidu.com/item/${schoolName}`,
    };
  } catch (err) {
    return null;
  }
};

const delay = (timeout = 100) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
