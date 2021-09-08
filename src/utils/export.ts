import { message } from 'antd';
import { remote } from 'electron';
import ExcelJS from 'exceljs';
import { writeFileSync } from 'fs';
import { isObject, isString } from 'lodash';

type Options = {
  sheets: {
    name: string;
    data: Record<string, unknown>[];
    headerConfig: Record<string, string | { name: string; width: number }>;
  }[];
};

export const outputToExcel = async ({ sheets }: Options) => {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(({ name, data, headerConfig }) => {
    const sheet = workbook.addWorksheet(name, {
      headerFooter: { firstHeader: name },
    });

    sheet.columns = Object.keys(headerConfig).map((keyName) => {
      const c = headerConfig[keyName];
      return {
        header: isString(c) ? c : c.name,
        width: isObject(c) ? c.width : undefined,
        key: keyName,
      };
    });

    data.forEach((item) => {
      sheet.addRow(item);
    });
  });

  const res = await remote.dialog.showSaveDialog({
    filters: [{ name: '成绩数据表', extensions: ['xlsx', 'xls'] }],
  });

  if (res.canceled) {
    message.info('你取消了选择');
    return;
  }

  if (res.filePath) {
    const buffer = await workbook.xlsx.writeBuffer();
    writeFileSync(res.filePath, Buffer.from(buffer));
    message.success('保存成功');
  }
};
