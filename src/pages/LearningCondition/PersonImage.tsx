import React, { useState, useMemo } from 'react'
import { Student, Test, subject } from '@/dataModel/types'
import { useDataModel } from '@/dataModel'
import { Select, Space, Row, Col, Slider, List, Divider } from 'antd'
import { Line } from '@ant-design/charts'
import { compact } from 'lodash'
import { useNearbyData } from './hooks/useNearbyData'
import { PieImage } from '@/components/PieImage'
import { useSchoolList } from '@/dataModel/useSchoolList'


export const PersonImage: React.FC<{
    selectYears: number[],
    setIsOpenPanel: any,
    selectExams: Test[],
    xAxis: subject[],
    yAxis: subject[],
    setMode: any,
    setIsOpenPersonImage: any,
    curStudent: Student | null,
    setCurStudent: React.Dispatch<React.SetStateAction<Student | null>>

}> = ({ selectYears, setIsOpenPanel, selectExams, xAxis, yAxis, setMode, setIsOpenPersonImage, curStudent, setCurStudent }) => {
    const { getStudentsByYear, getTestRankWithSubjects, getTestsByYear } = useDataModel()
    const { radius, setRadius, setCenterStudent, getNearbyStudents } = useNearbyData()
    const { filterStudent, getSchoolClassification } = useSchoolList()

    const options = useMemo(() => {
        const allStudents = selectYears.map((year) => {
            return getStudentsByYear(year)
        }).flat()
        return allStudents.map(student => {
            return {
                label: `${student.enrollYear}届-${student.name}`,
                value: JSON.stringify(student)
            }
        })
    }, [])


    const getLine = () => {
        //选择的考试,为空时默认全选
        const tests = selectExams.length !== 0 ? selectExams :
            selectYears.map((year) => {
                return getTestsByYear(year)
            }).flat()

        const dataX = compact(tests.map(test => {
            const testsDetail = getTestRankWithSubjects(test.examName, xAxis)
            if (!testsDetail)
                return null
            const stu = testsDetail[curStudent!.name]
            if (!stu)
                return null
            return {
                test: test.examName,
                rankP: stu.rankPercent,
                subjects: xAxis.join(',')
            }
        }))

        const dataY = compact(tests.map(test => {
            const testsDetail = getTestRankWithSubjects(test.examName, yAxis)
            if (!testsDetail)
                return null
            const stu = testsDetail[curStudent!.name]
            if (!stu)
                return null
            return {
                test: test.examName,
                rankP: stu.rankPercent,
                subjects: yAxis.join(',')
            }
        }))

        const data = dataX.concat(dataY)


        const config = {
            data,
            xField: 'test',
            yField: 'rankP',
            seriesField: 'subjects',
            yAxis: {
                title: {
                    text: '年级排名',
                },
            },
            smooth: false,
            animation: {
                appear: {
                    animation: 'path-in',
                    duration: 500,
                },
            },
            meta: {
                rankP: {
                    formatter: (v: number) => `${(v * 100).toFixed(2)}%`,
                    range: [1, 0],
                },
            },
            annotations: compact([dataX, dataY].map((data) => {
                if (data.length === 0)
                    return null
                const average = data.reduce((sum, d) => {
                    return sum + d.rankP
                }, 0) / data.length
                return [
                    {
                        type: 'line',
                        start: ['min', average],
                        end: ['max', average],
                        style: {
                            stroke: '#ccc',
                            lineDash: [2, 2],
                        },
                    },
                    {
                        type: 'text',
                        position: ['min', average],
                        content: `${data[0].subjects}平均数`,
                        offsetY: -4,
                        style: { textBaseline: 'bottom' },
                    },
                ];
            })).flat()
        };

        return <Line {...config} />
    }

    const getNearbySchoolsType = () => {
        const stus = getNearbyStudents()
        const data = getSchoolClassification(stus)
        return data
    }

    const listData = curStudent ? getNearbySchoolsType() : []

    // const stus = getNearbyStudents()
    // const listData = getSchoolClassification(stus)


    return (
        <>
            <Select
                showSearch
                allowClear
                optionFilterProp="label"
                style={{ width: '100%', marginBottom: '10px' }}
                placeholder={'输入姓名查询学生'}
                options={options}
                value={curStudent === null ? '' : `${curStudent.enrollYear}届-${curStudent.name}`}
                onChange={(v) => {
                    if (!v) {
                        setCurStudent(null)
                        setIsOpenPanel(false)
                        setIsOpenPersonImage(false)
                        setCenterStudent(null)
                    }
                    else {
                        setCurStudent(JSON.parse(v))
                        setIsOpenPanel(true)
                        setIsOpenPersonImage(true)
                        setMode((pre: any) => {
                            return {
                                x: { ...(pre.x), vMode: 'rank' },
                                y: { ...(pre.y), vMode: 'rank' }
                            }
                        })
                        setRadius(10)
                        setCenterStudent(JSON.parse(v))
                    }
                }}
            />
            <Space
                style={{
                    height: 350,
                    overflowX: 'hidden',
                    overflowY: 'scroll',
                    width: '100%',
                }}
                direction={'vertical'}
            >
                {curStudent && (
                    <>
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#303a52',
                                fontWeight: 'bold',
                                marginTop: 30,
                            }}
                        >
                            <span style={{ color: '#2f89fc' }}>{curStudent.name}</span> 考试记录
                        </div>
                        {getLine()}
                        <Row align={'middle'} style={{ marginTop: 10 }}>
                            <Col>
                                <span
                                    style={{ marginRight: 10, fontWeight: 'bold' }}
                                >
                                    预测半径:
                                    {radius}
                                </span>
                            </Col>
                            <Col flex={1}>
                                <Slider
                                    min={1}
                                    max={40}
                                    value={radius}
                                    style={{ width: '100%' }}
                                    onChange={setRadius}
                                />
                            </Col>
                        </Row>
                        <PieImage
                            students={filterStudent(getNearbyStudents())}
                            titleSpan={'附近的'}
                        />
                        <Divider />
                        {
                            <List
                                dataSource={Object.keys(listData)}
                                renderItem={(item) => {
                                    const title = item
                                    const percent = listData[item].percent
                                    const schoolList = listData[item].schoolList
                                    return (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={`${title}: ${(
                                                    (percent) *
                                                    100
                                                ).toFixed(2)}%`}
                                            />
                                            {Object.keys(schoolList)
                                                .map((name) => `${name}(${schoolList[name]})`)
                                                .join(', ')}
                                        </List.Item>
                                    );
                                }}
                            />
                        }
                    </>
                )
                }

            </Space>
        </>
    )
}
