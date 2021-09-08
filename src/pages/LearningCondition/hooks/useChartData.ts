import React, { useMemo } from 'react'
import { subject } from '@/dataModel/types'
import { useDataModel } from '@/dataModel'
import { useSchoolList } from '@/dataModel/useSchoolList'
import { Test, SchoolType } from '@/dataModel/types'
import { compact } from 'lodash'
import { Andrew } from '@/utils';
import { groupBy, mapKeys } from 'lodash'

const Color = require('color');

type AxisConfig = {
    vMode: 'value' | 'rank';
    valueUnit?: number;
    min?: number;
    max?: number;
};

export const useChartData = (
    xAxis: subject[],
    yAxis: subject[],
    selectExams: Test[],
    selectYears: number[],
    graduationSelection: string[],
    mode: {
        x: AxisConfig;
        y: AxisConfig;
    },
    abnormalValue: Record<string, number>,
    curYear: number | undefined,
    yearAndClass: { year: number, className: string } | null
) => {
    const { getStudentsByYear, getExamDetail, getTestsByYear, getTestRankWithSubjects } = useDataModel()
    const { getSchoolTypeByName, toSchoolTypeColor } = useSchoolList()

    const allStudents = useMemo(() => selectYears.map((year) => {
        return getStudentsByYear(year)
    }).flat(), [selectYears, getStudentsByYear])


    //选择的考试,为空时默认全选
    const tests = useMemo(() => selectExams.length !== 0 ? selectExams :
        selectYears.map((year) => {
            return getTestsByYear(year)
        }).flat(), [selectExams, selectYears, getTestsByYear])


    const data = useMemo(() => {
        const testsDetailX = compact(tests.map(test => getTestRankWithSubjects(test.examName, xAxis)))
        const testsDetailY = compact(tests.map(test => getTestRankWithSubjects(test.examName, yAxis)))

        return compact(
            allStudents.map(student => {
                const graduation = student.extraCollegeType ? student.extraCollegeType : '正常录取'
                if (graduationSelection.length !== 0 && !graduationSelection.includes(graduation))
                    return null

                let sumX = 0
                let rankPercentX = 0
                let countX = 0
                testsDetailX.forEach((test) => {
                    const stu = test[student.name]
                    if (stu) {
                        sumX += stu.value
                        rankPercentX += stu.rankPercent
                        countX++
                    }
                })
                if (countX === 0)
                    return null
                const xAverage = sumX / countX
                const rankPercentAverageX = rankPercentX / countX

                let sumY = 0
                let rankPercentY = 0
                let countY = 0
                testsDetailY.forEach((test) => {
                    const stu = test[student.name]
                    if (stu) {
                        sumY += stu.value
                        rankPercentY += stu.rankPercent
                        countY++
                    }
                })
                if (countY === 0)
                    return null
                const yAverage = sumY / countY
                const rankPercentAverageY = rankPercentY / countY


                return {
                    studentName: student.name,
                    enrollYear: student.enrollYear,
                    className: student.className,
                    college: student.college,
                    collegeType: getSchoolTypeByName(student.college),
                    xAverage,
                    rankPercentAverageX,
                    yAverage,
                    rankPercentAverageY,
                    studentId: student.studentId
                }

            })
        )

    }
        , [allStudents, tests, xAxis, yAxis, graduationSelection, getTestRankWithSubjects]

    )

    const annotations = useMemo(() => {

        const res: any[] = [];

        const addShape = (
            {
                data,
                color,
                label,
                labelColor,
                labelSize = 16,
                lineStyle = {},
                offsetY = -10,
            }: {
                color: string;
                labelColor: string;
                label: string;
                data: { x: number; y: number }[];
                labelSize?: number;
                lineStyle?: any;
                offsetY?: number;
            },
            abnormal = 50
        ) => {
            const { result: points, start } = Andrew(data, abnormal);

            const pointsArr: any = []
            points.forEach(point => {
                pointsArr.push(mapKeys(point, (value, key) => {
                    if (key === 'x')
                        return mode.x.vMode === 'value' ? 'xAverage' : 'rankPercentAverageX'
                    if (key === 'y')
                        return mode.y.vMode === 'value' ? 'yAverage' : 'rankPercentAverageY'
                }))
            })

            const startPoint = mapKeys(start, (value, key) => {
                if (key === 'x')
                    return mode.x.vMode === 'value' ? 'xAverage' : 'rankPercentAverageX'
                if (key === 'y')
                    return mode.y.vMode === 'value' ? 'yAverage' : 'rankPercentAverageY'
            })


            for (let i = 0; i < pointsArr.length - 1; i++) {
                res.push({
                    type: 'line',
                    start: pointsArr[i],
                    end: pointsArr[i + 1],
                    style: {
                        stroke: color,
                        lineWidth: 2,
                        ...lineStyle,
                    },
                });
            }

            if (pointsArr.length !== 0)
                res.push({
                    type: 'line',
                    start: startPoint,
                    end: startPoint,
                    text: {
                        content: label,
                        offsetY,
                        position: 'left',
                        offsetX: -(label.length / 2) * 11,
                        style: {
                            fill: labelColor,
                            fontWeight: 'bold',
                            fontSize: labelSize,
                        },
                    },
                    style: {
                        stroke: color,
                        lineWidth: 2,
                    },
                });


            if (pointsArr.length === 0) {
                res.push({
                    type: 'line',
                    start: pointsArr[0],
                    end: pointsArr[0],
                    style: {
                        stroke: color,
                        lineWidth: 2,
                    },
                });
            }

            // for (let i = 0; i < pointsArr.length - 1; i++) {
            //     res.push({
            //         type: 'line',
            //         start: pointsArr[i],
            //         end: points[i + 1],
            //         style: {
            //             stroke: color,
            //             lineWidth: 2,
            //             ...lineStyle,
            //         },
            //     });
            // }
        };

        const pointsBySchoolType = groupBy(data, 'collegeType')


        Object.keys(pointsBySchoolType).forEach((collegeType) => {
            // if (collegeType === '其他' || collegeType === '未填写' || collegeType === '未知学校类型')
            //     return
            if (collegeType === '未知学校类型')
                return
            const color = toSchoolTypeColor(collegeType)
            const name = collegeType

            const thisData = pointsBySchoolType[collegeType].map(p => {
                return {
                    x: mode.x.vMode === 'value' ? p.xAverage : p.rankPercentAverageX,
                    y: mode.y.vMode === 'value' ? p.yAverage : p.rankPercentAverageY
                }
            })

            addShape(
                {
                    data: thisData,
                    color,
                    label: name,
                    labelColor: color,
                },
                abnormalValue[name]
            );
        })

        if (curYear) {
            const curYearData = data.filter(d => d.enrollYear === curYear)
            const pointsBySchoolTypeWithCurYear = groupBy(curYearData, 'collegeType')
            Object.keys(pointsBySchoolTypeWithCurYear).forEach((collegeType) => {
                // if (collegeType === '其他' || collegeType === '未填写' || collegeType === '未知学校类型')
                //     return
                if (collegeType === '未知学校类型')
                    return
                const color = Color('#121212').hex()
                const name = collegeType

                const thisData = pointsBySchoolTypeWithCurYear[collegeType].map(p => {
                    return {
                        x: mode.x.vMode === 'value' ? p.xAverage : p.rankPercentAverageX,
                        y: mode.y.vMode === 'value' ? p.yAverage : p.rankPercentAverageY
                    }
                })

                addShape(
                    {
                        data: thisData,
                        color,
                        label: curYear.toString() + `届-${collegeType}`,
                        labelColor: color,
                        lineStyle: {
                            stroke: color,
                            lineWidth: 2,
                            lineDash: [3, 3],
                        },
                    },
                    abnormalValue[name]
                );
            })
        }

        if (yearAndClass) {
            const classData = data.filter(d => d.enrollYear === yearAndClass.year && d.className === yearAndClass.className)
            const pointsBySchoolTypeWithClass = groupBy(classData, 'collegeType')
            Object.keys(pointsBySchoolTypeWithClass).forEach((collegeType) => {
                // if (collegeType === '其他' || collegeType === '未填写' || collegeType === '未知学校类型')
                //     return
                if (collegeType === '未知学校类型')
                    return
                const color = Color('#121212').hex()
                const name = collegeType

                const thisData = pointsBySchoolTypeWithClass[collegeType].map(p => {
                    return {
                        x: mode.x.vMode === 'value' ? p.xAverage : p.rankPercentAverageX,
                        y: mode.y.vMode === 'value' ? p.yAverage : p.rankPercentAverageY
                    }
                })

                addShape(
                    {
                        data: thisData,
                        color,
                        label: `${yearAndClass.year}届-${yearAndClass.className}-${collegeType}`,
                        labelColor: color,
                        lineStyle: {
                            stroke: color,
                            lineWidth: 2,
                            lineDash: [3, 3],
                        },
                    },
                    abnormalValue[name]
                );
            })
        }

        return res
    }, [data, mode, abnormalValue, curYear, yearAndClass])


    return { data, annotations }
}
