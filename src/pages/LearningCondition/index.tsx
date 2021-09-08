import React, { useState, useMemo } from 'react'
import { Chart } from './Chart'
import { GradeImage } from './GradeImage'
import { ClassImage } from './ClassImage'
import { PersonImage } from './PersonImage'
import { useDataModel } from '@/dataModel'
import { subject, SchoolType } from '@/dataModel/types'
import { Test, Student } from '@/dataModel/types'
import {
    Checkbox,
    Col,
    Divider,
    InputNumber,
    Radio,
    Row,
    Select,
    Slider,
    Switch,
    Tag,
    TreeSelect,
    Collapse,
    message
} from 'antd';
import { labelStyle, sectionStyle } from './style'
import { compact, groupBy, keyBy } from 'lodash'
import { useNearbyData } from './hooks/useNearbyData'
import { useSchoolList } from '@/dataModel/useSchoolList'


type AxisConfig = {
    vMode: 'value' | 'rank';
    valueUnit?: number;
    min?: number;
    max?: number;
};


export const LearningCondition: React.FC<{
    // selectYears: number[]//选择某几届学生
}> = ({
    // selectYears
}) => {
        const { getTestsList, getTestsByYear, enrollYear } = useDataModel()
        const { SchoolTypeList, toSchoolTypeName, toSchoolTypeColor } = useSchoolList()
        //x轴科目
        const [xAxis, setXAxis] = useState<subject[]>(['语文', '数学'])
        //y轴科目
        const [yAxis, setYAxis] = useState<subject[]>(['英语'])
        //考试数据选择 空数组表示全选
        const [selectExams, setSelectExams] = useState<Test[]>([])
        const [isShowLabel, setIsShowLabel] = useState<boolean>(false)
        const [mode, setMode] = useState<{
            x: AxisConfig,
            y: AxisConfig
        }>({
            x: { vMode: 'value' },
            y: { vMode: 'value' },
        })
        const [checkedList, setCheckedList] = useState<string[]>(['正常录取'])
        const [showPanel, setShowPanel] = useState<boolean>(false)
        const [isOpenPanel, setIsOpenPanel] = useState<boolean>(false)
        const [isOpenPersonImage, setIsOpenPersonImage] = useState<boolean>(false)
        const { setCenterStudent } = useNearbyData()
        const [abnormalValue, setAbnormalValue] = useState<Record<string, number>>({} as Record<string, number>)
        const [showLines, setShowLines] = useState<boolean>(true)
        //年级图像中选择的年份
        const [curYear, setCurYear] = useState<number | undefined>(undefined)
        //个人图像中选择的学生
        const [curStudent, setCurStudent] = useState<Student | null>(null)
        //班级图像中选择的班级
        const [yearAndClass, setYearAndClass] = useState<{ year: number, className: string } | null>(null)

        const [selectYears, setSelectYears] = useState<number[]>(enrollYear)

        const handleShowLabelSwitch = () => {
            setIsShowLabel(pre => !pre)
        }

        //选择年级配置
        const options = enrollYear.map((year) => {
            return {
                label: year,
                value: year
            }
        })

        //根据选择的届数选择有效的考试为treeData
        const d = useMemo(() => keyBy(getTestsList(), (t) => t.value), [getTestsList])
        const treeData = useMemo(() => compact(Object.keys(d).map((y) => {
            const year = Number(y)
            if (selectYears.includes(year)) {
                return d[year]
            }
            else
                return null
        })), [d, selectYears])


        //散点图配置
        const chartConfig = {
            xAxis,
            yAxis,
            selectExams,
            selectYears,
            isShowLabel,
            mode,
            graduationSelection: checkedList,
            valueTypeX: mode.x.vMode,
            valueTypeY: mode.y.vMode,
            isOpenPersonImage: isOpenPersonImage,
            abnormalValue: abnormalValue,
            showLines: showLines,
            curYear,
            setCurYear,
            yearAndClass
        }



        const examSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理']
        const extraCollegeTypes = ['正常录取', '艺考本科', '专科自招', '专科', '春考', '综评录取']

        function tagRender(props: any) {
            const { label, value, closable, onClose } = props;

            return (
                <Tag
                    color="#108ee9"
                    closable={closable}
                    onClose={onClose}
                    style={{ marginRight: 3, color: '#fff' }}
                >
                    {label}
                </Tag>
            );
        }

        const getMenu = (
            onChange: (v: subject[]) => void,
            label: string,
            axis: 'x' | 'y',
            value: subject[]
        ) => {
            return (
                <>
                    <Row align={'middle'} style={{ marginTop: 10 }}>
                        <span style={labelStyle}>{label}</span>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: 230 }}
                            placeholder={label ?? ''}
                            value={value}
                            tagRender={tagRender}
                            onChange={onChange}
                        >
                            {examSubjects.map((i) => (
                                <Select.Option key={i} value={i}>
                                    {i}
                                </Select.Option>
                            ))}
                        </Select>
                        <span style={labelStyle}>取值方式</span>
                        <Radio.Group
                            options={[
                                { label: '数值', value: 'value' },
                                { label: '排名', value: 'rank' },
                            ]}
                            value={mode[axis].vMode}
                            onChange={
                                (v) => {
                                    if (v.target.value === 'value' && isOpenPersonImage === true) {
                                        message.error('请关闭个人学情再进行切换为数值坐标轴！')
                                        return
                                    }
                                    const vMode = v.target.value
                                    setMode(preMode => {
                                        const preAxisConfig = preMode[axis]
                                        return {
                                            ...preMode,
                                            [axis]: {
                                                ...preAxisConfig,
                                                vMode
                                            }
                                        }
                                    })
                                }
                            }
                            optionType="button"
                            buttonStyle="solid"
                        />
                        <span style={labelStyle}>坐标轴设置</span>
                        <InputNumber
                            placeholder={'单位'}
                            style={{ marginLeft: 5 }}
                            onChange={(unit) => {
                                if (unit < 0)
                                    return
                                setMode(preMode => {
                                    const preAxisConfig = preMode[axis]
                                    return {
                                        ...preMode,
                                        [axis]: {
                                            ...preAxisConfig,
                                            valueUnit: unit
                                        }
                                    }
                                })
                            }}
                        />
                        <InputNumber
                            placeholder={'最小值'}
                            style={{ marginLeft: 10 }}
                            onChange={(min) => {
                                setMode(preMode => {
                                    const preAxisConfig = preMode[axis]
                                    return {
                                        ...preMode,
                                        [axis]: {
                                            ...preAxisConfig,
                                            min
                                        }
                                    }
                                })
                            }}
                        />
                        <InputNumber
                            placeholder={'最大值'}
                            style={{ marginLeft: 10 }}
                            onChange={(max) => {
                                setMode(preMode => {
                                    const preAxisConfig = preMode[axis]
                                    return {
                                        ...preMode,
                                        [axis]: {
                                            ...preAxisConfig,
                                            max
                                        }
                                    }
                                })
                            }}
                        />

                    </Row>
                </>
            );
        };


        return (
            <div>
                <Row align={'middle'} >
                    <Col span={2} style={sectionStyle}>
                        年级选择
                    </Col>
                    <Col flex={1}>
                        <Select
                            mode="multiple"
                            showSearch={false}
                            allowClear
                            style={{ width: '100%' }}
                            placeholder={'选择年级'}
                            options={options}
                            value={selectYears}
                            onChange={(v) => {
                                setSelectYears(v)
                            }}
                        />
                    </Col>
                </Row>
                <Divider />
                <Row align={'middle'} style={{ marginBottom: 25 }}>
                    <Col span={2} style={sectionStyle}>
                        显示设置
                    </Col>
                    <Col flex={1}>
                        <Row align={'middle'}>
                            <Col>
                                <span style={labelStyle}>学校名称</span>
                                <Switch
                                    checkedChildren={'显示'}
                                    unCheckedChildren={'不显示'}
                                    onChange={handleShowLabelSwitch}
                                />
                            </Col>
                            <Col style={{ marginLeft: 15 }}>
                                <span style={labelStyle}>区域划分</span>
                                <Switch
                                    checkedChildren={'显示'}
                                    unCheckedChildren={'不显示'}
                                    checked={showLines}
                                    onChange={setShowLines}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Divider />
                <Row align={'middle'} style={{ marginBottom: 25 }}>
                    <Col span={2} style={sectionStyle}>
                        区域作图选项
                    </Col>
                    <Col span={22}>
                        <Row align={'middle'} justify={'space-between'}>
                            <Col style={labelStyle} span={2}>
                                异常值包容度
                            </Col>
                            <Col span={20}>
                                <Row style={{ width: '100%' }}>
                                    {SchoolTypeList.map((type) => {
                                        const name = toSchoolTypeName(Number(type));
                                        return (
                                            <Col span={12} key={type.toString()}>
                                                <Row align={'middle'} style={{ width: '100%' }}>
                                                    <span
                                                        style={{
                                                            height: 10,
                                                            width: 10,
                                                            borderRadius: 15,
                                                            backgroundColor: toSchoolTypeColor(name),
                                                        }}
                                                    />
                                                    <span style={{ ...labelStyle, fontWeight: 'bold' }}>
                                                        {name}
                                                    </span>

                                                    <Slider
                                                        value={abnormalValue[name] ?? 50}
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        onChange={(v) =>
                                                            setAbnormalValue(pre => ({ ...pre, [name]: v }))
                                                        }
                                                        style={{ width: 200 }}
                                                    />
                                                </Row>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Divider />
                <Row align={'middle'} style={{ marginBottom: 15 }}>
                    <Col span={2} style={sectionStyle}>
                        坐标轴设置
                    </Col>
                    <Col flex={1}>
                        <Row>{getMenu(setXAxis, 'X轴科目', 'x', xAxis)}</Row>
                        <Row>{getMenu(setYAxis, 'Y轴科目', 'y', yAxis)}</Row>
                    </Col>
                </Row>
                <Divider />
                <Row align={'middle'} style={{ marginBottom: 25 }}>
                    <Col span={2} style={sectionStyle}>
                        毕业去向筛选
                    </Col>
                    <Col flex={1}>
                        <Checkbox.Group
                            options={extraCollegeTypes.map((i) => ({
                                label: i,
                                value: i,
                            }))}
                            value={checkedList}
                            onChange={(v) => {
                                setCheckedList(v as string[])
                            }}
                        />
                    </Col>
                </Row>
                <Divider />
                <Row align={'middle'} style={{ marginBottom: 25 }}>
                    <Col span={2} style={sectionStyle}>
                        考试数据选择
                    </Col>
                    <Col flex={1}>
                        <TreeSelect
                            onChange={(value: []) => {
                                const testSet = value.map((v) => {
                                    if (typeof v === 'number')
                                        return getTestsByYear(v)
                                    else
                                        return JSON.parse(v)

                                }).flat()
                                setSelectExams(testSet)
                            }}
                            treeData={treeData}
                            treeCheckable
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                            placeholder={'请选择要分析的考试(默认全选)'}
                            style={{ width: '100%' }}
                        />
                    </Col>
                </Row>
                <Divider />
                <Row style={{ position: 'relative' }}>
                    <Col
                        span={showPanel ? (isOpenPanel ? 15 : 19) : 24}
                        style={{ height: '100%' }}
                    >
                        <Chart {...chartConfig} />
                    </Col >
                    <Col
                        span={showPanel ? (isOpenPanel ? 9 : 5) : 0}
                        style={{ height: '100%', paddingTop: 40 }}
                    >
                        {
                            showPanel && (
                                <Collapse
                                    accordion
                                    style={{ width: '100%', marginTop: 5 }}
                                    onChange={v => {
                                        if (!v)
                                            setIsOpenPanel(false)
                                        if (v === '1' && curYear)
                                            setIsOpenPanel(true)
                                        else if (v === '2' && curStudent) {
                                            setIsOpenPanel(true)
                                            setIsOpenPersonImage(true)
                                        }
                                        else if (v === '3' && yearAndClass)
                                            setIsOpenPanel(true)
                                    }}
                                >
                                    <Collapse.Panel key={'1'} header={'年级画像'}>
                                        <GradeImage
                                            selectYears={selectYears}
                                            setIsOpenPanel={setIsOpenPanel}
                                            curYear={curYear}
                                            setCurYear={setCurYear}
                                        />
                                    </Collapse.Panel>
                                    <Collapse.Panel key={'2'} header={'个人画像'}>
                                        <PersonImage
                                            selectYears={selectYears}
                                            setIsOpenPanel={setIsOpenPanel}
                                            selectExams={selectExams}
                                            xAxis={xAxis}
                                            yAxis={yAxis}
                                            setMode={setMode}
                                            setIsOpenPersonImage={setIsOpenPersonImage}
                                            curStudent={curStudent}
                                            setCurStudent={setCurStudent}
                                        />
                                    </Collapse.Panel>
                                    <Collapse.Panel key={'3'} header={'班级画像'}>
                                        <ClassImage
                                            selectYears={selectYears}
                                            setIsOpenPanel={setIsOpenPanel}
                                            yearAndClass={yearAndClass}
                                            setYearAndClass={setYearAndClass}
                                        />
                                    </Collapse.Panel>

                                </Collapse>
                            )
                        }
                    </Col>
                    <Switch
                        checkedChildren={'画像选择已显示'}
                        unCheckedChildren={'画像选择已折叠'}
                        checked={showPanel}
                        onChange={v => {
                            setShowPanel(v)
                            if (!v) {
                                setIsOpenPanel(false)
                                setIsOpenPersonImage(false)
                            }
                        }}
                        style={{ position: 'absolute', right: 15, top: 5 }}
                    />
                </Row>
            </div >
        )
    }



