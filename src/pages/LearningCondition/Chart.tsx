import React, { memo, useEffect, useMemo, useState } from 'react'
import { Scatter } from '@ant-design/charts';
import { Test, subject, SchoolType } from '@/dataModel/types'
import { useChartData } from './hooks/useChartData'
import { useSchoolList } from '@/dataModel/useSchoolList'
import { message } from 'antd'
import { useNearbyData } from './hooks/useNearbyData'
import { useDataModel } from '@/dataModel'



type AxisConfig = {
    vMode: 'value' | 'rank';
    valueUnit?: number;
    min?: number;
    max?: number;
};


export const Chart: React.FC<{
    xAxis: subject[],
    yAxis: subject[],
    selectExams: Test[],
    selectYears: number[],
    isShowLabel: boolean,
    mode: { x: AxisConfig, y: AxisConfig },
    graduationSelection: string[],
    valueTypeX: 'value' | 'rank',
    valueTypeY: 'value' | 'rank',
    isOpenPersonImage: boolean,
    abnormalValue: Record<string, number>,
    showLines: boolean,
    curYear: number | undefined,
    yearAndClass: { year: number, className: string } | null
}> = memo(
    ({ xAxis, yAxis, selectExams, selectYears, isShowLabel, mode, graduationSelection, valueTypeX, valueTypeY, isOpenPersonImage, abnormalValue, showLines, curYear, yearAndClass }) => {
        const { enrollYear } = useDataModel()
        const { data, annotations } = useChartData(xAxis, yAxis, selectExams, selectYears, graduationSelection, mode, abnormalValue, curYear, yearAndClass)
        const { toSchoolTypeColor } = useSchoolList()
        const { setNearbyStudents, centerStudent, radius, setData } = useNearbyData()

        useEffect(() => {
            if (data.length === 0)
                message.error('当前选课组合或考试选择下没有符合筛选条件的学生!')
        }, [xAxis, yAxis, selectExams])

        useEffect(() => {
            setData(data)
        }, [data, setData])



        const { x, y } = mode

        const extraPoint = useMemo(() => {
            if (isOpenPersonImage === false)
                return []
            const targetStudent = data.find(stu => {
                return stu.studentName === centerStudent?.name && stu.enrollYear === centerStudent.enrollYear
            })
            if (!targetStudent)
                return []
            const { xAverage, rankPercentAverageX, yAverage, rankPercentAverageY } = targetStudent
            const p = {
                studentId: 'center',
                xAverage,
                rankPercentAverageX,
                yAverage,
                rankPercentAverageY,
                hasOpacity: true,
                type: '#2f89fc',
                radius
            }
            return [p]
        }, [data, centerStudent, isOpenPersonImage])

        const chartConfig = {
            data: (extraPoint as any).concat(data),
            xField: valueTypeX === 'value' ? 'xAverage' : 'rankPercentAverageX',
            yField: valueTypeY === 'value' ? 'yAverage' : 'rankPercentAverageY',
            colorField: 'collegeType',
            color: ({ collegeType }: { collegeType: string }) => toSchoolTypeColor(collegeType),
            sizeField: 'studentId',
            size: ({ studentId }: any) => {
                if (studentId === centerStudent?.studentId) {
                    return 8
                }
                else if (studentId === 'center')
                    return radius * 8
                return 4
            },
            pointStyle: ({ studentId }: any) => {
                if (studentId === 'center')
                    return {
                        fillOpacity: 0.3
                    }
            },

            shape: 'circle',
            xAxis: {
                title: { text: `${xAxis.join(',')}` },
                grid: { line: { style: { stroke: '#eee' } } },
                line: { style: { stroke: '#aaa' } },
                tickInterval: x.valueUnit,
                min: x.min,
                max: x.max
            },
            yAxis: {
                title: { text: `${yAxis.join(',')}` },
                line: { style: { stroke: '#aaa' } },
                tickInterval: y.valueUnit,
                min: y.min,
                max: y.max
            },
            tooltip: {
                fields: [
                    'studentName',
                    'enrollYear',
                    'className',
                    valueTypeX === 'value' ? 'xAverage' : 'rankPercentAverageX',
                    valueTypeY === 'value' ? 'yAverage' : 'rankPercentAverageY',
                    'college'],
            },
            meta: {
                studentName: {
                    alias: '学生姓名'
                },
                enrollYear: {
                    alias: '毕业年份'
                },
                className: {
                    alias: '班级'
                },
                xAverage: {
                    alias: `${xAxis.join(',')}`,
                    formatter: (d: number) => d.toFixed(2)
                },
                rankPercentAverageX: {
                    alias: `${xAxis.join(',')}`,
                    formatter: (d: number) => (d * 100).toFixed(2) + '%'
                },
                yAverage: {
                    alias: `${yAxis.join(',')}`,
                    formatter: (d: number) => d.toFixed(2)
                },
                rankPercentAverageY: {
                    alias: `${yAxis.join(',')}`,
                    formatter: (d: number) => (d * 100).toFixed(2) + '%'
                },
                college: {
                    alias: '毕业院校'
                }

            },
            label: {
                content: (dataObj: any) => {
                    if (!isShowLabel)
                        return undefined
                    if (!dataObj.college)
                        return '无学校信息'
                    return dataObj.college
                },
                style: { fontSize: '8' },

            },
            annotations: showLines ? annotations : undefined
        }


        return (
            <>
                <div
                    style={{
                        textAlign: 'center',
                        width: '100%',
                        marginLeft: 10,
                        marginBottom: 15,
                        fontSize: 16,
                        fontWeight: 'bold',
                    }}
                >
                    {selectYears.length === 0 ? "" : '鲁迅中学'}
                    <span style={{ color: '#2f89fc' }}>
                        {selectYears.length === 0 ? '未选择任何一届年级' : (selectYears.length === enrollYear.length ? '全体学生' : selectYears.map(y => y + '届').join(','))}
                    </span>
                    {selectYears.length === 0 ? "" : '学生毕业去向'}
                </div>
                <Scatter {...(chartConfig as any)} />
            </>
        )
    }
)

