import React, { useEffect, useState } from 'react'
import { Descriptions, Space } from 'antd'
import { useDataModel } from '@/dataModel'
import { groupBy } from 'lodash'

export default function DataOverview() {

    const { students, exams, getExamsByYear, enrollYear } = useDataModel()


    //大场考试数量
    const testNumber = enrollYear.reduce((total: number, year: number) => {
        const examNumber = Object.getOwnPropertyNames(groupBy(getExamsByYear(year), 'examName')).length
        return total + examNumber
    }, 0)



    return (
        <Space direction={'vertical'} style={{ width: '100%' }}>
            <Descriptions title={'数据量'} bordered column={2}>
                <Descriptions.Item label={'年份'}>
                    {enrollYear.join(',')}
                </Descriptions.Item>
                <Descriptions.Item label={'学生记录数'}>
                    {students.length}
                </Descriptions.Item>
                <Descriptions.Item label={'考试记录数'}>
                    {testNumber}
                </Descriptions.Item>
            </Descriptions>
            <Descriptions title={'学生数据检查'} bordered column={2}>
                <Descriptions.Item label={'未填写学校'}>
                    0
                </Descriptions.Item>
                <Descriptions.Item label={'未填写班级'}>
                    0
                </Descriptions.Item>
                <Descriptions.Item label={'学校名称异常'}>
                    0
                </Descriptions.Item>
            </Descriptions>
            <Descriptions title={'学校数据检查'} bordered>
                <Descriptions.Item label={'学校类型异常'}>
                    0
                </Descriptions.Item>
            </Descriptions>
        </Space>
    )
}
